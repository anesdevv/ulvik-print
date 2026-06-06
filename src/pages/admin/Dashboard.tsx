import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Order } from '../../lib/api';
import { ShoppingBag, AlertTriangle, ListOrdered, ClipboardList, Loader2, ArrowRight, TrendingUp, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';

let globalAudioCtx: AudioContext | null = null;

const playNotificationSound = () => {
  try {
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    
    // First tone (higher pitch)
    const osc1 = globalAudioCtx.createOscillator();
    const gain1 = globalAudioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(globalAudioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, globalAudioCtx.currentTime); // D5
    gain1.gain.setValueAtTime(0.1, globalAudioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.4);
    osc1.start(globalAudioCtx.currentTime);
    osc1.stop(globalAudioCtx.currentTime + 0.4);

    // Second tone (lower pitch, slightly delayed)
    const osc2 = globalAudioCtx.createOscillator();
    const gain2 = globalAudioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(globalAudioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, globalAudioCtx.currentTime + 0.15); // A4
    gain2.gain.setValueAtTime(0, globalAudioCtx.currentTime);
    gain2.gain.setValueAtTime(0.1, globalAudioCtx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.65);
    osc2.start(globalAudioCtx.currentTime + 0.15);
    osc2.stop(globalAudioCtx.currentTime + 0.65);
  } catch (err) {
    console.error('Failed to play audio notification', err);
  }
};

const showBrowserNotification = (order: Order) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const title = `Nouvelle Commande / New Order`;
      const body = `${order.customer_name} a commandé ${order.product_name} (${order.size} / ${order.color}) pour ${order.total_price.toLocaleString()} DZD`;
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: order.id,
      });
      notification.onclick = () => {
        window.focus();
      };
    } catch (err) {
      console.error('Failed to show browser notification', err);
    }
  }
};

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    newOrders: 0,
    totalProducts: 0,
    outOfStockProducts: 0,
  });
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sound and Autorefresh Polling State/Refs
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Authenticate Admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoadingData(true);
      setError(null);

      // Fetch products (under admin auth, this returns all products)
      const productsList = await api.products.list();
      const totalProducts = productsList.length;
      const outOfStockProducts = productsList.filter((p) => !p.in_stock).length;

      // Fetch total orders count
      const totalOrdersRes = await api.orders.list({ limit: 1 });
      const totalOrders = totalOrdersRes.count;

      // Fetch new orders count
      const newOrdersRes = await api.orders.list({ status: 'new', limit: 1 });
      const newOrders = newOrdersRes.count;

      // Fetch recent 10 orders
      const recentOrdersRes = await api.orders.list({ limit: 10 });
      setRecentOrders(recentOrdersRes.orders);

      // Populate knownOrderIdsRef on first load
      if (knownOrderIdsRef.current.size === 0 && recentOrdersRes.orders) {
        recentOrdersRes.orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      }

      setStats({
        totalOrders,
        newOrders,
        totalProducts,
        outOfStockProducts,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (!isSilent) setIsLoadingData(false);
    }
  };

  // Fetch Stats Data on Mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Polling for auto-refresh and sound notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkNewOrders = async () => {
      try {
        // Fetch the single latest new order to check for notifications
        const latestNewRes = await api.orders.list({ status: 'new', limit: 1 });
        if (latestNewRes.orders && latestNewRes.orders.length > 0) {
          const latestOrder = latestNewRes.orders[0];
          
          if (!knownOrderIdsRef.current.has(latestOrder.id)) {
            knownOrderIdsRef.current.add(latestOrder.id);
            
            // Play sound & notification! (Only if this is not the very first load of the page)
            if (isInitializedRef.current) {
              if (soundEnabled) {
                playNotificationSound();
              }
              showBrowserNotification(latestOrder);
            }
          }
        }

        // Mark as initialized
        isInitializedRef.current = true;

        // Silently refresh stats
        await fetchDashboardData(true);
      } catch (err) {
        console.error('Error during auto-refresh dashboard polling', err);
      }
    };

    // Set initialized to true after initial fetch
    const initialTimeout = setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000);

    // Check every 15 seconds
    const interval = setInterval(checkNewOrders, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isAuthenticated, soundEnabled]);

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const handleUnlock = () => {
      try {
        if (!globalAudioCtx) {
          globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (globalAudioCtx.state === 'suspended') {
          globalAudioCtx.resume();
        }
        document.removeEventListener('click', handleUnlock);
      } catch (e) {
        console.error(e);
      }
    };
    document.addEventListener('click', handleUnlock);
    return () => document.removeEventListener('click', handleUnlock);
  }, []);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-brand-gray text-sm">Vérification de la session...</p>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-brand-gray text-sm">Chargement des données du tableau de bord...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'confirmed':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'shipped':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'delivered':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white">
            {t('admin.dashboard_title')}
          </h1>
          <p className="text-brand-gray text-xs mt-1">
            Bienvenue dans votre espace d'administration de la boutique.
          </p>
        </div>
        
        {/* Navigation Quick Links and Sound Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Browser Notifications Toggle */}
          {notificationPermission === 'default' && (
            <button
              onClick={async () => {
                if ('Notification' in window) {
                  const permission = await Notification.requestPermission();
                  setNotificationPermission(permission);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-semibold hover:bg-brand-orange/25 transition-all cursor-pointer animate-pulse"
              title="Activer les notifications navigateur"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Activer Notifications</span>
            </button>
          )}

          {notificationPermission === 'granted' && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-medium">
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications OK</span>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium" title="Notifications bloquées par votre navigateur">
              <BellOff className="w-3.5 h-3.5" />
              <span>Notifications bloquées</span>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                : 'bg-brand-card border-brand-border text-brand-gray hover:text-white'
            }`}
            title={soundEnabled ? "Muter le son" : "Activer le son"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? "Son activé" : "Son désactivé"}</span>
          </button>

          <Link
            to="/admin/products"
            className="px-4 py-2 bg-brand-card hover:bg-neutral-800 border border-brand-border text-white text-xs font-semibold rounded-xl transition-all"
          >
            {t('admin.products_title')}
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-brand-card hover:bg-neutral-800 border border-brand-border text-white text-xs font-semibold rounded-xl transition-all"
          >
            {t('admin.orders_title')}
          </Link>
          <Link
            to="/admin/delivery"
            className="px-4 py-2 bg-brand-card hover:bg-neutral-800 border border-brand-border text-white text-xs font-semibold rounded-xl transition-all"
          >
            {t('admin.delivery_title')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Total Orders Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{t('admin.total_orders')}</span>
            <span className="text-3xl font-heading font-extrabold text-white">{stats.totalOrders}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ListOrdered className="w-6 h-6" />
          </div>
        </div>

        {/* New Orders Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{t('admin.new_orders')}</span>
            <span className="text-3xl font-heading font-extrabold text-brand-orange">{stats.newOrders}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
            <ShoppingBag className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Total Products Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{t('admin.total_products')}</span>
            <span className="text-3xl font-heading font-extrabold text-white">{stats.totalProducts}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Out of Stock Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{t('admin.out_of_stock_count')}</span>
            <span className="text-3xl font-heading font-extrabold text-red-500">{stats.outOfStockProducts}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-orange" />
            <h2 className="text-white font-heading font-bold text-lg">
              {t('admin.recent_orders')}
            </h2>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-brand-orange hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
          >
            <span>Voir toutes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table wrapper for responsiveness */}
        <div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-brand-gray text-sm">
              Aucune commande récente.
            </div>
          ) : (
            <>
              {/* Desktop Table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-gray font-semibold text-xs uppercase">
                      <th className="py-3 px-4">Commande</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Produit</th>
                      <th className="py-3 px-4">Options</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="py-4 px-4 font-mono text-brand-orange font-semibold text-xs">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-4 px-4 font-medium text-white">
                          {order.customer_name}
                        </td>
                        <td className="py-4 px-4 text-brand-gray text-xs">
                          {new Date(order.created_at).toLocaleDateString(t('i18n.language') === 'en' ? 'en-US' : 'fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 text-white max-w-[150px] truncate">
                          {order.product_name}
                        </td>
                        <td className="py-4 px-4 text-brand-gray text-xs">
                          {order.size} / {order.color}
                        </td>
                        <td className="py-4 px-4 font-bold text-white">
                          {order.total_price.toLocaleString()} DZD
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {t(`status.${order.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card view */}
              <div className="md:hidden flex flex-col divide-y divide-brand-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-brand-orange font-bold text-xs">#{order.id.slice(0, 8)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(order.status)}`}>
                        {t(`status.${order.status}`)}
                      </span>
                    </div>
                    <div className="flex flex-col text-xs text-brand-gray gap-1">
                      <span className="font-medium text-white text-sm">{order.customer_name}</span>
                      <span className="truncate">{order.product_name} ({order.size} / {order.color})</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-white font-bold">{order.total_price.toLocaleString()} DZD</span>
                        <span>
                          {new Date(order.created_at).toLocaleDateString(t('i18n.language') === 'en' ? 'en-US' : 'fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
