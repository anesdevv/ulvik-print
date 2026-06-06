import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { Product } from '../lib/api';
import { ColorSwatch } from '../components/ColorSwatch';
import { SizeSelector } from '../components/SizeSelector';
import { WHATSAPP_NUMBER } from '../config';
import { Loader2, ArrowLeft, Send, ShoppingBag } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ label: string; hex: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const [timeLeft, setTimeLeft] = useState(getRemainingTime());

  useEffect(() => {
    if (!product || !product.discount_price) return;
    const timer = setInterval(() => {
      setTimeLeft(getRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await api.products.get(id);
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        } else {
          setSelectedImage('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-brand-gray text-sm">Chargement du produit...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6">
          {error || 'Produit introuvable'}
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-card border border-brand-border rounded-xl text-white font-medium hover:border-brand-orange transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('product.back_to_catalog')}</span>
        </Link>
      </div>
    );
  }

  const name = currentLang === 'en' ? product.name_en : product.name_fr;
  const description = currentLang === 'en' ? product.description_en : product.description_fr;
  const images = product.images && product.images.length > 0
    ? product.images.slice(0, 3) // maximum 3 images
    : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop'];

  const handleOrder = () => {
    if (!product.in_stock) return;

    if (!selectedSize || !selectedColor) {
      setValidationError(t('checkout.error_fields'));
      return;
    }

    setValidationError(null);
    navigate('/checkout', {
      state: {
        product,
        selectedSize,
        selectedColor,
      },
    });
  };

  const getWhatsAppPersonalizeLink = () => {
    const encodedText = encodeURIComponent(
      `${t('product.personalize_whatsapp_message')} (Produit: ${name})`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 md:px-8">
      
      {/* Back Button */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-orange text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('product.back_to_catalog')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Product Images Column */}
        <div className="flex flex-col gap-4">
          {/* Main Large Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-900 border border-brand-border flex items-center justify-center">
            <img
              src={selectedImage}
              alt={name}
              className="h-full w-full object-cover object-center"
            />
            
            {!product.in_stock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                <span className="bg-red-600 text-white font-heading font-semibold text-sm tracking-wider uppercase px-5 py-2.5 rounded-full border border-red-500/30">
                  {t('home.out_of_stock')}
                </span>
              </div>
            )}
          </div>

          {/* Image Thumbnails (up to 3) */}
          {images.length > 1 && (
            <div className="flex gap-4">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 bg-neutral-900 transition-all cursor-pointer ${
                    selectedImage === imgUrl ? 'border-brand-orange scale-95' : 'border-brand-border hover:border-brand-gray'
                  }`}
                >
                  <img src={imgUrl} alt={`${name} thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="flex flex-col gap-6">
          <div>
            {product.category && (
              <span className="text-xs font-bold tracking-widest text-brand-orange uppercase mb-2 block">
                {product.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-3 leading-tight">
              {name}
            </h1>
            {product.discount_price ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-white">
                    {product.discount_price.toLocaleString()} <span className="text-brand-orange text-base font-semibold">{t('home.currency')}</span>
                  </span>
                  <span className="text-base text-brand-gray line-through font-semibold">
                    {product.price.toLocaleString()} {t('home.currency')}
                  </span>
                  <span className="bg-brand-orange/15 text-brand-orange font-extrabold text-xs px-2.5 py-1 rounded-lg border border-brand-orange/20 animate-pulse">
                    -{Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                  </span>
                </div>
                
                {/* Product Detail Timer */}
                <div className="mt-4 p-3.5 glassmorphic rounded-xl border border-brand-border flex items-center justify-between max-w-sm animate-pulse-glow">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-orange uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                    </span>
                    Offre Vente Flash
                  </div>
                  <div className="flex gap-1.5 items-center text-xs font-mono text-white font-bold">
                    <span className="px-2 py-0.5 bg-brand-dark/95 rounded border border-brand-border">{timeLeft.hours}</span>
                    <span className="text-brand-orange text-[10px]">:</span>
                    <span className="px-2 py-0.5 bg-brand-dark/95 rounded border border-brand-border">{timeLeft.minutes}</span>
                    <span className="text-brand-orange text-[10px]">:</span>
                    <span className="px-2 py-0.5 bg-brand-dark/95 rounded border border-brand-border text-brand-orange">{timeLeft.seconds}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white">
                {product.price.toLocaleString()} <span className="text-brand-orange text-sm font-semibold">{t('home.currency')}</span>
              </p>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="border-t border-brand-border pt-6">
              <h3 className="text-white font-heading font-semibold text-base mb-2">
                {t('product.description')}
              </h3>
              <p className="text-brand-gray text-sm leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Options Selectors */}
          {product.in_stock && (
            <div className="border-t border-brand-border pt-6 flex flex-col gap-6">
              {/* Sizes */}
              <SizeSelector
                sizes={product.sizes}
                selectedSize={selectedSize}
                onSelectSize={(size) => {
                  setSelectedSize(size);
                  setValidationError(null);
                }}
              />

              {/* Colors */}
              <ColorSwatch
                colors={product.colors}
                selectedColor={selectedColor}
                onSelectColor={(color) => {
                  setSelectedColor(color);
                  setValidationError(null);
                }}
              />
            </div>
          )}

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-medium mt-2">
              {validationError}
            </div>
          )}

          {/* Actions Block */}
          <div className="border-t border-brand-border pt-8 flex flex-col sm:flex-row gap-4 mt-2">
            {product.in_stock ? (
              <>
                {/* Order Button */}
                <button
                  onClick={handleOrder}
                  className="flex-grow flex items-center justify-center gap-2 px-6 py-4 bg-brand-orange hover:bg-brand-orange-hover text-white font-heading font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-brand-orange/15"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{t('product.order_now')}</span>
                </button>

                {/* Personalize Button */}
                <a
                  href={getWhatsAppPersonalizeLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow flex items-center justify-center gap-2 px-6 py-4 bg-brand-card border border-brand-border hover:border-brand-orange text-white font-heading font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  <Send className="w-4 h-4 text-brand-orange" />
                  <span>{t('product.personalize')}</span>
                </a>
              </>
            ) : (
              <div className="w-full p-4 text-center rounded-xl bg-neutral-900 border border-brand-border text-brand-gray text-sm font-semibold">
                {t('product.out_of_stock')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
