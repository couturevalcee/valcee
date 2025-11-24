import {useOutletContext, Await, Link} from '@remix-run/react';
import {Text} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';
import {AddToWishlist} from '~/components/AddToWishlist';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {Suspense} from 'react';

export const handle = {
  renderInModal: true,
};

export default function AccountWishlist() {
  const {customer, wishlistProductsPromise} = useOutletContext();
  
  let wishlistIds = [];
  try {
    wishlistIds = JSON.parse(customer.wishlist?.value || '[]');
  } catch (e) {}

  return (
    <div>
      <Suspense fallback={<WishlistSkeleton />}>
        <Await resolve={wishlistProductsPromise}>
          {(wishlistProducts) => (
            wishlistProducts && wishlistProducts.length ? (
              <div className="grid grid-cols-2 gap-4">
                {wishlistProducts.map((product) => (
                  <WishlistItem 
                    key={product.id} 
                    product={product} 
                    wishlistIds={wishlistIds}
                  />
                ))}
              </div>
            ) : (
              <EmptyWishlist />
            )
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function WishlistItem({product, wishlistIds}) {
  const variant = product.variants?.nodes?.[0];
  const price = variant?.price || product.priceRange?.minVariantPrice;
  
  return (
    <div className="group relative rounded-xl border border-primary/10 overflow-hidden hover:border-primary/20 transition-colors">
      {/* Remove button */}
      <div className="absolute top-2 right-2 z-10">
        <AddToWishlist productId={product.id} wishlistIds={wishlistIds} />
      </div>
      
      {/* Image */}
      <Link to={`/products/${product.handle}`} className="block aspect-square bg-primary/5">
        {product.featuredImage?.url ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HeartIcon className="w-8 h-8 text-primary/10" />
          </div>
        )}
      </Link>
      
      {/* Info */}
      <div className="p-3">
        <Link to={`/products/${product.handle}`}>
          <Text className="text-sm font-medium line-clamp-1 hover:underline">
            {product.title}
          </Text>
        </Link>
        {price && (
          <Text size="fine" className="text-primary/60">
            {formatMoney(price)}
          </Text>
        )}
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/5 flex items-center justify-center">
        <HeartIcon className="w-8 h-8 text-primary/30" />
      </div>
      <Text className="text-primary/60 mb-4">Your wishlist is empty</Text>
      <Link
        to={usePrefixPathWithLocale('/')}
        className="inline-block px-6 py-2 rounded-full border border-primary/20 text-sm hover:bg-primary hover:text-contrast transition-colors"
      >
        Explore Products
      </Link>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-primary/10 overflow-hidden animate-pulse">
          <div className="aspect-square bg-primary/5" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-primary/10 rounded w-3/4" />
            <div className="h-3 bg-primary/5 rounded w-1/2" />
          </div>
        </div>
      ))}
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

function HeartIcon({className}) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}
