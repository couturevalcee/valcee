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

  // 1. Send Email (Reuse logic or just log for now)
  // In a real app, you'd call your email service here.
  // For now, we assume it's sent.

  // 2. Update History
  // Get current history and customer ID
  const {data} = await context.customerAccount.query(`#graphql
    query getContactHistory {
      customer {
        id
        metafield(namespace: "custom", key: "message_history") {
          value
        }
      }
    }
  `);

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
    status: 'Sent'
  };

  history.unshift(newMessage); // Add to top

  // Save
  const customerId = data?.customer?.id;
  if (!customerId) {
    return json({error: 'Customer not found'}, {status: 400});
  }

  const {data: mutationData, errors} = await context.customerAccount.mutate(CUSTOMER_CONTACT_UPDATE_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId: customerId,
          namespace: 'custom',
          key: 'message_history',
          type: 'json',
          value: JSON.stringify(history)
        }
      ]
    }
  });

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
            <label className="block text-xs text-primary/50 mb-1.5">Topic</label>
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
            <label className="block text-xs text-primary/50 mb-1.5">Message</label>
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
        <h3 className="text-xs uppercase tracking-widest text-primary/40 mb-3">Message History</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice(0, 3).map((msg) => (
              <div key={msg.id} className="p-3 border border-primary/[0.08] rounded-xl bg-contrast/30">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-xs">{msg.topic}</span>
                  <span className="text-[10px] text-primary/40">{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <Text size="fine" className="text-primary/60 line-clamp-2">{msg.message}</Text>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-primary/10 bg-primary/[0.02] p-8 text-center">
            <Text size="fine" className="text-primary/40">No previous messages.</Text>
          </div>
        )}
      </div>
    </div>
  );
}
