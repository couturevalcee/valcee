import {
  Await,
  Form,
  Outlet,
  useLoaderData,
  useMatches,
  useOutlet,
  NavLink,
} from '@remix-run/react';
import {Suspense} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {flattenConnection, Image} from '@shopify/hydrogen';
import {Heading, PageHeader, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {Modal} from '~/components/Modal';
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

  // Fetch wishlist products if any
  let wishlistProductsPromise = Promise.resolve([]);
  if (customer?.wishlist?.value) {
    try {
      const ids = JSON.parse(customer.wishlist.value);
      if (ids.length > 0) {
        wishlistProductsPromise = context.storefront.query(`#graphql
          query getWishlistProducts($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                title
                handle
                featuredImage {
                  url
                  altText
                  width
                  height
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 1) {
                  nodes {
                    id
                    image {
                      url
                      altText
                      width
                      height
                    }
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `, {
          variables: {ids}
        }).then(result => result.nodes.filter(Boolean));
      }
    } catch (e) {
      console.error('Error parsing wishlist', e);
    }
  }

  return defer(
    {
      customer,
      heading,
      featuredDataPromise: getFeaturedData(context.storefront),
      wishlistProductsPromise,
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

  if (renderOutletInModal) {
    return (
      <>
        <Modal cancelLink="/account">
          <Outlet context={{
            customer: data.customer, 
            featuredDataPromise: data.featuredDataPromise,
            wishlistProductsPromise: data.wishlistProductsPromise
          }} />
        </Modal>
        <AccountLayout data={data} />
      </>
    );
  }

  return <AccountLayout data={data} />;
}

function AccountLayout({data}) {
  return (
    <div className="px-4 py-8 md:px-8 lg:px-12">
      <PageHeader heading={data.heading}>
        <Form method="post" action={usePrefixPathWithLocale('/account/logout')}>
          <button type="submit" className="text-primary/50">
            Sign out
          </button>
        </Form>
      </PageHeader>

      <div className="grid md:grid-cols-[240px_1fr] gap-8 mt-8">
        <nav className="hidden md:block">
          <AccountMenu />
        </nav>
        <main>
          <Outlet context={{
            customer: data.customer, 
            featuredDataPromise: data.featuredDataPromise,
            wishlistProductsPromise: data.wishlistProductsPromise
          }} />
        </main>
      </div>
    </div>
  );
}

function AccountMenu() {
  const navItems = [
    {to: '/account', title: 'Overview', end: true},
    {to: '/account/orders', title: 'Orders'},
    {to: '/account/wishlist', title: 'Wishlist'},
    {to: '/account/profile', title: 'Profile'},
    {to: '/account/contact', title: 'Concierge'},
  ];

  return (
    <div className="flex flex-col gap-2 sticky top-32">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({isActive}) =>
            `px-4 py-2 rounded-lg transition-colors text-left ${
              isActive ? 'bg-primary text-contrast' : 'hover:bg-primary/5'
            }`
          }
        >
          {item.title}
        </NavLink>
      ))}
    </div>
  );
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
