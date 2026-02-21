import {useEffect, useState, useCallback} from 'react';
import {NewsletterSignup} from '~/components/NewsletterSignup';
import {IconClose} from '~/components/Icon';

const STORAGE_KEY = 'valcee_newsletter_dismissed';
const SHOW_DELAY_MS = 5000;
const DISMISS_DURATION_DAYS = 30;

export function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DURATION_DAYS) return;
      }
    } catch {
      // localStorage unavailable
    }
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleSuccess = useCallback(() => {
    setTimeout(dismiss, 2000);
  }, [dismiss]);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-contrast rounded-t-3xl sm:rounded-2xl border border-primary/10 shadow-2xl px-8 py-12 sm:py-10 space-y-6">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-primary/20" />

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 text-primary/40 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
          aria-label="Close"
        >
          <IconClose className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/40">
            Join the circle
          </p>
          <h2 className="font-serif italic text-2xl text-primary">
            Timeless pieces, first access.
          </h2>
          <p className="text-sm text-primary/50">
            Subscribe for new arrivals, private sales, and styling notes.
          </p>
        </div>

        <NewsletterSignup
          placeholder="your@email.com"
          buttonLabel="Subscribe"
          layout="vertical"
          onSuccess={handleSuccess}
        />

        <button
          onClick={dismiss}
          className="w-full text-xs text-primary/30 hover:text-primary/50 transition-colors uppercase tracking-widest"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
