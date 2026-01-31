'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Event, EventRegistration } from '@/types/b2b';
import {
  Copy,
  Check,
  Mail,
  MessageCircle,
  Share2,
  Link as LinkIcon,
  QrCode,
  Users,
  Send,
} from 'lucide-react';

interface ShareInviteProps {
  event: Event & {
    organization?: { name: string; slug: string };
  };
  eventUrl: string | null;
  registrations: (EventRegistration & {
    profile: {
      id: string;
      email: string;
      full_name: string | null;
    };
  })[];
}

export function ShareInvite({ event, eventUrl, registrations }: ShareInviteProps) {
  const [copied, setCopied] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const shareUrl = eventUrl || `${window.location.origin}/events/${event.id}`;

  const shareMessage = `You're invited to ${event.name}!\n\n` +
    `📅 ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n` +
    (event.start_time ? `⏰ ${event.start_time}\n` : '') +
    (event.entry_fee ? `💵 $${event.entry_fee} entry\n` : '') +
    `\nSign up here: ${shareUrl}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`You're invited to ${event.name}`);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(shareMessage);
    window.open(`sms:?body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${text}`);
  };

  const handleSendInvites = async () => {
    // Parse emails
    const emails = inviteEmails
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes('@'));

    if (emails.length === 0) return;

    setIsSending(true);
    // In production, this would call a server action to send emails
    // For now, we'll simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);
    setSendSuccess(true);
    setInviteEmails('');
    setTimeout(() => setSendSuccess(false), 3000);
  };

  const confirmedEmails = registrations
    .filter((r) => r.status === 'confirmed' || r.status === 'pending')
    .map((r) => r.profile.email);

  return (
    <div className="space-y-6">
      {/* Share Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-[#c9a962]" />
            Event Link
          </CardTitle>
          <CardDescription>
            Share this link with players to let them register
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!event.slug ? (
            <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
              <p className="text-sm text-yellow-400">
                Set a URL slug in Settings to create a shareable event page.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button onClick={copyLink} variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={shareViaEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={shareViaSMS}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button variant="outline" size="sm" onClick={shareViaWhatsApp}>
                  <Share2 className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={copyMessage}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#c9a962]" />
            Invite Players
          </CardTitle>
          <CardDescription>
            Send email invitations directly to players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e8f5f0] mb-2">
              Email Addresses
            </label>
            <textarea
              className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-[#e8f5f0] placeholder:text-[#a8d4c0]/50 focus:border-[#c9a962] focus:outline-none focus:ring-1 focus:ring-[#c9a962]"
              rows={3}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="Enter email addresses (comma or newline separated)"
            />
            <p className="text-xs text-[#a8d4c0] mt-1">
              Players will receive an email with a link to register
            </p>
          </div>

          {sendSuccess && (
            <div className="rounded-lg bg-green-900/20 p-3 text-sm text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Invitations sent successfully!
            </div>
          )}

          <Button
            onClick={handleSendInvites}
            disabled={isSending || !inviteEmails.trim()}
            isLoading={isSending}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Invitations
          </Button>
        </CardContent>
      </Card>

      {/* Preview Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#c9a962]" />
            Share Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-[#002418] border border-[#004d35] p-4">
            <pre className="whitespace-pre-wrap text-sm text-[#e8f5f0] font-sans">
              {shareMessage}
            </pre>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={copyMessage}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Message
          </Button>
        </CardContent>
      </Card>

      {/* Already Registered */}
      {confirmedEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" />
              Already Registered ({confirmedEmails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {confirmedEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center rounded-full bg-[#004d35] px-3 py-1 text-xs text-[#e8f5f0]"
                >
                  {email}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[#c9a962]" />
            QR Code
          </CardTitle>
          <CardDescription>
            Print or display for easy scanning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#004d35] p-8">
            <QrCode className="h-32 w-32 text-[#004d35]" />
            <p className="mt-4 text-sm text-[#a8d4c0]">
              QR code generation coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
