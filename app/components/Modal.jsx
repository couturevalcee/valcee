import {IconClose} from '~/components/Icon';
import {Link} from '~/components/Link';

/**
 * @param {{
 *   children: React.ReactNode;
 *   cancelLink: string;
 *   title?: string;
 *   size?: 'sm' | 'md' | 'lg' | 'xl';
 * }}
 */
export function Modal({children, cancelLink, title, size = 'md'}) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl',
  };

  return (
    <div
      className="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      id="modal-bg"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-primary/40 backdrop-blur-md"></div>
      
      {/* Modal container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`relative w-full overflow-hidden text-left transition-all transform shadow-2xl bg-contrast/95 backdrop-blur-xl sm:rounded-2xl ${sizeClasses[size]} rounded-t-3xl sm:rounded-2xl`}
            role="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyPress={(e) => {
              e.stopPropagation();
            }}
            tabIndex={0}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-primary/20"></div>
            </div>
            
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-primary/10 bg-contrast/80 backdrop-blur-sm">
              {title && (
                <h2 className="text-base sm:text-lg font-medium">{title}</h2>
              )}
              {!title && <div />}
              <Link
                to={cancelLink}
                className="p-2 -m-2 transition text-primary/50 hover:text-primary rounded-full hover:bg-primary/5"
              >
                <IconClose aria-label="Close panel" className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
            
            {/* Content */}
            <div className="px-5 sm:px-6 py-5 sm:py-6 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
