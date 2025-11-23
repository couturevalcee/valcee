import {json} from '@shopify/remix-oxygen';
import {Form, useActionData, useNavigation, useOutletContext} from '@remix-run/react';
import {Heading, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {CUSTOMER_CONTACT_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerContactMutation';

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
  // Get current history
  const {data} = await context.customerAccount.query(`#graphql
    query getHistory {
      customer {
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
  const {errors} = await context.customerAccount.mutate(CUSTOMER_CONTACT_UPDATE_MUTATION, {
    variables: {
      metafields: [
        {
          namespace: 'custom',
          key: 'message_history',
          type: 'json',
          value: JSON.stringify(history)
        }
      ]
    }
  });

  if (errors) return json({error: 'Failed to save history'}, {status: 500});

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
    <div className="grid lg:grid-cols-2 gap-12">
      <div>
        <Heading size="lead" className="mb-4">Concierge Service</Heading>
        <Text className="mb-6">
          Send us a message regarding your orders, styling advice, or any other inquiries.
        </Text>
        
        {actionData?.success ? (
          <div className="p-4 bg-green-50 text-green-800 rounded-lg mb-6">
            Message sent successfully. We will get back to you shortly.
          </div>
        ) : null}

        <Form method="post" className="space-y-4">
          <label className="block">
            <span className="text-sm text-primary/60">Topic</span>
            <select name="topic" className="w-full mt-1 border-primary/10 rounded-lg px-3 py-2 bg-transparent">
              <option>Order Inquiry</option>
              <option>Styling Advice</option>
              <option>Returns & Exchanges</option>
              <option>Other</option>
            </select>
          </label>
          
          <label className="block">
            <span className="text-sm text-primary/60">Message</span>
            <textarea 
              name="message" 
              rows={5} 
              required
              className="w-full mt-1 border border-primary/10 rounded-lg px-3 py-2 bg-transparent"
            />
          </label>

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </Form>
      </div>

      <div>
        <Heading size="lead" className="mb-4">Message History</Heading>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((msg) => (
              <div key={msg.id} className="p-4 border border-primary/10 rounded-lg bg-contrast/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{msg.topic}</span>
                  <span className="text-xs text-primary/60">{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <Text size="fine" className="whitespace-pre-wrap">{msg.message}</Text>
                <div className="mt-2 text-xs text-primary/40 uppercase tracking-wider">
                  {msg.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Text color="subtle">No previous messages.</Text>
        )}
      </div>
    </div>
  );
}
