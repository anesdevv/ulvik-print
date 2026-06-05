import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Shirt, Globe, Menu, X, LogOut, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-brand-orange' : 'text-gray-300 hover:text-white';
  };

  return (
    <nav className="sticky top-0 z-50 glassmorphic border-b border-brand-border px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-heading font-bold text-xl tracking-wider hover:opacity-90">
          <Shirt className="h-6 w-6 text-brand-orange animate-pulse" />
          <span>ULVIC<span className="text-brand-orange text-xs uppercase tracking-widest ml-1 font-sans">Print</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link to="/" className={`transition-colors ${isActive('/')}`}>
            {t('nav.home')}
          </Link>
          <Link to="/about" className={`transition-colors ${isActive('/about')}`}>
            {t('nav.about')}
          </Link>
          
          {/* Admin routes if logged in */}
          {isAuthenticated && (
            <div className="flex items-center gap-6 border-l border-brand-border pl-6">
              <Link to="/admin" className={`transition-colors flex items-center gap-1.5 ${isActive('/admin')}`}>
                <Settings className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
              <Link to="/admin/products" className={`transition-colors ${isActive('/admin/products')}`}>
                {t('admin.products_title')}
              </Link>
              <Link to="/admin/orders" className={`transition-colors ${isActive('/admin/orders')}`}>
                {t('admin.orders_title')}
              </Link>
              <Link to="/admin/delivery" className={`transition-colors ${isActive('/admin/delivery')}`}>
                {t('admin.delivery_title')}
              </Link>
            </div>
          )}
        </div>

        {/* Global Controls (Language & Auth) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Selector Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand-orange text-gray-300 hover:text-white transition-all text-sm font-medium cursor-pointer"
          >
            <Globe className="w-4 h-4 text-brand-orange" />
            <span>{i18n.language === 'fr' ? 'EN' : 'FR'}</span>
          </button>

          {/* Admin Logout (only shown if logged in) */}
          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all text-sm cursor-pointer font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-brand-border text-gray-300 text-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-brand-orange" />
            <span>{i18n.language === 'fr' ? 'EN' : 'FR'}</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white hover:text-brand-orange transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-brand-border flex flex-col gap-4 pb-2 animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`transition-colors py-1 ${isActive('/')}`}
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className={`transition-colors py-1 ${isActive('/about')}`}
          >
            {t('nav.about')}
          </Link>

          {isAuthenticated && (
            <div className="border-t border-brand-border pt-4 mt-2 flex flex-col gap-3">
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`transition-colors py-1 flex items-center gap-2 ${isActive('/admin')}`}
              >
                <Settings className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/admin/products"
                onClick={() => setMobileOpen(false)}
                className={`transition-colors py-1 ${isActive('/admin/products')}`}
              >
                {t('admin.products_title')}
              </Link>
              <Link
                to="/admin/orders"
                onClick={() => setMobileOpen(false)}
                className={`transition-colors py-1 ${isActive('/admin/orders')}`}
              >
                {t('admin.orders_title')}
              </Link>
              <Link
                to="/admin/delivery"
                onClick={() => setMobileOpen(false)}
                className={`transition-colors py-1 ${isActive('/admin/delivery')}`}
              >
                {t('admin.delivery_title')}
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center gap-2 py-2 mt-2 rounded-lg bg-red-950/40 border border-red-900/30 text-red-400 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
