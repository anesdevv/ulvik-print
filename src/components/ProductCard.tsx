import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '../lib/api';
import { Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const name = currentLang === 'en' ? product.name_en : product.name_fr;
  const imageUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop';

  // Countdown timer logic
  const getRemainingTime = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // next midnight
    const diff = midnight.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const [timeLeft, setTimeLeft] = React.useState(getRemainingTime());

  React.useEffect(() => {
    if (!product.discount_price) return;
    const timer = setInterval(() => {
      setTimeLeft(getRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [product.discount_price]);

  return (
    <div className="group relative bg-brand-card rounded-2xl border border-brand-border hover:border-brand-orange/40 transition-all duration-300 overflow-hidden flex flex-col glow-hover">
      
      {/* Product Image Wrapper */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-900 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Promo Discount Badge */}
        {product.in_stock && product.discount_price && (
          <div className="absolute top-3 left-3 bg-brand-orange text-white font-heading font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-lg border border-brand-orange/30 shadow-lg z-10 animate-pulse">
            -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
          </div>
        )}

        {/* Timer Bar */}
        {product.in_stock && product.discount_price && (
          <div className="absolute bottom-3 left-3 right-3 bg-brand-dark/85 backdrop-blur-md border border-brand-border rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-sans text-brand-gray z-10">
            <span className="flex items-center gap-1 text-brand-orange font-bold uppercase tracking-wider text-[8px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-orange"></span>
              </span>
              Vente Flash
            </span>
            <span className="font-mono text-white font-semibold">
              {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
            </span>
          </div>
        )}

        {/* Out of stock overlay/badge */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-red-600 text-white font-heading font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-full border border-red-500/30">
              {t('home.out_of_stock')}
            </span>
          </div>
        )}

        {/* Hover overlay with detail eye button */}
        {product.in_stock && (
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Link
              to={`/product/${product.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-orange hover:text-white"
            >
              <Eye className="w-4 h-4" />
              <span>{t('home.view_product')}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          {product.category && (
            <span className="text-[10px] font-bold tracking-widest text-brand-orange uppercase mb-1.5 block">
              {product.category}
            </span>
          )}
          <h3 className="text-white font-heading font-medium text-base line-clamp-1 group-hover:text-brand-orange transition-colors">
            {name}
          </h3>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
          {product.discount_price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold text-lg">
                {product.discount_price.toLocaleString()} <span className="text-brand-orange text-xs font-semibold">{t('home.currency')}</span>
              </span>
              <span className="text-brand-gray line-through text-xs font-medium">
                {product.price.toLocaleString()} {t('home.currency')}
              </span>
            </div>
          ) : (
            <span className="text-white font-bold text-lg">
              {product.price.toLocaleString()} <span className="text-brand-orange text-xs font-semibold">{t('home.currency')}</span>
            </span>
          )}
          
          {product.in_stock && (
            <Link
              to={`/product/${product.id}`}
              className="text-xs text-brand-orange font-bold uppercase tracking-wider hover:text-white transition-colors md:hidden"
            >
              {t('home.view_product')} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
