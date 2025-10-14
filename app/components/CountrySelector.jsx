import {useFetcher, useLocation, useRouteLoaderData} from '@remix-run/react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useInView} from 'react-intersection-observer';
import clsx from 'clsx';
import {CartForm} from '@shopify/hydrogen';

import {Heading} from '~/components/Text';
import {IconCheck} from '~/components/Icon';
import {DEFAULT_LOCALE} from '~/lib/utils';

export function CountrySelector({
  label = 'Country',
  showLabel = true,
  overlay = true,
  className = '',
  allowedCountries,
}) {
  const fetcher = useFetcher();
  const closeRef = useRef(null);
  const rootData = useRouteLoaderData('root');
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  const {pathname, search} = useLocation();
  const pathWithoutLocale = `${pathname.replace(
    selectedLocale.pathPrefix,
    '',
  )}${search}`;

  const countries = fetcher.data ?? {};
  const defaultLocale = countries?.['default'];
  const defaultLocalePrefix = defaultLocale
    ? `${defaultLocale?.language}-${defaultLocale?.country}`
    : '';

  // Build filtered + ordered entries (e.g., ['US','CA']) and exclude 'default'
  const countryEntries = useMemo(() => {
    const entries = Object.entries(countries).filter(([key]) => key !== 'default');
    const filtered = entries.filter(([, loc]) =>
      Array.isArray(allowedCountries) && allowedCountries.length
        ? allowedCountries.includes(loc.country)
        : true,
    );
    if (Array.isArray(allowedCountries) && allowedCountries.length) {
      filtered.sort(([, a], [, b]) =>
        allowedCountries.indexOf(a.country) - allowedCountries.indexOf(b.country),
      );
    }
    return filtered;
  }, [countries, allowedCountries]);

  const {ref, inView} = useInView({ threshold: 0, triggerOnce: true });

  const observerRef = useRef(null);
  useEffect(() => { ref(observerRef.current); }, [ref, observerRef]);

  // Prefetch when in view
  useEffect(() => {
    if (!inView || fetcher.data || fetcher.state === 'loading') return;
    fetcher.load('/api/countries');
  }, [inView, fetcher]);

  // Mobile-first open state and media query
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const toggleOpen = useCallback(() => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && !fetcher.data && fetcher.state !== 'loading') {
      fetcher.load('/api/countries');
    }
  }, [open, fetcher]);

  const closeDropdown = useCallback(() => setOpen(false), []);

  // Button label fallback
  const triggerLabel = useMemo(() => selectedLocale.label || 'Select', [selectedLocale.label]);

  return (
    <section ref={observerRef} className={clsx('grid w-full gap-3', className)}>
      {showLabel && (
        <Heading size="lead" className="cursor-default" as="h3">
          {label}
        </Heading>
      )}

      {/* Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="w-full flex items-center justify-between rounded-md border border-primary/25 px-4 py-3 bg-transparent hover:border-primary/40 transition"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{triggerLabel}</span>
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {/* Desktop dropdown (minimal) */}
        {!isMobile && open && (
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-primary/20 bg-contrast shadow-lg overflow-hidden">
            <ul role="listbox" className="max-h-56 overflow-auto py-1">
              {countryEntries.map(([countryPath, countryLocale]) => (
                <li key={countryPath} role="option" aria-selected={
                  countryLocale.language === selectedLocale.language &&
                  countryLocale.country === selectedLocale.country
                }>
                  <Country
                    closeDropdown={closeDropdown}
                    countryUrlPath={getCountryUrlPath({
                      countryLocale,
                      defaultLocalePrefix,
                      pathWithoutLocale,
                    })}
                    isSelected={
                      countryLocale.language === selectedLocale.language &&
                      countryLocale.country === selectedLocale.country
                    }
                    countryLocale={countryLocale}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet (clean, minimal) */}
      {isMobile && open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={closeDropdown} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-primary/15 bg-contrast text-primary shadow-xl p-4 pb-5 animate-[slideUp_200ms_ease-out]">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-primary/20" />
            <Heading as="h3" size="lead" className="mb-2">Choose country & currency</Heading>
            <ul className="max-h-[55vh] overflow-auto grid gap-1">
              {countryEntries.map(([countryPath, countryLocale]) => (
                <li key={countryPath}>
                  <Country
                    closeDropdown={closeDropdown}
                    countryUrlPath={getCountryUrlPath({
                      countryLocale,
                      defaultLocalePrefix,
                      pathWithoutLocale,
                    })}
                    isSelected={
                      countryLocale.language === selectedLocale.language &&
                      countryLocale.country === selectedLocale.country
                    }
                    countryLocale={countryLocale}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

// Minimal option row
function Country({closeDropdown, countryLocale, countryUrlPath, isSelected}) {
  return (
    <ChangeLocaleForm
      key={countryLocale.country}
      redirectTo={countryUrlPath}
      buyerIdentity={{ countryCode: countryLocale.country }}
    >
      <button
        type="submit"
        onClick={closeDropdown}
        className={clsx(
          'w-full text-left px-4 py-3 flex items-center justify-between rounded-md',
          'hover:bg-primary/5 transition'
        )}
      >
        <span>{countryLocale.label}</span>
        {isSelected ? <IconCheck className="ml-3 opacity-80" /> : null}
      </button>
    </ChangeLocaleForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   buyerIdentity: CartBuyerIdentityInput;
 *   redirectTo: string;
 * }}
 */
function ChangeLocaleForm({children, buyerIdentity, redirectTo}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.BuyerIdentityUpdate}
      inputs={{
        buyerIdentity,
      }}
    >
      <>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        {children}
      </>
    </CartForm>
  );
}

/**
 * @param {{
 *   countryLocale: Locale;
 *   pathWithoutLocale: string;
 *   defaultLocalePrefix: string;
 * }}
 */
function getCountryUrlPath({
  countryLocale,
  defaultLocalePrefix,
  pathWithoutLocale,
}) {
  let countryPrefixPath = '';
  const countryLocalePrefix = `${countryLocale.language}-${countryLocale.country}`;

  if (countryLocalePrefix !== defaultLocalePrefix) {
    countryPrefixPath = `/${countryLocalePrefix.toLowerCase()}`;
  }
  return `${countryPrefixPath}${pathWithoutLocale}`;
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartBuyerIdentityInput} CartBuyerIdentityInput */
/** @typedef {import('~/lib/type').Localizations} Localizations */
/** @typedef {import('~/lib/type').Locale} Locale */
/** @typedef {import('~/root').RootLoader} RootLoader */
