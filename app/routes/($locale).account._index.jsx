import {useOutletContext, Link} from '@remix-run/react';
import {flattenConnection, Image} from '@shopify/hydrogen';
import {Text} from '~/components/Text';
import {statusMessage} from '~/lib/utils';
import {IconHeart} from '~/components/Icon';

export default function AccountOverview() {
  const {customer, wishlistProductsPromise} = useOutletContext();
  const orders = flattenConnection(customer.orders);
  const activeOrders = orders.filter(
    (order) => order.fulfillmentStatus && order.fulfillmentStatus !== 'SUCCESS',
  );

  // Get wishlist count
  let wishlistCount = 0;
  try {
    wishlistCount = JSON.parse(customer.wishlist?.value || '[]').length;
  } catch (e) {}

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.fulfillmentStatus === 'SUCCESS').length;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Completed" value={completedOrders} />
        <StatCard label="Wishlist" value={wishlistCount} />
        <StatCard label="Active" value={activeOrders.length} highlight={activeOrders.length > 0} />
      </div>

      {/* Active Orders Banner */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-primary/60 mb-3 uppercase tracking-wider">Active Orders</h3>
          <ActiveOrdersBanner orders={activeOrders} />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-primary/60 mb-3 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionCard
            to="/account/orders"
            icon={<PackageIcon />}
            label="All Orders"
          />
          <ActionCard
            to="/account/wishlist"
            icon={<IconHeart className="w-6 h-6" />}
            label="Wishlist"
          />
          <ActionCard
            to="/account/settings"
            icon={<SettingsIcon />}
            label="Settings"
          />
          <ActionCard
            to="/account/contact"
            icon={<ConciergeIcon />}
            label="Help"
          />
        </div>
      </div>

      {/* Recent Purchases */}
      {orders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-primary/60 mb-3 uppercase tracking-wider">Recent Purchases</h3>
          <RecentPurchases orders={orders} />
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-primary/15 bg-primary/[0.02] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/5 flex items-center justify-center">
            <PackageIcon className="w-8 h-8 text-primary/20" />
          </div>
          <h3 className="text-base font-medium mb-2">Ready to start shopping?</h3>
          <p className="text-sm text-primary/50 mb-6 max-w-sm mx-auto">
            Discover our curated collection of timeless pieces designed for the modern woman.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 rounded-full bg-primary text-contrast text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Browse Collection
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({label, value, highlight}) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      highlight 
        ? 'border-primary/20 bg-primary/5' 
        : 'border-primary/10 bg-contrast/30'
    }`}>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      <div className="text-xs text-primary/50 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ActionCard({to, icon, label}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-primary/10 bg-contrast/30 backdrop-blur-sm p-5 transition-all hover:bg-contrast/50 hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
    >
      <div className="text-primary/50 group-hover:text-primary/80 transition-colors">
        {icon}
      </div>
      <span className="text-xs font-medium text-primary/70 group-hover:text-primary transition-colors">
        {label}
      </span>
    </Link>
  );
}

function ActiveOrdersBanner({orders}) {
  return (
    <div className="space-y-2.5">
      {orders.slice(0, 3).map((order) => (
        <OrderStatusCard key={order.id} order={order} />
      ))}
      {orders.length > 3 && (
        <Link
          to="/account/orders"
          className="block text-center py-3 text-xs text-primary/50 hover:text-primary transition-colors"
        >
          View {orders.length - 3} more active order{orders.length > 4 ? 's' : ''} →
        </Link>
      )}
    </div>
  );
}

function OrderStatusCard({order}) {
  const firstFulfillment = flattenConnection(order.fulfillments ?? {nodes: []})[0];
  const trackingUrl = firstFulfillment?.trackingInfo?.[0]?.url;
  const statusLabel = statusMessage(order.fulfillmentStatus) ?? 'Processing';

  return (
    <Link
      to={`/account/orders/${order.id.split('/').pop()}`}
      className="block rounded-xl border border-primary/10 bg-contrast/30 backdrop-blur-sm p-4 transition-all hover:bg-contrast/50 hover:border-primary/20"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <TruckIcon />
          </div>
          <div className="flex-1 min-w-0">
            <Text className="text-sm font-medium">Order #{order.number}</Text>
            <Text size="fine" className="text-primary/50">{statusLabel}</Text>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-contrast hover:bg-primary/90 transition-all"
            >
              Track
            </a>
          )}
          <ChevronRight />
        </div>
      </div>
    </Link>
  );
}

function RecentPurchases({orders}) {
  const purchases = collectPurchasedItems(orders).slice(0, 6);
  if (!purchases.length) return null;

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {purchases.map((item, idx) => (
        <div key={`${item.title}-${idx}`} className="group aspect-square rounded-xl overflow-hidden bg-primary/5 border border-primary/10 hover:border-primary/20 transition-all">
          {item.image?.url ? (
            <Image
              data={item.image}
              width={150}
              height={150}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt={item.image.altText ?? item.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/20">
              <PackageIcon />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function collectPurchasedItems(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const date = new Date(order.processedAt).toLocaleDateString();
    flattenConnection(order.lineItems ?? []).forEach((item) => {
      if (!map.has(item.title)) {
        map.set(item.title, {
          title: item.title,
          image: item.image ?? null,
          date,
        });
      }
    });
  });

  return Array.from(map.values());
}

// Icons
function PackageIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ConciergeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
