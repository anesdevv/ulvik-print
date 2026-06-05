import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { Product, DeliveryPrice } from '../lib/api';
import { ArrowLeft, Loader2, ShoppingBag, Truck, MapPin } from 'lucide-react';

interface CheckoutState {
  product: Product;
  selectedSize: string;
  selectedColor: { label: string; hex: string };
}

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const state = location.state as CheckoutState | null;

  const [deliveryPrices, setDeliveryPrices] = useState<DeliveryPrice[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [baladiya, setBaladiya] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if no product in state
  useEffect(() => {
    if (!state || !state.product) {
      navigate('/');
    }
  }, [state, navigate]);

  // Fetch delivery pricing
  useEffect(() => {
    const fetchDeliveryPrices = async () => {
      try {
        setIsLoadingPrices(true);
        const data = await api.delivery.list();
        setDeliveryPrices(data);
      } catch (err: any) {
        console.error('Failed to load delivery prices:', err);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchDeliveryPrices();
  }, []);

  // Recalculate delivery fee when Wilaya or Delivery Type changes
  useEffect(() => {
    if (!selectedWilaya) {
      setDeliveryFee(0);
      return;
    }

    if (deliveryType === 'desk') {
      setDeliveryFee(0);
      return;
    }

    const priceObj = deliveryPrices.find((p) => p.wilaya === selectedWilaya);
    setDeliveryFee(priceObj ? priceObj.fee : 0);
  }, [selectedWilaya, deliveryType, deliveryPrices]);

  if (!state || !state.product) {
    return null; // Redirecting...
  }

  const { product, selectedSize, selectedColor } = state;
  const currentLang = localStorage.getItem('ulvik_lang') || 'fr';
  const productName = currentLang === 'en' ? product.name_en : product.name_fr;
  const productPrice = product.price;
  const totalPrice = productPrice + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!fullName.trim() || !phone.trim() || !selectedWilaya || !baladiya.trim()) {
      setError(t('checkout.error_fields'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Phone format validation (rough check for Algeria mobile numbers e.g. 10 digits starting with 05, 06, 07 or similar)
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      setError(t('checkout.error_phone'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      const orderData = {
        product_id: product.id,
        product_name: productName,
        size: selectedSize,
        color: selectedColor.label,
        customer_name: fullName.trim(),
        phone: cleanPhone,
        wilaya: selectedWilaya,
        baladiya: baladiya.trim(),
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
        total_price: totalPrice,
      };

      const placedOrder = await api.orders.create(orderData);
      
      // Redirect to confirmation page with the created order details
      navigate('/order-confirmed', {
        state: {
          order: placedOrder,
          product, // pass original product to show image etc.
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 md:px-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link
          to={`/product/${product.id}`}
          className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-orange text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au produit / Back to product</span>
        </Link>
      </div>

      <h1 className="text-3xl font-heading font-extrabold text-white mb-10 text-center md:text-left">
        {t('checkout.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Delivery Form (Left 7 Columns) */}
        <div className="lg:col-span-7 bg-brand-card rounded-2xl border border-brand-border p-6 md:p-8">
          <h2 className="text-white font-heading font-bold text-lg mb-6 border-b border-brand-border pb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-orange" />
            <span>{t('checkout.customer_details')}</span>
          </h2>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className="text-sm font-semibold text-brand-gray">
                {t('checkout.full_name')} *
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Mohamed Benali"
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-3 text-white transition-all outline-none"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-semibold text-brand-gray">
                {t('checkout.phone')} *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 0550123456"
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-3 text-white transition-all outline-none"
              />
            </div>

            {/* Wilaya Selection */}
            <div className="flex flex-col gap-2">
              <label htmlFor="wilaya" className="text-sm font-semibold text-brand-gray">
                {t('checkout.wilaya')} *
              </label>
              {isLoadingPrices ? (
                <div className="flex items-center gap-2 text-xs text-brand-gray py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
                  <span>Chargement des wilayas...</span>
                </div>
              ) : (
                <select
                  id="wilaya"
                  required
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-3 text-white transition-all outline-none cursor-pointer"
                >
                  <option value="">-- Sélectionner Wilaya --</option>
                  {deliveryPrices.map((p) => (
                    <option key={p.wilaya} value={p.wilaya}>
                      {p.wilaya}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Baladiya (Commune) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="baladiya" className="text-sm font-semibold text-brand-gray">
                {t('checkout.baladiya')} *
              </label>
              <input
                id="baladiya"
                type="text"
                required
                value={baladiya}
                onChange={(e) => setBaladiya(e.target.value)}
                placeholder="Ex: Didouche Mourad"
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-3 text-white transition-all outline-none"
              />
            </div>

            {/* Delivery Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-brand-gray mb-1">
                {t('checkout.delivery_type')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Home Delivery */}
                <button
                  type="button"
                  onClick={() => setDeliveryType('home')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    deliveryType === 'home'
                      ? 'bg-brand-orange/5 border-brand-orange text-white'
                      : 'bg-brand-dark border-brand-border text-brand-gray hover:border-brand-gray'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deliveryType === 'home' ? 'border-brand-orange' : 'border-brand-gray'
                  }`}>
                    {deliveryType === 'home' && <div className="w-2.5 h-2.5 rounded-full bg-brand-orange" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white">{t('checkout.delivery_home')}</span>
                    <span className="text-[11px] text-brand-gray">Livraison à votre adresse</span>
                  </div>
                </button>

                {/* Desk Pickup (Stop desk) */}
                <button
                  type="button"
                  onClick={() => setDeliveryType('desk')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    deliveryType === 'desk'
                      ? 'bg-brand-orange/5 border-brand-orange text-white'
                      : 'bg-brand-dark border-brand-border text-brand-gray hover:border-brand-gray'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deliveryType === 'desk' ? 'border-brand-orange' : 'border-brand-gray'
                  }`}>
                    {deliveryType === 'desk' && <div className="w-2.5 h-2.5 rounded-full bg-brand-orange" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white">{t('checkout.delivery_desk')}</span>
                    <span className="text-[11px] text-brand-gray">Récupérer dans le bureau de transport (0 DZD)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Order Confirmation Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white font-heading font-bold rounded-xl transition-all cursor-pointer text-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('checkout.submitting')}</span>
                </>
              ) : (
                <span>{t('checkout.submit')}</span>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary Column (Right 5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
            <h2 className="text-white font-heading font-bold text-lg mb-6 border-b border-brand-border pb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-orange" />
              <span>{t('checkout.summary')}</span>
            </h2>

            {/* Product Snapshot Info */}
            <div className="flex gap-4 mb-6 pb-6 border-b border-brand-border">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-brand-border flex-shrink-0">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop'}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <h4 className="text-white font-semibold text-sm line-clamp-1">{productName}</h4>
                  <p className="text-xs text-brand-gray mt-1.5 flex gap-2">
                    <span>{t('checkout.size')}: <strong className="text-white">{selectedSize}</strong></span>
                    <span>|</span>
                    <span>{t('checkout.color')}: <strong className="text-white">{selectedColor.label}</strong></span>
                  </p>
                </div>
                <span className="text-white font-bold text-sm">
                  {productPrice.toLocaleString()} DZD
                </span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="flex flex-col gap-3 text-sm border-b border-brand-border pb-6">
              <div className="flex justify-between text-brand-gray">
                <span>{t('checkout.product_name')}</span>
                <span className="text-white font-medium">{productPrice.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between text-brand-gray">
                <span>{t('checkout.delivery_fee')} ({deliveryType === 'home' ? 'Domicile' : 'Stop desk'})</span>
                <span className="text-white font-medium">
                  {selectedWilaya
                    ? `${deliveryFee.toLocaleString()} DZD`
                    : '--'}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-6 text-white">
              <span className="font-bold text-base">{t('checkout.total')}</span>
              <span className="font-heading font-extrabold text-2xl text-brand-orange">
                {totalPrice.toLocaleString()} <span className="text-xs font-semibold">DZD</span>
              </span>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-brand-dark border border-brand-border flex gap-3 text-brand-gray text-[11px] leading-relaxed">
              <MapPin className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
              <p>Paiement en espèces disponible uniquement à la livraison (Cash on Delivery). Vous payez le livreur dès réception de votre colis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
