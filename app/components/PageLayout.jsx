import {useParams, Form, Await, useRouteLoaderData, useLocation, useFetcher} from '@remix-run/react';
import valceeLogo from '~/assets/valcee-logo.png';
import useWindowScroll from 'react-use/esm/useWindowScroll';
import {Disclosure, Transition} from '@headlessui/react';
import {Suspense, useEffect, useMemo, useState, useRef} from 'react';
import {CartForm} from '@shopify/hydrogen';
import {Text, Heading, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Cart} from '~/components/Cart';
import {CartLoading} from '~/components/CartLoading';
import {Input} from '~/components/Input';
import {Drawer, useDrawer} from '~/components/Drawer';
import {CountrySelector} from '~/components/CountrySelector';
import {
  IconMenu,
  IconCaret,
  IconLogin,
  IconAccount,
  IconBag,
  IconClose,
  IconSearch,
} from '~/components/Icon';
import {useIsHomePath} from '~/lib/utils';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {useCartFetchers} from '~/hooks/useCartFetchers';

/**
 * @param {LayoutProps}
 */
export function PageLayout({children, layout}) {
  const {headerMenu, footerMenu} = layout || {};
  const isHome = useIsHomePath();
  const location = useLocation();

  useEffect(() => {
    const setHeight = () => {
      document.documentElement.style.setProperty('--screen-height-dynamic', `${window.innerHeight}px`);
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => window.removeEventListener('resize', setHeight);
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="">
          <a href="#mainContent" className="sr-only">
            Skip to content
          </a>
        </div>
        {/* Always render header so nav is available even without Shopify menus */}
        {layout?.shop?.name && (
          <Header title={layout.shop.name} menu={headerMenu} />
        )}
          <main
            role="main"
            id="mainContent"
            className={`flex-grow min-h-screen ${isHome ? '' : 'pt-[var(--height-nav)]'}`}
          >
          <div className="relative h-full">
            <div className="relative h-full">
              {children}
            </div>
          </div>
        </main>
        {/* Bottom Controls */}
        <BottomBar />
        
        {/* Bottom Gradient Mask to feather content before icons */}
        <div className="fixed bottom-0 left-0 right-0 h-[15vh] bg-gradient-to-t from-contrast via-contrast/80 to-transparent z-40 pointer-events-none" />
        
        {/* Top Gradient Mask to feather header */}
        <div className="fixed top-0 left-0 right-0 h-[15vh] bg-gradient-to-b from-contrast via-contrast/80 to-transparent z-30 pointer-events-none" />
        
        {/* Solid header background to hide scrolling content behind logo */}
        <div className="fixed top-0 left-0 right-0 h-[var(--height-nav)] bg-contrast z-20 pointer-events-none" />
      </div>
      {/* Footer removed site-wide */}
    </>
  );
}

/**
 * @param {{title: string; menu?: EnhancedMenu}}
 */
function Header({title, menu}) {
  const isHome = useIsHomePath();

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);

  // toggle cart drawer when adding to cart
  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  // listen for global open-cart events (from BottomBar)
  useEffect(() => {
    const handler = () => openCart();
    window.addEventListener('open-cart', handler);
    return () => window.removeEventListener('open-cart', handler);
  }, [openCart]);

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      {/* Always mount MenuDrawer; it shows static links even without Shopify menu */}
      <MenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} />
      <ValceeHeader
        isHome={isHome}
        title={title}
        openCart={openCart}
        openMenu={openMenu}
      />
    </>
  );
}

/**
 * Valcee-styled header with centered logo/title, left "!" opens menu, right "i" goes to editorial/info
 */
function ValceeHeader({title, isHome, openCart, openMenu}) {
  const params = useParams();
  return (
    <header
      role="banner"
      className={`${
        isHome ? 'bg-transparent text-primary' : 'bg-transparent text-primary'
      } flex items-center h-nav fixed z-40 top-0 left-0 right-0 justify-between w-full leading-none gap-4 px-4 md:px-8 pt-[2vh] md:pt-[1.5vh] lg:pt-[1vh]`}
    >
      {/* Left: menu trigger */}
      <div className="flex items-center">
        <button
          onClick={openMenu}
          aria-label="Open Menu"
          className="relative flex items-center justify-center w-8 h-8 text-primary"
        >
          <span className="text-xl leading-none">!</span>
        </button>
      </div>

      {/* Center: brand logo */}
      <Link
        className="flex items-center self-stretch leading-[3rem] md:leading-[4rem] justify-center flex-grow h-full"
        to="/"
        aria-label={title || 'Valcee Couture'}
      >
        <img
          src={valceeLogo}
          alt={title || 'Valcee'}
          className="h-12 md:h-16 lg:h-20 object-contain"
          loading="eager"
        />
      </Link>

      {/* Right: cart */}
      <div className="flex items-center justify-end gap-4">
        <CartCount isHome={isHome} openCart={openCart} />
      </div>
    </header>
  );
}

