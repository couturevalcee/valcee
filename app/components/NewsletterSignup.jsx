import {useState, useCallback} from 'react';

/**
 * @param {{
 *   placeholder?: string;
 *   buttonLabel?: string;
 *   className?: string;
 *   onSuccess?: () => void;
 *   layout?: 'horizontal' | 'vertical';
 * }}
 */
export function NewsletterSignup({
  placeholder = 'Your email',
  buttonLabel = 'Subscribe',
  className = '',
  onSuccess,
  layout = 'horizontal',
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!email) return;
      setStatus('loading');
      try {
        const res = await fetch('/api/klaviyo/subscribe', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email}),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setMessage("You're on the list.");
          setEmail('');
          onSuccess?.();
        } else {
          setStatus('error');
          setMessage(data.error || 'Something went wrong.');
        }
      } catch {
        setStatus('error');
        setMessage('Unable to subscribe. Please try again.');
      }
    },
    [email, onSuccess],
  );

  if (status === 'success') {
    return (
      <p className="text-xs uppercase tracking-widest text-primary/60">
        {message}
      </p>
    );
  }

  const isVertical = layout === 'vertical';

  return (
    <form
      onSubmit={handleSubmit}
      className={`${isVertical ? 'flex flex-col gap-3' : 'flex items-center gap-2'} ${className}`}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={status === 'loading'}
        className="flex-1 bg-transparent border-b border-primary/30 focus:border-primary/60 focus:outline-none text-sm placeholder:text-primary/30 pb-1 transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="text-xs uppercase tracking-widest text-primary/60 hover:text-primary transition-colors whitespace-nowrap disabled:opacity-40"
      >
        {status === 'loading' ? '...' : buttonLabel}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400">{message}</p>
      )}
    </form>
  );
}
