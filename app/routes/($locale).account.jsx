import {
  Await,
  Form,
  Outlet,
  useLoaderData,
  useMatches,
  useOutlet,
  Link,
} from '@remix-run/react';
import {Suspense} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {flattenConnection} from '@shopify/hydrogen';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {CACHE_NONE, routeHeaders} from '~/data/cache';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {IconClose} from '~/components/Icon';

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
  const matches = useMatches();

  // Check if we're on a sub-route (orders, wishlist, settings, contact)
  const isSubRoute = matches.some((match) => {
    const handle = match?.handle;
    return handle?.renderInModal;
  });

  // Get the title for sub-routes
  const subRouteTitle = matches.reduce((acc, match) => {
    const handle = match?.handle;
    if (handle?.renderInModal) {
      return handle.modalTitle || getModalTitle(match.pathname);
    }
    return acc;
  }, '');

  const outletContext = {
    customer: data.customer,
    featuredDataPromise: data.featuredDataPromise,
    wishlistProductsPromise: data.wishlistProductsPromise,
  };

  return (
    <div className="min-h-screen">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-16">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-2xl font-medium tracking-tight mb-1">
              {data.customer?.firstName ? `${data.customer.firstName}'s Account` : 'My Account'}
            </h1>
            <p className="text-xs text-primary/40 mb-3">
              {data.customer?.emailAddress?.emailAddress}
            </p>
            <Form method="post" action={usePrefixPathWithLocale('/account/logout')}>
              <button 
                type="submit" 
                className="text-xs text-primary/40 hover:text-primary transition-colors uppercase tracking-widest"
              >
                Sign out
              </button>
            </Form>
          </header>

          {/* Two Column Layout - Always show sidebar */}
          <div className="grid grid-cols-[240px_1fr] gap-16">
            {/* Sidebar Nav */}
            <aside className="min-h-screen">
              <nav className="sticky top-8 flex flex-col gap-2">
                <NavItem to="/account" end>Overview</NavItem>
                <NavItem to="/account/orders">Orders</NavItem>
                <NavItem to="/account/wishlist">Wishlist</NavItem>
                <NavItem to="/account/settings">Settings</NavItem>
                <NavItem to="/account/contact">Help</NavItem>
              </nav>
            </aside>
            
            {/* Main Content */}
            <main className="min-w-0">
              {isSubRoute && subRouteTitle && (
                <h2 className="text-2xl font-medium mb-8">{subRouteTitle}</h2>
              )}
              <div className={isSubRoute ? "rounded-2xl border border-primary/10 bg-contrast/40 backdrop-blur-md p-8" : ""}>
                <Outlet context={outletContext} />
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {isSubRoute ? (
          /* Sub-route: Full screen with back nav */
          <div className="min-h-screen flex flex-col">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-contrast/95 backdrop-blur-lg border-b border-primary/10">
              <div className="flex items-center h-14 px-4">
                <Link 
                  to="/account" 
                  className="flex items-center gap-1.5 text-sm text-primary/70 hover:text-primary"
                >
                  <ChevronLeftIcon />
                  <span>Back</span>
                </Link>
                <h1 className="flex-1 text-center text-base font-medium pr-12">{subRouteTitle}</h1>
              </div>
            </header>
            
            {/* Content */}
            <main className="flex-1 px-4 py-6">
              <Outlet context={outletContext} />
            </main>
          </div>
        ) : (
          /* Main account page */
          <div className="px-4 py-8">
            <header className="mb-8">
              <h1 className="text-2xl font-medium tracking-tight mb-1">
                {data.customer?.firstName ? `${data.customer.firstName}'s Account` : 'My Account'}
              </h1>
              <p className="text-xs text-primary/40 mb-3">
                {data.customer?.emailAddress?.emailAddress}
              </p>
              <Form method="post" action={usePrefixPathWithLocale('/account/logout')}>
                <button 
                  type="submit" 
                  className="text-xs text-primary/40 hover:text-primary transition-colors uppercase tracking-widest"
                >
                  Sign out
                </button>
              </Form>
            </header>
            
            <Outlet context={outletContext} />
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({to, children, end}) {
  return (
    <Link
      to={to}
      end={end}
      className={({isActive}) =>
        `block w-full px-5 py-3 rounded-xl text-sm font-medium transition-all ${
          isActive 
            ? 'bg-primary/15 text-primary shadow-sm' 
            : 'text-primary/50 hover:bg-primary/8 hover:text-primary/80'
        }`
      }
    >
      {children}
    </Link>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function getModalTitle(pathname) {
  if (pathname.includes('/orders')) return 'Orders';
  if (pathname.includes('/wishlist')) return 'Wishlist';
  if (pathname.includes('/settings')) return 'Settings';
  if (pathname.includes('/edit')) return 'Edit Profile';
  if (pathname.includes('/address')) return 'Address';
  if (pathname.includes('/contact')) return 'Help';
  return '';
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