/**
 * @param {{isOpen: boolean; onClose: () => void}}
 */
function CartDrawer({isOpen, onClose}) {
  const rootData = useRouteLoaderData('root');
  if (!rootData) return null;

  return (
    <Drawer open={isOpen} onClose={onClose} heading="Cart" openFrom="right">
      <div className="grid">
        <Suspense fallback={<CartLoading />}>
          <Await resolve={rootData?.cart}>
            {(cart) => <Cart layout="drawer" onClose={onClose} cart={cart} />}
          </Await>
        </Suspense>
      </div>
    </Drawer>
  );
}

/**
 * @param {{
 *   isOpen: boolean;
 *   onClose: () => void;
 *   menu: EnhancedMenu;
 * }}
 */
export function MenuDrawer({isOpen, onClose, menu}) {
  return (
    <Drawer open={isOpen} onClose={onClose} openFrom="left" heading="Menu">
      <div className="h-full">
        <MenuMobileNav menu={menu} onClose={onClose} />
      </div>
    </Drawer>
  );
}

/**
 * @param {{
 *   menu: EnhancedMenu;
 *   onClose: () => void;
 * }}
 */
function MenuMobileNav({menu, onClose}) {
  const rootData = useRouteLoaderData('root');
  const isLoggedIn = rootData?.isLoggedIn;

  const staticItems = [
    {id: 'collections', title: 'Collections', to: '/collections'},
    {id: 'gallery', title: 'Gallery', to: '/gallery'},
    {id: 'account', title: 'Account', to: '/account'},
  ];

  return (
    <nav className="flex flex-col justify-between h-full p-6 pb-4 sm:px-12 sm:py-8">
      {/* Main Links */}
      <div className="flex flex-col items-center justify-center gap-12 flex-grow">
        {staticItems.map((item) => (
          <span key={item.id} className="block">
            <Link to={item.to} onClick={onClose}>
              <span className="font-serif italic text-4xl md:text-5xl leading-none hover:opacity-70 transition-opacity">
                {item.title}
              </span>
            </Link>
          </span>
        ))}
      </div>

      {/* Bottom Links */}
      <div className="flex flex-col items-center gap-4">
        <Link to="/" onClick={onClose} className="text-sm uppercase tracking-widest hover:opacity-70">
          Home
        </Link>
        <Link to="/pages/contact" onClick={onClose} className="text-sm uppercase tracking-widest hover:opacity-70">
          Contact
        </Link>
        
        <Link
          to="/account/login"
          onClick={onClose}
          className="text-sm uppercase tracking-widest hover:opacity-70 mt-4"
        >
          Log in
        </Link>
      </div>
    </nav>
  );
}

/**
 * @param {{
 *   title: string;
 *   isHome: boolean;
 *   openCart: () => void;
 *   openMenu: () => void;
 * }}
 */
function MobileHeader({title, isHome, openCart, openMenu}) {
  // useHeaderStyleFix(containerStyle, setContainerStyle, isHome);

  const params = useParams();

  return (
    <header
      role="banner"
      className={`${
        isHome
          ? 'bg-primary/80 dark:bg-contrast/60 text-contrast dark:text-primary shadow-darkHeader'
          : 'bg-contrast/80 text-primary'
      } flex lg:hidden items-center h-nav fixed backdrop-blur-lg z-40 top-0 left-0 right-0 justify-between w-full leading-none gap-4 px-4 md:px-8 pt-[2vh] md:pt-[1.5vh] lg:pt-[1vh]`}
    >
      <div className="flex items-center justify-start w-full gap-4">
        <button
          onClick={openMenu}
          className="relative flex items-center justify-center w-8 h-8"
        >
          <IconMenu />
        </button>
      </div>

      <Link
        className="flex items-center self-stretch leading-[3rem] md:leading-[4rem] justify-center flex-grow w-full h-full"
        to="/"
      >
        <Heading
          className="font-bold text-center leading-none"
          as={isHome ? 'h1' : 'h2'}
        >
          {title}
        </Heading>
      </Link>

      <div className="flex items-center justify-end w-full gap-4">
        <AccountLink className="relative flex items-center justifycenter w-8 h-8" />
        <CartCount isHome={isHome} openCart={openCart} />
      </div>
    </header>
  );
}

function AccountLink({className}) {
  const rootData = useRouteLoaderData('root');
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link to="/account" className={className}>
      <Suspense fallback={<IconLogin />}>
        <Await resolve={isLoggedIn} errorElement={<IconLogin />}>
          {(isLoggedIn) => (isLoggedIn ? <IconAccount /> : <IconLogin />)}
        </Await>
      </Suspense>
    </Link>
  );
}

