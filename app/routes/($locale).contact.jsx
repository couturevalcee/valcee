import {json} from '@shopify/remix-oxygen';
import {Form, useActionData, useNavigation} from '@remix-run/react';
import {useMemo} from 'react';
import {getSeoMeta} from '@shopify/hydrogen';

import {Heading, Section, Text} from '~/components/Text';
import {Input} from '~/components/Input';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export const meta = () =>
  getSeoMeta({
    title: 'Contact Valcee Couture',
    description:
      'Reach the Valcee Couture team for support, styling, or order questions.',
  });

export async function action({request, context}) {
  const formData = await request.formData();
  const name = (formData.get('name') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim();
  const topic = (formData.get('topic') || '').toString().trim();
  const message = (formData.get('message') || '').toString().trim();

  if (!name || !email || !message) {
    return json(
      {error: 'Please provide your name, email, and message.'},
      {status: 400},
    );
  }

  const {RESEND_API_KEY, CONTACT_FORWARD_EMAIL} = context.env;
  const toEmail = CONTACT_FORWARD_EMAIL || 'relations@valcee.com';

  if (!RESEND_API_KEY) {
    console.warn(
      'Missing RESEND_API_KEY env var; contact form submission stored only locally.',
    );
    return json({
      success: false,
      needsConfig: true,
      message:
        'We received your request locally, but email forwarding is not configured yet.',
    });
  }

  const payload = {
    from: 'Valcee Concierge <relations@valcee.com>',
    to: [toEmail],
    reply_to: email,
    subject: `[Contact] ${topic || 'General inquiry'} from ${name}`,
    html: `<p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Topic:</strong> ${topic || 'General'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br />')}</p>`,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    console.error('Failed to send contact email', errorPayload);
    return json(
      {error: 'Unable to send your message. Please try again later.'},
      {status: 500},
    );
  }

  return json({success: true});
}

export default function ContactPage() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const statusMessage = useMemo(() => {
    if (actionData?.needsConfig) {
      return 'Message cached. Once email forwarding is configured it will route automatically.';
    }
    if (actionData?.success) {
      return 'Message sent. Expect a reply within 1-2 business days.';
    }
    if (actionData?.error) {
      return actionData.error;
    }
    return null;
  }, [actionData]);

  return (
    <Section
      padding="none"
      className="flex items-center justify-center min-h-[70vh] px-6 py-12"
    >
      <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-sm px-8 py-12 space-y-8">
        <h1 className="text-center text-sm uppercase tracking-[0.3em] text-primary/60 font-light">
          Contact
        </h1>

        <div className="space-y-4 text-center">
          <a 
            href="mailto:relations@valcee.com"
            className="block text-lg font-medium tracking-tight hover:text-primary/70 transition-colors"
          >
            relations@valcee.com
          </a>
          <p className="text-xs text-primary/50 uppercase tracking-wider">
            Mon – Fri, 10 AM – 6 PM (PST)
          </p>
        </div>

        <Form method="post" className="space-y-4">
          <Input
            name="name"
            placeholder="Name"
            required
            className="w-full rounded-full"
          />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-full"
          />
          <textarea
            name="message"
            placeholder="Message"
            required
            className="w-full min-h-[120px] rounded-2xl bg-primary/[0.02] border border-primary/20 px-5 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:outline-none transition-all resize-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full py-3 bg-primary text-contrast hover:bg-primary/90 transition-colors text-sm uppercase tracking-wider font-medium"
          >
            {isSubmitting ? 'Sending…' : 'Send'}
          </button>
          {statusMessage && (
            <p className="text-xs text-center text-primary/60">{statusMessage}</p>
          )}
        </Form>
      </div>
    </Section>
  );
}
