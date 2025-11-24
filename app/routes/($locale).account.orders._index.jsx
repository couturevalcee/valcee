import {useOutletContext, Link} from '@remix-run/react';
import {flattenConnection, Image} from '@shopify/hydrogen';
import {Text} from '~/components/Text';
import {statusMessage, usePrefixPathWithLocale} from '~/lib/utils';

export const handle = {
  renderInModal: true,
};

export default function AccountOrders() {
  const {customer} = useOutletContext();
  const orders = flattenConnection(customer.orders);

  return (
    <div className="space-y-4">
      {orders?.length ? <Orders orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/5 flex items-center justify-center">
        <PackageIcon className="w-8 h-8 text-primary/30" />
      </div>
      <Text className="text-primary/60 mb-4">No orders yet</Text>
      <Link
        to={usePrefixPathWithLocale('/')}
        className="inline-block px-6 py-2 rounded-full border border-primary/20 text-sm hover:bg-primary hover:text-contrast transition-colors"
      >
        Start Shopping
      </Link>
    </div>
  );
}

function Orders({orders}) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderRow({order}) {
  const firstLineItem = flattenConnection(order.lineItems ?? [])[0];
  const statusLabel = statusMessage(order.fulfillmentStatus) ?? 'Processing';
  const isDelivered = order.fulfillmentStatus === 'SUCCESS';
  const firstFulfillment = flattenConnection(order.fulfillments ?? {nodes: []})[0];
  const trackingUrl = firstFulfillment?.trackingInfo?.[0]?.url;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 hover:border-primary/20 transition-colors">
      {/* Product Image */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-primary/5 flex-shrink-0">
        {firstLineItem?.image?.url ? (
          <Image
            data={firstLineItem.image}
            width={56}
            height={56}
            className="w-full h-full object-cover"
            alt={firstLineItem.image.altText ?? firstLineItem.title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageIcon className="w-6 h-6 text-primary/20" />
          </div>
        )}
      </div>

      {/* Order Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text className="font-medium text-sm">#{order.number}</Text>
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
              isDelivered
                ? 'bg-green-100 text-green-700'
                : 'bg-primary/10 text-primary/70'
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <Text size="fine" className="text-primary/50">
          {new Date(order.processedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </div>

      {/* Price & Actions */}
      <div className="text-right flex-shrink-0">
        <Text className="font-medium text-sm">
          {formatMoney(order.totalPrice)}
        </Text>
        {trackingUrl && !isDelivered && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-primary/50 hover:text-primary uppercase tracking-wider"
          >
            Track
          </a>
        )}
      </div>
    </div>
  );
}

function formatMoney(money) {
  if (!money) return '';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

function PackageIcon({className}) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
