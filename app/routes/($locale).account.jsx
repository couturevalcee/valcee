import {
  Await,
  Form,
  Outlet,
  useLoaderData,
  useMatches,
  useOutlet,
} from '@remix-run/react';
import {Suspense} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {flattenConnection, Image} from '@shopify/hydrogen';
import {Heading, PageHeader, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {OrderCard} from '~/components/OrderCard';
import {AccountDetails} from '~/components/AccountDetails';
import {AccountAddressBook} from '~/components/AccountAddressBook';
import {Modal} from '~/components/Modal';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {statusMessage, usePrefixPathWithLocale} from '~/lib/utils';
import {CACHE_NONE, routeHeaders} from '~/data/cache';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

import {getFeaturedData} from './($locale).featured-products';

export const headers = routeHeaders;

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context, params}) {
  const localePrefix = params.locale ? `/${params.locale}` : '';
  if (!(await context.customerAccount.isLoggedIn())) {
    throw redirect(`${localePrefix}/account/login`);
  }

  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  /**
   * If the customer failed to load, we assume their access token is invalid.
   */
  if (errors?.length || !data?.customer) {
    throw redirect(`${localePrefix}/account/login`);
  }

  const customer = data?.customer;

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}.`
      : `Welcome to your account.`
    : 'Account Details';

  return defer(
    {
      customer,
      heading,
      featuredDataPromise: getFeaturedData(context.storefront),
    },
    {
      headers: {
        'Cache-Control': CACHE_NONE,
      },
    },
  );
}

export default function Authenticated() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  const outlet = useOutlet();
  const matches = useMatches();

  // routes that export handle { renderInModal: true }
  const renderOutletInModal = matches.some((match) => {
    const handle = match?.handle;
    return handle?.renderInModal;
  });

  if (outlet) {
    if (renderOutletInModal) {
      return (
        <>
          <Modal cancelLink="/account">
            <Outlet context={{customer: data.customer}} />
          </Modal>
          <Account {...data} />
        </>
      );
    } else {
      return <Outlet context={{customer: data.customer}} />;
    }
  }

  return <Account {...data} />;
}

/**
 * @param {AccountType}
 */
function Account({customer, heading, featuredDataPromise}) {
  const orders = flattenConnection(customer.orders);
  const addresses = flattenConnection(customer.addresses);

  return (
    <>
      <PageHeader heading={heading}>
        <Form method="post" action={usePrefixPathWithLocale('/account/logout')}>
          <button type="submit" className="text-primary/50">
            Sign out
          </button>
        </Form>
      </PageHeader>
      <AccountSummary orders={orders} />
      <ActiveOrders orders={orders} />
      {orders && <AccountOrderHistory orders={orders} />}
      <PurchaseHistory orders={orders} />
      <AccountDetails customer={customer} />
      <AccountAddressBook addresses={addresses} customer={customer} />
      <AccountRecommendations
        orders={orders}
        featuredDataPromise={featuredDataPromise}
      />
    </>
  );
}

/**
 * @param {OrderCardsProps}
 */
function AccountOrderHistory({orders}) {
  return (
    <div className="mt-6">
      <div className="grid w-full gap-4 p-4 py-6 md:gap-8 md:p-8 lg:p-12">
        <h2 className="font-bold text-lead">Order History</h2>
        {orders?.length ? <Orders orders={orders} /> : <EmptyOrders />}
      </div>
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

/**
 * @param {OrderCardsProps}
 */
function Orders({orders}) {
  return (
    <ul className="grid grid-flow-row grid-cols-1 gap-2 gap-y-6 md:gap-4 lg:gap-6 false sm:grid-cols-3">
      {orders.map((order) => (
        <OrderCard order={order} key={order.id} />
      ))}
    </ul>
  );
}

function AccountSummary({orders}) {
  if (!orders?.length) {
    return (
      <section className="px-4 md:px-0 mt-6">
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
    <section className="px-4 md:px-0 mt-6">
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
    <section className="px-4 md:px-0 mt-8">
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
    <section className="px-4 md:px-0 mt-10 space-y-3">
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
    <section className="px-4 md:px-0 mt-12 space-y-4">
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

/**
 * @typedef {{
 *   orders: OrderCardFragment[];
 * }} OrderCardsProps
 */
/**
 * @typedef {Object} AccountType
 * @property {CustomerDetailsFragment} customer
 * @property {Promise<FeaturedData>} featuredDataPromise
 * @property {string} heading
 */

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('customer-accountapi.generated').CustomerDetailsFragment} CustomerDetailsFragment */
/** @typedef {import('customer-accountapi.generated').OrderCardFragment} OrderCardFragment */
/** @typedef {import('./($locale).featured-products').FeaturedData} FeaturedData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
