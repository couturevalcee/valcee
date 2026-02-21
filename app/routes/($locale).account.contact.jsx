import {json} from '@shopify/remix-oxygen';
import {Form, useActionData, useNavigation, useOutletContext} from '@remix-run/react';
import {Text} from '~/components/Text';
import {CUSTOMER_CONTACT_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerContactMutation';

export const handle = {
  renderInModal: true,
};

export async function action({request, context}) {
  if (!(await context.customerAccount.isLoggedIn())) {
    return json({error: 'Unauthorized'}, {status: 401});
  }

  const formData = await request.formData();
  const topic = (formData.get('topic') || '').toString().trim();
  const message = (formData.get('message') || '').toString().trim();

  if (!message) {
    return json({error: 'Message is required'}, {status: 400});
  }

  // Fetch customer details including email and message history
  const {data} = await context.customerAccount.query(`#graphql
    query getContactHistoryAndEmail {
      customer {
        id
        firstName
        lastName
        emailAddress {
          emailAddress
        }
        metafield(namespace: "custom", key: "message_history") {
          value
        }
      }
    }
  `);

  const customerId = data?.customer?.id;
  if (!customerId) {
    return json({error: 'Customer not found'}, {status: 400});
  }

  const customerEmail = data?.customer?.emailAddress?.emailAddress;
  const customerName = [data?.customer?.firstName, data?.customer?.lastName]
    .filter(Boolean)
    .join(' ') || 'Customer';

  // 1. Send Email via Resend
  const {RESEND_API_KEY, CONTACT_FORWARD_EMAIL} = context.env;
  const toEmail = CONTACT_FORWARD_EMAIL || 'couture@valcee.com';

  if (RESEND_API_KEY) {
    const emailPayload = {
      from: 'Valcee Couture <couture@valcee.com>',
      to: [toEmail],
      reply_to: customerEmail || undefined,
      subject: `[Account Help] ${topic || 'General'} — ${customerName}`,
      html: `<p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail || 'unknown'}</p>
        <p><strong>Topic:</strong> ${topic || 'General'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>`,
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const errBody = await resendResponse.json().catch(() => ({}));
      console.error('Resend failed for account contact:', errBody);
    }
  }

  // 2. Update History in metafield
  let history = [];
  try {
    history = JSON.parse(data?.customer?.metafield?.value || '[]');
  } catch (e) {
    history = [];
  }

  const newMessage = {
    id: new Date().toISOString(),
    date: new Date().toISOString(),
    topic,
    message,
    status: 'Sent',
  };

  history.unshift(newMessage);

  const {data: mutationData, errors} = await context.customerAccount.mutate(
    CUSTOMER_CONTACT_UPDATE_MUTATION,
    {
      variables: {
        metafields: [
          {
            ownerId: customerId,
            namespace: 'custom',
            key: 'message_history',
            type: 'json',
            value: JSON.stringify(history),
          },
        ],
      },
    },
  );

  if (errors || mutationData?.metafieldsSet?.userErrors?.length) {
    return json({error: 'Failed to save history'}, {status: 500});
  }

  return json({success: true});
}

export default function AccountContact() {
  const {customer} = useOutletContext();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  let history = [];
  try {
    history = JSON.parse(customer.messageHistory?.value || '[]');
  } catch (e) {
    history = [];
  }

  return (
    <div className="space-y-6">
      {/* Contact Form */}
      <div>
        {actionData?.success ? (
          <div className="p-3 bg-green-500/10 text-green-700 rounded-xl mb-4 text-sm">
            Message sent successfully.
          </div>
        ) : null}

        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-xs text-primary/50 mb-1.5">
              Topic
            </label>
            <select
              name="topic"
              className="w-full border border-primary/10 rounded-xl px-3 py-2.5 bg-transparent text-sm focus:outline-none focus:border-primary/30 appearance-none"
            >
              <option>Order Inquiry</option>
              <option>Styling Advice</option>
              <option>Returns & Exchanges</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-primary/50 mb-1.5">
              Message
            </label>
            <textarea
              name="message"
              rows={4}
              required
              placeholder="How can we help?"
              className="w-full border border-primary/10 rounded-xl px-3 py-2.5 bg-transparent text-sm focus:outline-none focus:border-primary/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-full bg-primary text-contrast text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </Form>
      </div>

      {/* Message History */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-primary/40 mb-3">
          Message History
        </h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice(0, 3).map((msg) => (
              <div
                key={msg.id}
                className="p-3 border border-primary/[0.08] rounded-xl bg-contrast/30"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-xs">{msg.topic}</span>
                  <span className="text-[10px] text-primary/40">
                    {new Date(msg.date).toLocaleDateString()}
                  </span>
                </div>
                <Text size="fine" className="text-primary/60 line-clamp-2">
                  {msg.message}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-primary/10 bg-primary/[0.02] p-8 text-center">
            <Text size="fine" className="text-primary/40">
              No previous messages.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
