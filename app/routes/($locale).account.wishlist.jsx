import {useOutletContext, Await} from '@remix-run/react';
import {Heading, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {ProductCard} from '~/components/ProductCard';
import {AddToWishlist} from '~/components/AddToWishlist';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {Suspense} from 'react';

export default function AccountWishlist() {
  const {customer, wishlistProductsPromise} = useOutletContext();
  
  // We need the list of IDs for the AddToWishlist component to know state
  // The 'value' is a JSON string of IDs
  let wishlistIds = [];
  try {
    wishlistIds = JSON.parse(customer.wishlist?.value || '[]');
  } catch (e) {}

  return (
    <div className="space-y-6">
      <Heading size="lead">Your Wishlist</Heading>
      <Suspense fallback={<div>Loading wishlist...</div>}>
        <Await resolve={wishlistProductsPromise}>
          {(wishlistProducts) => (
            wishlistProducts && wishlistProducts.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlistProducts.map((product) => (
                  <div key={product.id} className="relative group">
                    <div className="absolute top-2 right-2 z-10">
                      <AddToWishlist productId={product.id} wishlistIds={wishlistIds} />
                    </div>
                    <ProductCard product={product} />
                  </div>
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

function EmptyWishlist() {
  return (
    <div>
      <Text className="mb-1" size="fine" width="narrow" as="p">
        Your wishlist is empty.
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
