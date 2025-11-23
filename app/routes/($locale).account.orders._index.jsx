import {useOutletContext} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import {Heading, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {OrderCard} from '~/components/OrderCard';
import {usePrefixPathWithLocale} from '~/lib/utils';

export default function AccountOrders() {
  const {customer} = useOutletContext();
  const orders = flattenConnection(customer.orders);

  return (
    <div className="space-y-6">
      <Heading size="lead">Order History</Heading>
      {orders?.length ? <Orders orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div>
      <Text className="mb-1" size="fine" width="narrow" as="p">
        You haven&apos;t placed any orders yet.
      </Text>
      <div className="w-48">
        <Button
          className="w-full mt-2 text-sm"
          variant="secondary"
          to={usePrefixPathWithLocale('/')}
        >
          Start Shopping
        </Button>
      </div>
    </div>
  );
}

function Orders({orders}) {
  return (
    <ul className="grid grid-flow-row grid-cols-1 gap-2 gap-y-6 md:gap-4 lg:gap-6 false sm:grid-cols-2">
      {orders.map((order) => (
        <OrderCard order={order} key={order.id} />
      ))}
    </ul>
  );
}
