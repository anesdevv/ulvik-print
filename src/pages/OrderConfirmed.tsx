import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Order, Product } from '../lib/api';
import { WHATSAPP_NUMBER } from '../config';
import { CheckCircle2, MessageSquare, ArrowRight, ShoppingBag, MapPin, Phone, User } from 'lucide-react';

interface ConfirmedState {
  order: Order;
  product: Product;
}

export const OrderConfirmed: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const state = location.state as ConfirmedState | null;

  useEffect(() => {
    if (!state || !state.order) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state || !state.order) {
    return null; // Redirecting...
  }

  const { order } = state;
  const whatsappNumber = WHATSAPP_NUMBER;
  
  // Format WhatsApp message
  const getWhatsAppMessage = () => {
    const message = t('confirmed.whatsapp_message', {
      product: order.product_name,
      size: order.size,
      color: order.color
    }) + `\n\nNom: ${order.customer_name}\nTél: ${order.phone}\nWilaya: ${order.wilaya}\nTotal: ${order.total_price.toLocaleString()} DZD\nID Commande: ${order.id}`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-12 md:py-24 text-center">
      
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
      </div>

      <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">
        {t('confirmed.thank_you')}
      </h1>
      
      <p className="text-brand-gray text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed">
        {t('confirmed.message')}
      </p>

      {/* Order Info Card */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 md:p-8 text-left mb-10 shadow-xl max-w-lg mx-auto">
        <h2 className="text-white font-heading font-bold text-base border-b border-brand-border pb-3 mb-4 flex items-center justify-between">
          <span>{t('confirmed.order_id')}</span>
          <span className="text-brand-orange text-xs font-mono font-medium">{order.id.slice(0, 8)}...</span>
        </h2>

        {/* Order details grid */}
        <div className="flex flex-col gap-4 text-sm">
          {/* Customer */}
          <div className="flex gap-3 text-brand-gray">
            <User className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-brand-gray block">Client / Customer</span>
              <span className="text-white font-medium">{order.customer_name}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="flex gap-3 text-brand-gray">
            <Phone className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-brand-gray block">Téléphone / Phone</span>
              <span className="text-white font-medium font-mono">{order.phone}</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex gap-3 text-brand-gray">
            <MapPin className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-brand-gray block">Livraison / Delivery</span>
              <span className="text-white font-medium">
                {order.wilaya}, {order.baladiya} ({order.delivery_type === 'home' ? t('checkout.delivery_home') : t('checkout.delivery_desk')})
              </span>
            </div>
          </div>

          {/* Product details */}
          <div className="flex gap-3 text-brand-gray border-t border-brand-border pt-4 mt-2">
            <ShoppingBag className="w-4 h-4 text-brand-orange mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-brand-gray block">Produit / Product</span>
              <span className="text-white font-medium">
                {order.product_name} • {order.size} • {order.color}
              </span>
            </div>
          </div>

          {/* Total Paid */}
          <div className="flex justify-between items-center border-t border-brand-border pt-4 mt-2 text-white">
            <span className="font-bold">{t('confirmed.total_paid')}</span>
            <span className="font-heading font-extrabold text-xl text-brand-orange">
              {order.total_price.toLocaleString()} DZD
            </span>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        
        {/* WhatsApp Contact */}
        <a
          href={getWhatsAppMessage()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-heading font-bold rounded-xl transition-all hover:scale-[1.01] cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          <span>{t('confirmed.whatsapp_cta')}</span>
        </a>

        {/* Back to Catalog */}
        <Link
          to="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-card border border-brand-border hover:border-brand-orange text-white font-heading font-semibold rounded-xl transition-all cursor-pointer"
        >
          <span>Continuer vos achats</span>
          <ArrowRight className="w-4 h-4 text-brand-orange" />
        </Link>
      </div>
    </div>
  );
};
