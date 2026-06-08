import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { DeliveryPrice } from '../../lib/api';
import { Loader2, DollarSign, Save, Sparkles, CheckCircle } from 'lucide-react';

export const DeliveryPricing: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [prices, setPrices] = useState<DeliveryPrice[]>([]);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkTarget, setBulkTarget] = useState<'home' | 'desk' | 'both'>('both');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Authenticate Admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch Pricing List
  const fetchPricing = async () => {
    try {
      setIsLoading(true);
      const data = await api.delivery.list();
      setPrices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch delivery prices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPricing();
    }
  }, [isAuthenticated]);

  // Handle individual fee change in the table
  const handleFeeChange = (wilayaName: string, field: 'home_fee' | 'desk_fee', newFee: number) => {
    setSuccess(false);
    setPrices((prev) =>
      prev.map((item) => (item.wilaya === wilayaName ? { ...item, [field]: newFee } : item))
    );
  };

  // Bulk Apply amount to all Wilayas
  const handleBulkApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!bulkAmount || isNaN(Number(bulkAmount)) || Number(bulkAmount) < 0) {
      alert('Veuillez entrer un montant valide supérieur ou égal à 0.');
      return;
    }

    const amount = Number(bulkAmount);
    setPrices((prev) =>
      prev.map((item) => {
        if (bulkTarget === 'both') {
          return { ...item, home_fee: amount, desk_fee: amount };
        } else if (bulkTarget === 'home') {
          return { ...item, home_fee: amount };
        } else {
          return { ...item, desk_fee: amount };
        }
      })
    );
    setBulkAmount('');
  };

  // Save all pricing to database
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);
      
      await api.delivery.bulkUpdate(prices);
      
      setSuccess(true);
      // Automatically clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update pricing');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-brand-gray text-sm">Vérification de la session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 md:px-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            {t('admin.delivery_title')}
          </h1>
          <p className="text-brand-gray text-xs mt-1">
            Configurez les frais d'expédition à domicile par Wilaya pour les livraisons.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-orange/15"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{t('admin.save_prices')}</span>
        </button>
      </div>

      {/* Bulk Apply Bar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-orange" />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-sm text-white">Modification de masse</span>
            <span className="text-[10px] text-brand-gray">Appliquer le même tarif aux 58 Wilayas d'un seul coup</span>
          </div>
        </div>

        <form onSubmit={handleBulkApply} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <select
            value={bulkTarget}
            onChange={(e) => setBulkTarget(e.target.value as 'home' | 'desk' | 'both')}
            className="bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-3 py-2 text-white outline-none text-xs cursor-pointer"
          >
            <option value="both">À domicile & Bureau</option>
            <option value="home">À domicile uniquement</option>
            <option value="desk">Bureau uniquement</option>
          </select>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="number"
              value={bulkAmount}
              onChange={(e) => setBulkAmount(e.target.value)}
              placeholder="Montant (ex: 800)"
              className="flex-grow sm:flex-grow-0 w-36 bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-3 py-2 text-white outline-none text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 border border-brand-border hover:border-brand-orange text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t('admin.apply')}
            </button>
          </div>
        </form>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/30 text-green-400 text-sm mb-6 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Frais de livraison mis à jour avec succès dans la base de données.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Wilaya Rates Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-brand-gray text-sm">Chargement des tarifs...</p>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-lg">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 bg-neutral-950 border-b border-brand-border text-brand-gray font-semibold text-xs uppercase z-10">
                  <th className="py-4 px-4 sm:px-6">Wilaya</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Frais à domicile (DZD)</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Frais Bureau / Pickup (DZD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {prices.map((item) => (
                  <tr key={item.wilaya} className="hover:bg-neutral-900/10 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 text-white font-medium">
                      {item.wilaya}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={item.home_fee}
                            onChange={(e) => handleFeeChange(item.wilaya, 'home_fee', Number(e.target.value))}
                            className="w-28 bg-brand-dark border border-brand-border focus:border-brand-orange rounded-lg pl-8 pr-3 py-1.5 text-right font-bold text-white text-xs outline-none transition-all"
                            min="0"
                          />
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-orange" />
                        </div>
                        <span className="text-xs text-brand-gray">DZD</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={item.desk_fee}
                            onChange={(e) => handleFeeChange(item.wilaya, 'desk_fee', Number(e.target.value))}
                            className="w-28 bg-brand-dark border border-brand-border focus:border-brand-orange rounded-lg pl-8 pr-3 py-1.5 text-right font-bold text-white text-xs outline-none transition-all"
                            min="0"
                          />
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-orange" />
                        </div>
                        <span className="text-xs text-brand-gray">DZD</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
