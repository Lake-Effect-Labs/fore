import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Types for subscription metadata stored in organizations
interface SubscriptionMetadata {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  price_id: string;
  status: Stripe.Subscription.Status;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}

// Error logging helper (replace with your preferred logging service)
function logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // In production, send to logging service (e.g., Sentry, LogRocket, etc.)
  // For now, we use structured console.error which can be captured by hosting platforms
  if (process.env.NODE_ENV === 'production') {
    // Production: structured logging for log aggregation services
    console.error(JSON.stringify({
      level: 'error',
      context,
      message: errorMessage,
      stack: errorStack,
      metadata,
      timestamp: new Date().toISOString(),
    }));
  } else {
    // Development: more readable format
    console.error(`[${context}]`, errorMessage, metadata);
  }
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  });
}

// Create a Supabase client with service role for webhook operations
// This bypasses RLS since webhooks don't have user context
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Map Stripe subscription status to our tier
function getSubscriptionTier(status: Stripe.Subscription.Status): 'free' | 'premium' {
  const activeTiers: Stripe.Subscription.Status[] = ['active', 'trialing'];
  return activeTiers.includes(status) ? 'premium' : 'free';
}

// Map Stripe subscription status to our subscription_status field
function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };
  return statusMap[status] || 'unknown';
}

