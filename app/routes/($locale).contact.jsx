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
      className="px-4 md:px-8 max-w-4xl mx-auto py-10 sm:py-14 space-y-10"
    >
      <header className="space-y-4 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/60">
          Concierge desk
        </p>
        <Heading
          as="h1"
          size="display"
          className="text-4xl sm:text-5xl tracking-tight uppercase"
        >
          Contact Valcee
        </Heading>
        <Text className="opacity-80 leading-relaxed">
          Couture made personal. Reach out for sizing help, preorder timelines,
          or bespoke requests. Call us at{' '}
          <a href="tel:+17785866660" className="border-b border-primary/40">
            778-586-6660
          </a>{' '}
          or use the form below for concierge support.
        </Text>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-primary/10 bg-contrast/90 backdrop-blur-sm px-6 py-5 space-y-2 shadow-sm">
            <Text
              as="p"
              className="text-xs uppercase tracking-[0.3em] text-primary/60"
            >
              Preferred inbox
            </Text>
            <Text as="p" className="text-xl font-semibold tracking-tight">
              relations@valcee.com
            </Text>
            <Text as="p" className="text-sm opacity-80 leading-relaxed">
              Configure this alias with your mail provider and add the address
              to the <code>CONTACT_FORWARD_EMAIL</code> env variable so
              submissions reach your team automatically.
            </Text>
          </div>

          <div className="rounded-xl border border-primary/10 bg-contrast/95 backdrop-blur-sm px-6 py-5 space-y-3 shadow-sm">
            <div>
              <Text
                as="p"
                className="text-xs uppercase tracking-[0.3em] text-primary/60"
              >
                Studio hours
              </Text>
              <Text as="p" className="text-base">
                Mon – Fri, 10 AM – 6 PM (PST)
              </Text>
              <Text as="p" className="text-base">
                Weekends by appointment
              </Text>
            </div>
            <div className="pt-3 border-t border-primary/10">
              <Text
                as="p"
                className="text-xs uppercase tracking-[0.3em] text-primary/60"
              >
                Legacy inbox
              </Text>
              <Text as="p" className="text-base">
                coutureValcee@gmail.com — use the form or preferred inbox for
                fastest routing.
              </Text>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-contrast/95 backdrop-blur-sm px-8 py-8 space-y-6 shadow-lg">
          <Form method="post" className="grid gap-4">
            <Input
              name="name"
              placeholder="Your name"
              required
              className="w-full"
            />
            <Input
              name="email"
              type="email"
              placeholder="Your email"
              required
              className="w-full"
            />
            <Input
              name="topic"
              placeholder="Topic (order status, preorder, styling...)"
              className="w-full"
            />
            <textarea
              name="message"
              placeholder="How can we help?"
              required
              className="min-h-[160px] rounded-xl bg-primary/[0.02] border border-primary/20 px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="tap uppercase tracking-[0.3em] text-xs sm:text-sm border border-primary/30 hover:border-primary/50 rounded-lg px-8 py-3.5 w-full sm:w-auto sm:justify-self-start transition-all hover:bg-primary/5"
            >
              {isSubmitting ? 'Sending…' : 'Send'}
            </button>
            {statusMessage && (
              <Text className="text-sm opacity-80">{statusMessage}</Text>
            )}
          </Form>
        </div>
      </div>
    </Section>
  );
}
