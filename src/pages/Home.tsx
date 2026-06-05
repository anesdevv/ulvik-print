import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { Product } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { Loader2, Sparkles, Filter } from 'lucide-react';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await api.products.list();
        setProducts(data);

        // Extract unique categories, filter out falsy/empty values
        const uniqueCategories = Array.from(
          new Set(data.map((p) => p.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-20 px-4 md:px-8 border-b border-brand-border">
        {/* Decorative ambient blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-orange/10 blur-[80px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-orange-600/5 blur-[60px] -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Algeria Custom Prints</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight text-white leading-tight">
            Wear Your Mind with <span className="text-brand-orange">Ulvik Print</span>
          </h1>
          
          <p className="text-brand-gray text-base md:text-lg max-w-xl leading-relaxed mt-2">
            {t('home.subtitle')}
          </p>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="max-w-7xl mx-auto w-full px-4 py-12 md:px-8">
        
        {/* Category Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-brand-border/50">
          <div className="flex items-center gap-2 text-white">
            <Filter className="w-4 h-4 text-brand-orange" />
            <span className="font-heading font-semibold text-lg">Catalog</span>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-card hover:bg-neutral-800 border border-brand-border text-gray-300'
              }`}
            >
              {t('home.all_categories')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer capitalize ${
                  selectedCategory === cat
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-card hover:bg-neutral-800 border border-brand-border text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
            <p className="text-brand-gray text-sm">Chargement du catalogue...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-4">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-card border border-brand-border text-white text-sm rounded-lg hover:border-brand-orange transition-colors cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-brand-gray border border-dashed border-brand-border rounded-2xl">
                <p>{t('home.no_products')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
