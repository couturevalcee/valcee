import {Image} from '@shopify/hydrogen';
import {useState} from 'react';

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 * @param {{
 *   media: MediaFragment[];
 *   className?: string;
 * }}
 */
export function ProductGallery({media, className}) {
  const [selectedMedia, setSelectedMedia] = useState(media[0]);

  if (!media.length) {
    return null;
  }

  const image = selectedMedia?.__typename === 'MediaImage' 
    ? {...selectedMedia.image, altText: selectedMedia.alt || 'Product image'}
    : null;

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Main Image */}
      <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
        {image && (
          <Image
            loading="eager"
            data={image}
            sizes="(min-width: 48em) 60vw, 90vw"
            className="object-contain w-full h-full fadeIn img-cutout opacity-95 drop-shadow-xl"
          />
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3">
          {media.map((med, i) => {
             const thumbImage = med.__typename === 'MediaImage' ? med.image : null;
             const isSelected = med.id === selectedMedia.id;
             return (
               <button
                 key={med.id || i}
                 onClick={() => setSelectedMedia(med)}
                 className={`w-16 h-16 border transition-all duration-200 ${isSelected ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
               >
                 {thumbImage && (
                   <Image
                     data={thumbImage}
                     aspectRatio="1/1"
                     sizes="64px"
                     className="object-contain w-full h-full"
                   />
                 )}
               </button>
             )
          })}
        </div>
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').MediaFragment} MediaFragment */