function CartCount({isHome, openCart}) {
  const rootData = useRouteLoaderData('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={<Badge count={0} dark={isHome} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Badge
            dark={isHome}
            openCart={openCart}
            count={cart?.totalQuantity || 0}
          />
        )}
      </Await>
    </Suspense>
  );
}

function Badge({openCart, dark, count}) {
  const isHydrated = useIsHydrated();

  const BadgeCounter = useMemo(
    () => (
      <>
        <IconBag />
        <div
          className={`${
            dark
              ? 'text-primary bg-contrast dark:text-contrast dark:bg-primary'
              : 'text-contrast bg-primary'
          } absolute bottom-1 right-1 text-[0.625rem] font-medium subpixel-antialiased h-3 min-w-[0.75rem] flex items-center justify-center leading-none text-center rounded-full w-auto px-[0.125rem] pb-px`}
        >
          <span>{count || 0}</span>
        </div>
      </>
    ),
    [count, dark],
  );

  return isHydrated ? (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5"
    >
      {BadgeCounter}
    </button>
  ) : (
    <Link
      to="/cart"
      className="relative flex items-center justify-center w-8 h-8 focus:ring-primary/5"
    >
      {BadgeCounter}
    </Link>
  );
}

// Footer removed

function BottomBar() {
  const rootData = useRouteLoaderData('root');
  if (!rootData) return null;

  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const fetcher = useFetcher();

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Click outside closes any open panel
  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setHelpOpen(false);
        setSearchOpen(false);
      }
    }
    const needsListener = helpOpen || searchOpen;
    if (needsListener) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [helpOpen, searchOpen]);

  // Autofocus search input when the search panel opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    if (term) {
      fetcher.load(`/api/predictive-search?q=${term}&limit=5`);
    }
  };

  // staged help links so we can animate with staggered delays
  const helpLinks = [
    {to: '/contact', label: 'Contact'},
    {to: '/terms-of-service', label: 'Terms of Service'},
    {to: '/shipping-and-returns', label: 'Shipping & Returns'},
    {to: '/policies/privacy-policy', label: 'Privacy Policy'},
  ];

  const searchResults = fetcher.data?.items || [];
  const searchTerm = searchInputRef.current?.value || '';

  return (
    <div className="fixed inset-x-0 pointer-events-none z-50" style={{bottom: '2.5vh'}}>
      <div
        id="bottomIcons"
        ref={containerRef}
        className="w-full flex items-center justify-between"
        style={{
          height: '6vh',
          paddingLeft: 'max(3vw, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(3vw, env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Help (left) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            aria-expanded={helpOpen}
            aria-controls="help-menu"
            onClick={() => {
              setHelpOpen((v) => !v);
              setSearchOpen(false);
            }}
            className="tap flex items-center justify-center w-8 h-8 text-primary focus:ring-primary/5 bg-transparent"
            aria-label={helpOpen ? 'Close help menu' : 'Open help menu'}
          >
            <span className="text-xl leading-none">{helpOpen ? '×' : '?'}</span>
          </button>

          <div id="help-menu" role="menu" aria-hidden={!helpOpen} style={{overflow: 'hidden'}}>
            <nav
              className={`origin-left transform-gpu ${
                helpOpen
                  ? 'scale-x-100 opacity-100 translate-y-0 pointer-events-auto drop-shadow-lg'
                  : 'scale-x-0 opacity-0 -translate-y-[0.4vh] pointer-events-none drop-shadow-none'
              }`}
              style={{
                willChange: 'transform, opacity, filter',
                transition:
                  'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring), filter var(--dur-slower) var(--ease-spring)',
              }}
            >
              <div
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 bg-contrast/85 backdrop-blur-md text-primary rounded-md ring-1 ring-primary/10 ${
                  helpOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[0.4vh]'
                }`}
                style={{
                  padding: '1.6vh 3vw',
                  transition:
                    'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring)',
                }}
              >
              {helpLinks.map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  role="menuitem"
                  className={`text-sm ${helpOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[0.6vh]'}`}
                  onClick={() => setHelpOpen(false)}
                  style={{
                    transition: 'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring)',
                    transitionDelay: helpOpen ? `${i * 60}ms` : '0ms',
                  }}
                >
                  {l.label}
                </Link>
              ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Search (right) */}
        <div className="pointer-events-auto flex items-center gap-2 flex-row-reverse">
          <button
            aria-expanded={searchOpen}
            aria-controls="search-menu"
            onClick={() => {
              setSearchOpen((v) => !v);
              setHelpOpen(false);
            }}
            className="tap flex items-center justify-center w-8 h-8 text-primary focus:ring-primary/5 bg-transparent"
            aria-label={searchOpen ? 'Close search' : 'Open search'}
          >
            {searchOpen ? (
              <IconClose className="w-7 h-7 md:w-8 md:h-8" />
            ) : (
              <IconSearch className="w-7 h-7 md:w-8 md:h-8" />
            )}
          </button>

          {/* Desktop/tablet inline tray (hidden on mobile) */}
          <div id="search-menu" role="menu" aria-hidden={!searchOpen} className="hidden md:block" style={{overflow: 'visible'}}>
            <nav
              className={`origin-right transform-gpu ${
                searchOpen
                  ? 'scale-x-100 opacity-100 translate-y-0 pointer-events-auto drop-shadow-lg'
                  : 'scale-x-0 opacity-0 -translate-y-[0.4vh] pointer-events-none drop-shadow-none'
              }`}
              style={{
                willChange: 'transform, opacity, filter',
                transition:
                  'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring), filter var(--dur-slower) var(--ease-spring)',
              }}
            >
              <div
                className={`flex flex-col gap-2 bg-contrast/85 backdrop-blur-md text-primary rounded-md ring-1 ring-primary/10 ${
                  searchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[0.4vh]'
                }`}
                style={{
                  padding: '1.2vh 2.6vw',
                  transition:
                    'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring)',
                  minWidth: '300px'
                }}
              >
                <form role="search" action="/search" method="get" className="flex items-center gap-2 w-full">
                  <input
                    ref={searchInputRef}
                    name="q"
                    type="search"
                    placeholder="Search…"
                    onChange={handleSearchChange}
                    className={`${searchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[0.6vh]'} w-[70vw] md:w-[42vw] max-w-[90vw] md:max-w-[50vw] text-primary placeholder:text-primary/60 bg-contrast/30 rounded-full px-4 py-2 ring-1 ring-primary/20 focus:ring-2 focus:ring-primary/40 focus:outline-none text-base md:text-lg`}
                    style={{
                      transition: 'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring)',
                      transitionDelay: searchOpen ? '60ms' : '0ms',
                    }}
                  />
                  <button
                    type="submit"
                    className={`tap ${searchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[0.6vh]'} rounded-full px-4 py-2 bg-primary text-contrast hover:bg-primary/90 transition-colors shadow`}
                    style={{
                      transition: 'transform var(--dur-slower) var(--ease-spring), opacity var(--dur-slower) var(--ease-spring)',
                      transitionDelay: searchOpen ? '120ms' : '0ms',
                    }}
                  >
                    Go
                  </button>
                </form>
                
                {/* Desktop Results */}
                {searchTerm && (
                  <div className="w-full border-t border-primary/10 pt-2 mt-2">
                    <PredictiveResults items={searchResults} term={searchTerm} />
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile full-screen search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden pointer-events-auto bg-contrast/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSearchOpen(false)}
          style={{padding: '8vh 6vw'}}
        >
          <div
            className="relative mx-auto flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
            style={{width: '88vw'}}
          >
            <form role="search" action="/search" method="get" className="flex items-center gap-[4vw] w-full">
              <input
                ref={searchInputRef}
                name="q"
                type="search"
                placeholder="Search…"
                onChange={handleSearchChange}
                className="flex-1 bg-contrast/80 text-primary placeholder:text-primary/60 rounded-full px-[4vw] py-[2.6vh] ring-1 ring-primary/25 focus:ring-2 focus:ring-primary/40 focus:outline-none text-[max(1rem,3.8vw)]"
              />
              <button
                type="submit"
                className="rounded-full px-[4vw] py-[2.2vh] bg-primary text-contrast hover:bg-primary/90 transition-colors shadow text-[max(1rem,3.6vw)]"
              >
                Go
              </button>
            </form>

            {/* Mobile Results */}
            {searchTerm && (
              <div className="bg-contrast/90 backdrop-blur-md rounded-lg p-4 shadow-lg max-h-[60vh] overflow-y-auto">
                <PredictiveResults items={searchResults} term={searchTerm} />
              </div>
            )}

            <button
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
              className="absolute -top-[5vh] right-0 text-primary"
            >
              <IconClose className="w-[7vw] h-[7vw]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PredictiveResults({items, term}) {
  if (!term) return null;
  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-primary/60 uppercase tracking-widest text-xs">
        Not found
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      {items.map((product) => (
        <Link
          key={product.id}
          to={`/products/${product.handle}`}
          className="flex items-center gap-4 p-2 hover:bg-primary/5 rounded transition-colors"
        >
          {product.featuredImage && (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText}
              className="w-12 h-12 object-contain rounded-sm bg-white"
            />
          )}
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium uppercase tracking-wide">{product.title}</span>
            <span className="text-xs text-primary/60">
              {product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Deprecated: SearchButton merged into BottomBar for unified behavior
