import {flattenConnection, Image} from '@shopify/hydrogen';
import {Heading, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {statusMessage} from '~/lib/utils';

/**
 * @param {{order: OrderCardFragment}}
 */
export function OrderCard({order}) {
  if (!order?.id) return null;

  const [legacyOrderId, key] = order.id.split('/').pop().split('?');
  const lineItems = flattenConnection(order?.lineItems);
  const hasLineItems = lineItems.length > 0;
  const primaryItem = hasLineItems ? lineItems[0] : null;
  const firstFulfillment = flattenConnection(order?.fulfillments)[0];
  const fulfillmentStatus = firstFulfillment?.status ?? order.fulfillmentStatus;
  const trackingInfo = firstFulfillment?.trackingInfo?.[0];
  const url = key
    ? `/account/orders/${legacyOrderId}?${key}`
    : `/account/orders/${legacyOrderId}`;

  return (
    <li className="grid text-center border border-primary/10 rounded-2xl overflow-hidden bg-contrast/90 backdrop-blur-sm shadow-sm">
      <Link
        className="grid items-center gap-4 p-5 md:gap-6 md:p-6 md:grid-cols-2"
        to={url}
        prefetch="intent"
      >
        {primaryItem?.image && (
          <div className="card-image aspect-square bg-primary/5">
            <Image
              width={168}
              height={168}
              className="w-full fadeIn cover"
              alt={primaryItem.image?.altText ?? 'Order image'}
              src={primaryItem.image.url}
            />
          </div>
        )}
        <div
          className={`flex-col justify-center text-left ${
            !primaryItem?.image && 'md:col-span-2'
          }`}
        >
          <Heading as="h3" format size="copy">
            {hasLineItems
              ? lineItems.length > 1
                ? `${primaryItem.title} +${lineItems.length - 1} more`
                : primaryItem.title
              : 'Order details'}
          </Heading>
          <dl className="grid grid-gap-1">
            <dt className="sr-only">Order ID</dt>
            <dd>
              <Text size="fine" color="subtle">
                Order No. {order.number}
              </Text>
            </dd>
            <dt className="sr-only">Order Date</dt>
            <dd>
              <Text size="fine" color="subtle">
                {new Date(order.processedAt).toDateString()}
              </Text>
            </dd>
            {fulfillmentStatus && (
              <>
                <dt className="sr-only">Fulfillment Status</dt>
                <dd className="mt-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      fulfillmentStatus === 'SUCCESS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-primary/5 text-primary/50'
                    }`}
                  >
                    <Text size="fine">{statusMessage(fulfillmentStatus)}</Text>
                  </span>
                </dd>
              </>
            )}
            {trackingInfo?.number && (
              <dd className="mt-2 text-xs text-gray-500">
                {trackingInfo.company ?? 'Carrier'} • #{trackingInfo.number}
              </dd>
            )}
          </dl>
        </div>
      </Link>
      <div className="flex border-t border-primary/10 divide-x divide-primary/10">
        <Link
          className="flex-1 block p-2 text-center"
          to={url}
          prefetch="intent"
        >
          <Text color="subtle" className="ml-3">
            View details
          </Text>
        </Link>
        {trackingInfo?.url && (
          <a
            className="flex-1 block p-2 text-center text-sm text-primary"
            href={trackingInfo.url}
            target="_blank"
            rel="noreferrer"
          >
            <Text color="primary" className="ml-3">
              Track package
            </Text>
          </a>
        )}
      </div>
    </li>
  );
}

export const ORDER_CARD_FRAGMENT = `#graphql
  fragment OrderCard on Order {
    id
    orderNumber
    processedAt
    financialStatus
    fulfillmentStatus
    currentTotalPrice {
      amount
      currencyCode
    }
    lineItems(first: 2) {
      edges {
        node {
          variant {
            image {
              url
              altText
              height
              width
            }
          }
          title
        }
      }
    }
  }
`;

/** @typedef {import('customer-accountapi.generated').OrderCardFragment} OrderCardFragment */
