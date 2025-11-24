import {useOutletContext, Await, Link} from '@remix-run/react';
import {Text} from '~/components/Text';
import {AddToWishlist} from '~/components/AddToWishlist';
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
              <div className="grid grid-cols-2 gap-2.5">
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
    <div className="group relative rounded-xl border border-primary/[0.08] overflow-hidden bg-contrast/30 hover:border-primary/15 transition-colors">
      {/* Remove button */}
      <div className="absolute top-1.5 right-1.5 z-10">
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
            <HeartIcon className="w-6 h-6 text-primary/10" />
          </div>
        )}
      </Link>
      
      {/* Info */}
      <div className="p-2.5">
        <Link to={`/products/${product.handle}`}>
          <Text className="text-xs font-medium line-clamp-1 hover:underline">
            {product.title}
          </Text>
        </Link>
        {price && (
          <Text size="fine" className="text-primary/50 text-[10px]">
            {formatMoney(price)}
          </Text>
        )}
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center">
        <HeartIcon className="w-10 h-10 text-primary/25" />
      </div>
      <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
      <Text className="text-primary/50 text-sm mb-8 max-w-xs text-center">
        Save items you love by clicking the heart icon on any product.
      </Text>
      <Link
        to="/"
        className="inline-block px-8 py-3 rounded-full bg-primary text-contrast text-sm font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
      >
        Explore Products
      </Link>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-primary/[0.08] overflow-hidden animate-pulse">
          <div className="aspect-square bg-primary/5" />
          <div className="p-2.5 space-y-1.5">
            <div className="h-3 bg-primary/10 rounded w-3/4" />
            <div className="h-2.5 bg-primary/5 rounded w-1/2" />
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
