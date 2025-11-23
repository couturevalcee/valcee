import {useOutletContext} from '@remix-run/react';
import {flattenConnection, Image} from '@shopify/hydrogen';
import {Heading, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {statusMessage, usePrefixPathWithLocale} from '~/lib/utils';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {Suspense} from 'react';
import {Await} from '@remix-run/react';

export default function AccountOverview() {
  const {customer, featuredDataPromise} = useOutletContext();
  const orders = flattenConnection(customer.orders);

  return (
    <div className="space-y-8">
      <AccountSummary orders={orders} />
      <ActiveOrders orders={orders} />
      <PurchaseHistory orders={orders} />
      <AccountRecommendations
        orders={orders}
        featuredDataPromise={featuredDataPromise}
      />
    </div>
  );
}

function AccountSummary({orders}) {
  if (!orders?.length) {
    return (
      <section>
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-6 py-5 space-y-2">
          <Heading size="lead">Create your Valcee archive</Heading>
          <Text>
            Once you place an order, your wardrobe value, delivery status, and tailor-made suggestions will live here.
          </Text>
        </div>
      </section>
    );
  }

  const currency = orders[0]?.totalPrice?.currencyCode ?? 'CAD';
  const lifetimeValue = orders.reduce(
    (acc, order) => acc + Number(order?.totalPrice?.amount ?? 0),
    0,
  );
  const lastPurchase = orders[0];
  const summary = [
    {label: 'Orders placed', value: orders.length},
    {label: 'Lifetime spend', value: formatCurrency(lifetimeValue, currency)},
    {
      label: 'Last purchase',
      value: lastPurchase
        ? new Date(lastPurchase.processedAt).toLocaleDateString()
        : '—',
    },
  ];

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
    </section>
  );
}

function SummaryCard({label, value}) {
  return (
    <div className="rounded-2xl border border-primary/15 px-5 py-4 bg-contrast/80">
      <Text size="fine" className="uppercase tracking-[0.3em] text-primary/60">
        {label}
      </Text>
      <Heading as="p" size="display" className="text-3xl mt-2 tracking-tight">
        {value}
      </Heading>
    </div>
  );
}

function ActiveOrders({orders}) {
  if (!orders?.length) return null;
  const openOrders = orders.filter(
    (order) => order.fulfillmentStatus && order.fulfillmentStatus !== 'SUCCESS',
  );
  if (!openOrders.length) return null;

  return (
    <section>
      <div className="rounded-2xl border border-primary/15 px-5 py-5 space-y-4">
        <Heading size="lead">Active orders</Heading>
        <ul className="space-y-3">
          {openOrders.slice(0, 3).map((order) => {
            const firstFulfillment = flattenConnection(order.fulfillments ?? {nodes: []})[0];
            const trackingUrl = firstFulfillment?.trackingInfo?.[0]?.url;
            const statusLabel = statusMessage(order.fulfillmentStatus) ?? 'Processing';
            return (
              <li
                key={order.id}
                className="flex flex-col gap-1 rounded-xl border border-primary/10 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <Text className="text-sm">Order No. {order.number}</Text>
                  <Text size="fine" color="subtle">
                    Placed {new Date(order.processedAt).toLocaleDateString()}
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      order.fulfillmentStatus === 'SUCCESS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {statusLabel}
                  </span>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs uppercase tracking-[0.3em] border-b border-primary/40"
                    >
                      Track
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function PurchaseHistory({orders}) {
  if (!orders?.length) return null;
  const purchases = collectPurchasedItems(orders);
  if (!purchases.length) return null;

  return (
    <section className="space-y-3">
      <Heading size="lead">Pieces in your archive</Heading>
      <Text className="opacity-80">
        A quick view of the styles you picked up recently—use it to plan outfits or share with your stylist.
      </Text>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {purchases.map((item) => (
          <div
            key={`${item.title}-${item.date}`}
            className="min-w-[160px] max-w-[200px] rounded-2xl border border-primary/15 bg-contrast/90"
          >
            {item.image?.url ? (
              <Image
                data={item.image}
                width={200}
                height={200}
                className="w-full h-40 object-cover rounded-t-2xl"
                alt={item.image.altText ?? item.title}
              />
            ) : (
              <div className="h-40 rounded-t-2xl bg-primary/5" />
            )}
            <div className="p-3 space-y-1">
              <Text className="font-semibold text-sm">{item.title}</Text>
              <Text size="fine" color="subtle">
                Last ordered {item.date}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccountRecommendations({orders, featuredDataPromise}) {
  return (
    <section className="space-y-4">
      <Heading size="lead">
        {orders?.length ? 'Recommended for your wardrobe' : 'Start your Valcee collection'}
      </Heading>
      <Text className="opacity-80">
        {orders?.length
          ? 'Fresh drops and capsule staples that complement what you already own.'
          : 'Explore atelier favorites while you get ready to place your first order.'}
      </Text>
      <Suspense>
        <Await
          resolve={featuredDataPromise}
          errorElement="There was a problem loading featured products."
        >
          {(data) => (
            <>
              <FeaturedCollections
                title={orders?.length ? 'Refine your closet' : 'Featured collections'}
                collections={data.featuredCollections}
              />
              <ProductSwimlane products={data.featuredProducts} />
            </>
          )}
        </Await>
      </Suspense>
    </section>
  );
}

function collectPurchasedItems(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const date = new Date(order.processedAt).toLocaleDateString();
    flattenConnection(order.lineItems ?? []).forEach((item) => {
      if (!map.has(item.title)) {
        map.set(item.title, {
          title: item.title,
          image: item.image ?? null,
          date,
        });
      }
    });
  });

  return Array.from(map.values()).slice(0, 8);
}

function formatCurrency(amount, currency = 'CAD') {
  if (!amount) {
    return new Intl.NumberFormat(undefined, {style: 'currency', currency}).format(0);
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount);
}