/**
 * Handle checkout.session.completed event
 * This fires when a customer successfully completes the checkout flow
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = getSupabaseAdmin();
  const stripe = getStripe();

  // Get user ID and organization ID from session metadata
  const userId = session.metadata?.userId || session.client_reference_id;
  const organizationId = session.metadata?.organizationId;

  if (!userId) {
    throw new Error('No user ID found in checkout session metadata');
  }

  // Get the subscription details if this was a subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    // Get billing period from the first subscription item (2025+ API uses item-level periods)
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start;
    const currentPeriodEnd = firstItem?.current_period_end;

    // Build subscription metadata
    const subscriptionMetadata: SubscriptionMetadata = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId || '',
      price_id: firstItem?.price.id || '',
      status: subscription.status,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : new Date().toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    };

    if (organizationId) {
      // B2B flow: Update organization subscription
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          subscription_tier: getSubscriptionTier(subscription.status),
          subscription_status: mapSubscriptionStatus(subscription.status),
          stripe_customer_id: customerId,
        })
        .eq('id', organizationId);

      if (orgError) {
        throw new Error(`Failed to update organization: ${orgError.message}`);
      }

      // Also update settings with subscription details using a separate query
      // to merge with existing settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single();

      const existingSettings = (org?.settings as Record<string, unknown>) || {};

      const { error: settingsError } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...existingSettings,
            subscription: subscriptionMetadata,
          },
        })
        .eq('id', organizationId);

      if (settingsError) {
        logError('handleCheckoutCompleted', settingsError, { organizationId });
      }
    } else {
      // Individual user flow: Update user's profile or create a user subscription record
      // Check if there's a user_subscriptions table, otherwise store in profile metadata
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          // Add subscription fields if they exist on profiles table
          // Otherwise this could be a separate subscriptions table
        })
        .eq('id', userId);

      if (profileError) {
        // Profile might not have subscription fields, log but don't fail
        logError('handleCheckoutCompleted', 'Profile update skipped - no subscription fields', { userId });
      }

      // Try to insert into a subscriptions table if it exists
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          price_id: subscriptionMetadata.price_id,
          status: subscription.status,
          current_period_start: subscriptionMetadata.current_period_start,
          current_period_end: subscriptionMetadata.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscriptionMetadata.canceled_at,
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        // Table might not exist, log for debugging
        logError('handleCheckoutCompleted', subError, {
          userId,
          note: 'subscriptions table may not exist'
        });
      }
    }
  }
}

/**
 * Handle subscription created/updated events
 * This fires when subscription status changes (renewal, update, etc.)
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin();

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Get billing period from the first subscription item (2025+ API uses item-level periods)
  const firstItem = subscription.items.data[0];
  const currentPeriodStart = firstItem?.current_period_start;
  const currentPeriodEnd = firstItem?.current_period_end;

  // Build subscription metadata
  const subscriptionMetadata: SubscriptionMetadata = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    price_id: firstItem?.price.id || '',
    status: subscription.status,
    current_period_start: currentPeriodStart
      ? new Date(currentPeriodStart * 1000).toISOString()
      : new Date().toISOString(),
    current_period_end: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : new Date().toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  };

  // Find organization by stripe_customer_id
  const { data: org, error: orgFindError } = await supabase
    .from('organizations')
    .select('id, settings')
    .eq('stripe_customer_id', customerId)
    .single();

  if (org) {
    // Update organization subscription
    const existingSettings = (org.settings as Record<string, unknown>) || {};

    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        subscription_tier: getSubscriptionTier(subscription.status),
        subscription_status: mapSubscriptionStatus(subscription.status),
        settings: {
          ...existingSettings,
          subscription: subscriptionMetadata,
        },
      })
      .eq('id', org.id);

    if (orgError) {
      throw new Error(`Failed to update organization subscription: ${orgError.message}`);
    }
    return;
  }

  // If no org found, try to find user subscription
  if (orgFindError?.code !== 'PGRST116') {
    // PGRST116 is "not found" - any other error should be logged
    logError('handleSubscriptionChange', orgFindError, { customerId });
  }

  // Try to update subscriptions table for individual users
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: subscriptionMetadata.price_id,
      current_period_start: subscriptionMetadata.current_period_start,
      current_period_end: subscriptionMetadata.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscriptionMetadata.canceled_at,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    logError('handleSubscriptionChange', subError, {
      subscriptionId: subscription.id,
      note: 'Could not find organization or user subscription to update'
    });
  }
}

/**
 * Handle subscription deleted event
 * This fires when a subscription is fully canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin();

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Find and downgrade organization
  const { data: org, error: orgFindError } = await supabase
    .from('organizations')
    .select('id, settings')
    .eq('stripe_customer_id', customerId)
    .single();

  if (org) {
    const existingSettings = (org.settings as Record<string, unknown>) || {};

    // Remove subscription from settings and downgrade to free
    const { subscription: _removed, ...restSettings } = existingSettings;

    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
        settings: {
          ...restSettings,
          subscription_canceled_at: new Date().toISOString(),
          last_subscription_id: subscription.id,
        },
      })
      .eq('id', org.id);

    if (orgError) {
      throw new Error(`Failed to downgrade organization: ${orgError.message}`);
    }

    // Perform any cleanup tasks
    // e.g., disable premium features, notify admins, etc.
    return;
  }

  if (orgFindError?.code !== 'PGRST116') {
    logError('handleSubscriptionDeleted', orgFindError, { customerId });
  }

  // Try to update subscriptions table for individual users
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    logError('handleSubscriptionDeleted', subError, {
      subscriptionId: subscription.id,
      note: 'Could not find organization or user subscription to cancel'
    });
  }
}

/**
 * Handle invoice payment failed event
 * This fires when a payment attempt fails
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = getSupabaseAdmin();

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) {
    logError('handleInvoicePaymentFailed', 'No customer ID on invoice', { invoiceId: invoice.id });
    return;
  }

  // Find organization and update status
  const { data: org } = await supabase
    .from('organizations')
    .select('id, settings')
    .eq('stripe_customer_id', customerId)
    .single();

  if (org) {
    const existingSettings = (org.settings as Record<string, unknown>) || {};

    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'past_due',
        settings: {
          ...existingSettings,
          payment_failed_at: new Date().toISOString(),
          payment_failure_count: ((existingSettings.payment_failure_count as number) || 0) + 1,
        },
      })
      .eq('id', org.id);

    if (orgError) {
      logError('handleInvoicePaymentFailed', orgError, { organizationId: org.id });
    }
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logError('webhook', 'Webhook secret not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logError('webhook.signature', err, { sig: sig.substring(0, 20) + '...' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        // Payment succeeded - subscription handlers will update the status
        // This can be used for sending receipts or other notifications
        break;
      }

      default:
        // Unhandled event types are silently ignored
        // Add logging here if you want to track which events you're receiving
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logError('webhook.handler', err, { eventType: event.type, eventId: event.id });

    // Return 500 so Stripe will retry the webhook
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
