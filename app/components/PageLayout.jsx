import {useParams, Form, Await, useRouteLoaderData} from '@remix-run/react';
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
        <main role="main" id="mainContent" className="flex-grow">
          {children}
        </main>
        {/* Bottom bar per Valcee mocks */}
        <BottomBar />
      </div>
      {footerMenu && !isHome && <Footer menu={footerMenu} />}
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
        isHome
          ? 'bg-contrast text-primary'
          : 'bg-contrast text-primary'
      } flex items-center h-nav sticky z-40 top-0 justify-between w-full leading-none gap-4 px-4 md:px-8`}
    >
      <div className="flex items-center justify-start w-full">
        <button
          onClick={openMenu}
          aria-label="Open Menu"
          className="relative flex items-center justify-center w-8 h-8 text-primary"
        >
          <span className="text-xl leading-none">!</span>
        </button>
      </div>

      <Link
        className="flex items-center self-stretch leading-[3rem] md:leading-[4rem] justify-center flex-grow w-full h-full"
        to="/"
        aria-label={title || 'Valcee Couture'}
      >
        <img
          src="/images/valcee-logo.png"
          alt={title || 'Valcee'}
          className="h-12 md:h-16 lg:h-20 object-contain"
          loading="eager"
        />
      </Link>

      <div className="flex items-center justify-end w-full">
        <Link
          to={params.locale ? `/${params.locale}/editorial` : '/editorial'}
          aria-label="Information"
          className="relative flex items-center justify-center w-8 h-8 text-primary"
        >
          <span className="text-base leading-none">i</span>
        </Link>
      </div>
    </header>
  );
}

/**
 * Fixed bottom bar with left "?" (help) and right cart badge
 */
function BottomBar() {
  const isHome = useIsHomePath();
  const rootData = useRouteLoaderData('root');
  if (!rootData) return null;
  return (
    <div className="fixed bottom-4 left-0 right-0 pointer-events-none">
      <div className="max-w-screen mx-auto">
        <div className="flex justify-between px-6">
          <Link
            to="/policies"
            className="pointer-events-auto relative flex items-center justify-center w-8 h-8 text-primary"
            aria-label="Help"
          >
            <span className="text-xl leading-none">?</span>
          </Link>
          <div className="pointer-events-auto">
            <CartCount isHome={isHome} openCart={() => {
              const event = new CustomEvent('open-cart');
              window.dispatchEvent(event);
            }} />
          </div>
        </div>
      </div>
    </div>
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
      <div className="grid">
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
  const staticItems = [
    {id: 'gallery', title: 'Gallery', to: '/gallery'},
    {id: 'archive', title: 'Archive', to: '/collections'},
    {id: 'editorial', title: 'Editorial', to: '/editorial'},
    {id: 'connect', title: 'Connect', to: '/connect'},
    {id: 'account', title: 'Account', to: '/account'},
  ];
  return (
    <nav className="grid gap-6 p-6 sm:gap-8 sm:px-12 sm:py-8">
      {staticItems.map((item) => (
        <span key={item.id} className="block">
          <Link to={item.to} onClick={onClose}>
            <Heading as="span" size="display" className="leading-none">
              {item.title}
            </Heading>
          </Link>
        </span>
      ))}
      {/* Divider */}
      <div className="h-px bg-primary/20 my-2" />
      {/* Fallback to Shopify menu items if configured */}
      {(menu?.items || []).map((item) => (
        <span key={item.id} className="block">
          <Link
            to={item.to}
            target={item.target}
            onClick={onClose}
            className={({isActive}) => (isActive ? 'pb-1 border-b -mb-px' : 'pb-1')}
          >
            <Text as="span" size="copy">
              {item.title}
            </Text>
          </Link>
        </span>
      ))}
      <span>
        <Link to="/account/logout" onClick={onClose}>
          <Text as="span" size="fine">Log out</Text>
        </Link>
      </span>
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
      } flex lg:hidden items-center h-nav sticky backdrop-blur-lg z-40 top-0 justify-between w-full leading-none gap-4 px-4 md:px-8`}
    >
      <div className="flex items-center justify-start w-full gap-4">
        <button
          onClick={openMenu}
          className="relative flex items-center justify-center w-8 h-8"
        >
          <IconMenu />
        </button>
        <Form
          method="get"
          action={params.locale ? `/${params.locale}/search` : '/search'}
          className="items-center gap-2 sm:flex"
        >
          <button
            type="submit"
            className="relative flex items-center justify-center w-8 h-8"
          >
            <IconSearch />
          </button>
          <Input
            className={
              isHome
                ? 'focus:border-contrast/20 dark:focus:border-primary/20'
                : 'focus:border-primary/20'
            }
            type="search"
            variant="minisearch"
            placeholder="Search"
            name="q"
          />
        </Form>
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

function Footer({menu}) {
  return (
    <footer className="bg-contrast text-primary border-t border-primary/10">
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        {menu ? (
          <FooterMenu menu={menu} />
        ) : (
          <div className="text-sm opacity-70">Valcee Couture</div>
        )}
      </div>
    </footer>
  );
}

function FooterMenu({menu}) {
  const items = menu?.items || [];
  return (
    <nav className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.id}>
          <Link to={item.to} target={item.target} className="underline-offset-4 hover:underline">
            {item.title}
          </Link>
          {item.items?.length ? (
            <ul className="mt-2 space-y-1">
              {item.items.map((child) => (
                <li key={child.id}>
                  <Link to={child.to} target={child.target} className="text-sm opacity-80 underline-offset-4 hover:underline">
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
