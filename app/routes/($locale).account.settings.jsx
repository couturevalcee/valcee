import {json, redirect} from '@shopify/remix-oxygen';
import {useOutletContext, Form, useNavigation, useActionData} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import {Text} from '~/components/Text';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {doLogout} from './($locale).account_.logout';

export const handle = {
  renderInModal: true,
};

export const action = async ({request, context, params}) => {
  const formData = await request.formData();
  const localePrefix = params.locale ? `/${params.locale}` : '';

  if (!(await context.customerAccount.isLoggedIn())) {
    throw await doLogout(context);
  }

  const intent = formData.get('intent');

  if (intent === 'updateProfile') {
    try {
      const customer = {};
      const firstName = formData.get('firstName');
      const lastName = formData.get('lastName');
      
      if (firstName) customer.firstName = firstName;
      if (lastName) customer.lastName = lastName;

      const {data, errors} = await context.customerAccount.mutate(
        CUSTOMER_UPDATE_MUTATION,
        {variables: {customer}},
      );

      if (errors?.length) {
        return json({error: errors[0].message}, {status: 400});
      }

      if (data?.customerUpdate?.userErrors?.length) {
        return json({error: data.customerUpdate.userErrors[0].message}, {status: 400});
      }

      return json({success: true, message: 'Profile updated'});
    } catch (error) {
      return json({error: error?.message || 'Failed to update profile'}, {status: 400});
    }
  }

  return json({error: 'Invalid action'}, {status: 400});
};

export default function AccountSettings() {
  const {customer} = useOutletContext();
  const addresses = flattenConnection(customer.addresses);
  const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
  const navigation = useNavigation();
  const actionData = useActionData();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <section>
        <Text className="text-xs uppercase tracking-widest text-primary/50 mb-3">Profile</Text>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="updateProfile" />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-primary/60 mb-1">First name</label>
              <input
                type="text"
                name="firstName"
                defaultValue={customer.firstName || ''}
                className="w-full px-3 py-2 rounded-lg border border-primary/10 bg-transparent text-sm focus:outline-none focus:border-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/60 mb-1">Last name</label>
              <input
                type="text"
                name="lastName"
                defaultValue={customer.lastName || ''}
                className="w-full px-3 py-2 rounded-lg border border-primary/10 bg-transparent text-sm focus:outline-none focus:border-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-primary/60 mb-1">Email</label>
            <input
              type="email"
              value={customer.emailAddress?.emailAddress || ''}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-primary/10 bg-primary/5 text-sm text-primary/50"
            />
          </div>

          {actionData?.error && (
            <Text size="fine" className="text-red-500">{actionData.error}</Text>
          )}
          {actionData?.success && (
            <Text size="fine" className="text-green-600">{actionData.message}</Text>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-full bg-primary text-contrast text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </Form>
      </section>

      {/* Address Section */}
      <section>
        <Text className="text-xs uppercase tracking-widest text-primary/50 mb-3">Default Address</Text>
        {defaultAddress ? (
          <div className="p-4 rounded-xl border border-primary/10 bg-primary/[0.02]">
            <div className="space-y-1 text-sm">
              {defaultAddress.firstName && defaultAddress.lastName && (
                <Text>{defaultAddress.firstName} {defaultAddress.lastName}</Text>
              )}
              {defaultAddress.address1 && <Text className="text-primary/70">{defaultAddress.address1}</Text>}
              {defaultAddress.address2 && <Text className="text-primary/70">{defaultAddress.address2}</Text>}
              <Text className="text-primary/70">
                {[defaultAddress.city, defaultAddress.zoneCode, defaultAddress.zip]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              {defaultAddress.country && <Text className="text-primary/70">{defaultAddress.country}</Text>}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-primary/20 text-center">
            <Text size="fine" className="text-primary/50">No address saved</Text>
          </div>
        )}
      </section>

      {/* Phone Section */}
      <section>
        <Text className="text-xs uppercase tracking-widest text-primary/50 mb-3">Phone</Text>
        <div className="p-4 rounded-xl border border-primary/10 bg-primary/[0.02]">
          <Text className="text-sm">
            {customer.phoneNumber?.phoneNumber || 'Not set'}
          </Text>
        </div>
      </section>
    </div>
  );
}
