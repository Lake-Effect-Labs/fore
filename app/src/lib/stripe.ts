import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  });
}

// Price IDs for subscriptions (stubbed - replace with real ones in production)
export const STRIPE_PRICES = {
  PREMIUM_MONTHLY: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
  PREMIUM_YEARLY: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
};

/**
 * Create a Stripe Checkout session for premium subscription
 * @param userId - The user initiating the checkout
 * @param priceId - The Stripe price ID for the subscription
 * @param successUrl - URL to redirect to on successful payment
 * @param cancelUrl - URL to redirect to if checkout is canceled
 * @param organizationId - Optional organization ID for B2B subscriptions
 * @param customerEmail - Optional email to prefill in checkout
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  organizationId?: string,
  customerEmail?: string
) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    customer_email: customerEmail,
    metadata: {
      userId,
      ...(organizationId && { organizationId }),
    },
    subscription_data: {
      metadata: {
        userId,
        ...(organizationId && { organizationId }),
      },
    },
  });

  return session;
}

/**
 * Create a portal session for managing subscription
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get customer by user ID from metadata
 */
export async function getCustomerByUserId(userId: string) {
  const stripe = getStripe();
  // Search for customer with matching metadata
  const customers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  });

  return customers.data[0] || null;
}

/**
 * Create a customer for a user
 */
export async function createCustomer(userId: string, email: string) {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer;
}
