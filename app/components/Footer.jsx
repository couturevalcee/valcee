import {Link} from '~/components/Link';
import {NewsletterSignup} from '~/components/NewsletterSignup';

const POLICY_LINKS = [
  {label: 'Contact', to: '/contact'},
  {label: 'Shipping & Returns', to: '/shipping-and-returns'},
  {label: 'Terms', to: '/terms-of-service'},
  {label: 'Privacy', to: '/policies/privacy-policy'},
];

/**
 * @param {{ whatsappNumber?: string; instagramHandle?: string }}
 */
export function Footer({whatsappNumber, instagramHandle = 'couturevalcee'}) {
  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;
  const igHref = `https://ig.me/m/${instagramHandle}`;

  return (
    <footer className="border-t border-primary/10 bg-contrast pb-28">
      <div className="max-w-4xl mx-auto px-6 py-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
        {/* Newsletter */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/40">
            Stay close
          </p>
          <NewsletterSignup
            placeholder="your@email.com"
            buttonLabel="Join"
            layout="vertical"
          />
        </div>

        {/* Links */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/40">
            Navigate
          </p>
          <nav className="flex flex-col gap-2">
            {POLICY_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-primary/70 hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Social */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/40">
            Connect
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={igHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary/70 hover:text-primary transition-colors"
            >
              Instagram
            </a>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary/70 hover:text-primary transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-primary/[0.07] px-6 py-4">
        <p className="text-center text-[10px] uppercase tracking-widest text-primary/30">
          &copy; {new Date().getFullYear()} Valcee Couture. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
