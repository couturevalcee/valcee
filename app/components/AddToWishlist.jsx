import {useFetcher} from '@remix-run/react';
import {IconHeart} from '~/components/Icon';

export function AddToWishlist({productId, wishlistIds = []}) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state !== 'idle';
  
  // Optimistic UI
  const isInWishlist = fetcher.formData 
    ? fetcher.formData.get('intent') === 'add'
    : wishlistIds.includes(productId);

  const intent = isInWishlist ? 'remove' : 'add';

  return (
    <fetcher.Form action="/api/wishlist" method="post">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="intent" value={intent} />
      <button 
        type="submit" 
        disabled={isAdding}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isInWishlist ? 'text-red-500 bg-red-50' : 'text-primary/60 hover:bg-primary/5'}`}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <IconHeart filled={isInWishlist} />
      </button>
    </fetcher.Form>
  );
}
