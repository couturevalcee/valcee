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
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <div
      className="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      id="modal-bg"
    >
      <div className="fixed inset-0 transition-opacity bg-primary/60 backdrop-blur-sm"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div
            className={`relative flex-1 w-full overflow-hidden text-left transition-all transform rounded-2xl shadow-2xl bg-contrast sm:my-8 sm:flex-none ${sizeClasses[size]}`}
            role="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyPress={(e) => {
              e.stopPropagation();
            }}
            tabIndex={0}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-contrast">
              {title && (
                <h2 className="text-lg font-medium">{title}</h2>
              )}
              {!title && <div />}
              <Link
                to={cancelLink}
                className="p-2 -m-2 transition text-primary/60 hover:text-primary rounded-full hover:bg-primary/5"
              >
                <IconClose aria-label="Close panel" />
              </Link>
            </div>
            {/* Content */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
