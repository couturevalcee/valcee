import {useOutletContext} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import {Heading} from '~/components/Text';
import {AccountDetails} from '~/components/AccountDetails';
import {AccountAddressBook} from '~/components/AccountAddressBook';

export default function AccountProfile() {
  const {customer} = useOutletContext();
  const addresses = flattenConnection(customer.addresses);

  return (
    <div className="space-y-8">
      <section>
        <Heading size="lead" className="mb-4">Profile & Security</Heading>
        <AccountDetails customer={customer} />
      </section>
      
      <section>
        <Heading size="lead" className="mb-4">Address Book</Heading>
        <AccountAddressBook addresses={addresses} customer={customer} />
      </section>
    </div>
  );
}
