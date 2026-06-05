import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Order } from '../../lib/api';
import * as XLSX from 'xlsx';
import { Loader2, Download, Filter, RefreshCw, ChevronLeft, ChevronRight, Phone, MapPin, Calendar, Volume2, VolumeX, Trash2 } from 'lucide-react';

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

export const Orders: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sound and Autorefresh Polling State/Refs
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limitPerPage] = useState(20);

  // 58 Wilayas cache for filtering dropdown
  const [wilayasList, setWilayasList] = useState<string[]>([]);

  // Authenticate Admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load Wilayas for filter list
  useEffect(() => {
    const loadWilayas = async () => {
      try {
        const data = await api.delivery.list();
        setWilayasList(data.map((w) => w.wilaya));
      } catch (err) {
        console.error('Failed to load wilayas for filters', err);
      }
    };
    if (isAuthenticated) {
      loadWilayas();
    }
  }, [isAuthenticated]);

  // Load Orders
  const fetchOrders = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setError(null);
      
      const filters = {
        status: statusFilter || undefined,
        wilaya: wilayaFilter || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page: currentPage,
        limit: limitPerPage,
      };

      const res = await api.orders.list(filters);
      setOrders(res.orders);
      setTotalCount(res.count);

      // Populate knownOrderIdsRef on first load
      if (knownOrderIdsRef.current.size === 0 && res.orders) {
        res.orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, statusFilter, wilayaFilter, dateFrom, dateTo, currentPage]);

  // Polling for auto-refresh and sound notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkNewOrders = async () => {
      try {
        // Fetch the single latest new order to check for notifications
        const latestNewRes = await api.orders.list({ status: 'new', limit: 1 });
        if (latestNewRes.orders && latestNewRes.orders.length > 0) {
          const latestOrder = latestNewRes.orders[0];
          
          // If this is a brand new order we haven't seen yet
          if (!knownOrderIdsRef.current.has(latestOrder.id)) {
            knownOrderIdsRef.current.add(latestOrder.id);
            
            // Play sound! (Only if this is not the very first load of the page)
            if (isInitializedRef.current && soundEnabled) {
              playNotificationSound();
            }
          }
        }

        // Mark as initialized after the first check
        isInitializedRef.current = true;

        // Auto-refresh the current list silently
        await fetchOrders(true);
      } catch (err) {
        console.error('Error during auto-refresh polling', err);
      }
    };

    // Set initialized to true after initial fetch completes
    const initialTimeout = setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000);

    // Check every 15 seconds
    const interval = setInterval(checkNewOrders, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isAuthenticated, statusFilter, wilayaFilter, dateFrom, dateTo, currentPage, soundEnabled]);

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

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette commande ? Cette action est irréversible.')) {
      return;
    }
    try {
      await api.orders.delete(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      alert(err.message || 'Failed to delete order');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.orders.updateStatus(id, newStatus);
      // update state inline instead of full refresh for smoother UX
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus as any } : o))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setWilayaFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (orders.length === 0) {
      alert('Aucune commande à exporter.');
      return;
    }

    // Map fields for Excel formatting
    const dataToExport = orders.map((o) => ({
      'ID Commande': o.id,
      'Date': new Date(o.created_at).toLocaleDateString('fr-FR'),
      'Client': o.customer_name,
      'Téléphone': o.phone,
      'Wilaya': o.wilaya,
      'Commune (Baladiya)': o.baladiya,
      'Type Livraison': o.delivery_type === 'home' ? 'A Domicile' : 'Stop desk',
      'Produit': o.product_name,
      'Taille': o.size,
      'Couleur': o.color,
      'Frais': o.delivery_fee,
      'Total (DZD)': o.total_price,
      'Statut': t(`status.${o.status}`),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `ulvik-orders-${today}.xlsx`);
  };

  const getStatusBg = (status: string) => {
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
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const totalPages = Math.ceil(totalCount / limitPerPage);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-brand-gray text-sm">Vérification de la session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            {t('admin.orders_title')}
          </h1>
          <p className="text-brand-gray text-xs mt-1">
            Gérez vos commandes, modifiez les statuts et exportez les rapports.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                : 'bg-neutral-900 border-brand-border text-brand-gray hover:text-white'
            }`}
            title={soundEnabled ? "Muter le son" : "Activer le son"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? "Son activé" : "Son désactivé"}</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-card hover:bg-neutral-800 border border-brand-border text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-brand-orange" />
            <span>{t('admin.export_excel')}</span>
          </button>
        </div>
      </div>

      {/* Filters Box */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-brand-border pb-3">
          <Filter className="w-4 h-4 text-brand-orange" />
          <span className="font-heading font-bold text-sm text-white">Filtres de recherche</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-brand-gray uppercase tracking-wider">{t('admin.status_filter')}</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-white outline-none text-xs cursor-pointer focus:border-brand-orange"
            >
              <option value="">Tous les statuts</option>
              <option value="new">{t('status.new')}</option>
              <option value="confirmed">{t('status.confirmed')}</option>
              <option value="shipped">{t('status.shipped')}</option>
              <option value="delivered">{t('status.delivered')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
            </select>
          </div>

          {/* Wilaya */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-brand-gray uppercase tracking-wider">{t('admin.wilaya_filter')}</span>
            <select
              value={wilayaFilter}
              onChange={(e) => { setWilayaFilter(e.target.value); setCurrentPage(1); }}
              className="bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-white outline-none text-xs cursor-pointer focus:border-brand-orange"
            >
              <option value="">Toutes les Wilayas</option>
              {wilayasList.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-brand-gray uppercase tracking-wider">{t('admin.from')}</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-white outline-none text-xs focus:border-brand-orange"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-brand-gray uppercase tracking-wider">{t('admin.to')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-white outline-none text-xs focus:border-brand-orange"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border pt-4 mt-1">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 text-xs text-brand-gray hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('admin.clear_filters')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-brand-gray text-sm">Chargement des commandes...</p>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-brand-gray text-sm">
                Aucune commande trouvée correspondant aux critères.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-brand-gray font-semibold text-xs uppercase bg-neutral-900/10">
                    <th className="py-4 px-6">Commande</th>
                    <th className="py-4 px-6">Client & Tél</th>
                    <th className="py-4 px-6">Livraison</th>
                    <th className="py-4 px-6">Produit & Options</th>
                    <th className="py-4 px-6">Frais & Total</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-900/20 transition-colors">
                      {/* ID */}
                      <td className="py-4 px-6 font-mono text-brand-orange font-semibold text-xs">
                        #{order.id.slice(0, 8)}
                      </td>
                      
                      {/* Client */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{order.customer_name}</span>
                          <span className="text-[11px] text-brand-gray flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-brand-orange" />
                            <a href={`tel:${order.phone}`} className="hover:underline font-mono">{order.phone}</a>
                          </span>
                        </div>
                      </td>

                      {/* Delivery */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-white text-xs">{order.wilaya}</span>
                          <span className="text-[11px] text-brand-gray flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-brand-orange" />
                            <span>{order.baladiya} ({order.delivery_type === 'home' ? 'Domicile' : 'Stop desk'})</span>
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-medium max-w-[160px] truncate" title={order.product_name}>
                            {order.product_name}
                          </span>
                          <span className="text-[10px] text-brand-gray mt-1">
                            Taille: <strong className="text-white">{order.size}</strong> • Couleur: <strong className="text-white">{order.color}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{order.total_price.toLocaleString()} DZD</span>
                          <span className="text-[10px] text-brand-gray mt-0.5">
                            Frais: {order.delivery_fee.toLocaleString()} DZD
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-brand-gray text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                          <span>
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status Dropdown & Action */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer outline-none transition-all ${getStatusBg(
                              order.status
                            )}`}
                          >
                            <option value="new">{t('status.new')}</option>
                            <option value="confirmed">{t('status.confirmed')}</option>
                            <option value="shipped">{t('status.shipped')}</option>
                            <option value="delivered">{t('status.delivered')}</option>
                            <option value="cancelled">{t('status.cancelled')}</option>
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 rounded-lg border border-brand-border hover:border-red-500 text-brand-gray hover:text-red-400 transition-all cursor-pointer"
                            title="Supprimer la commande"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between text-xs text-brand-gray">
              <span>
                Affichage de {(currentPage - 1) * limitPerPage + 1} à{' '}
                {Math.min(currentPage * limitPerPage, totalCount)} sur {totalCount} commandes
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-brand-dark border border-brand-border hover:border-brand-gray text-white disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-white px-2">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-brand-dark border border-brand-border hover:border-brand-gray text-white disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
