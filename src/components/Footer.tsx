import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WHATSAPP_NUMBER, INSTAGRAM_URL } from '../config';
import { Instagram, MessageSquare, Shirt } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <footer className="bg-brand-dark border-t border-brand-border mt-auto pt-12 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
        {/* Brand Info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-lg tracking-wider">
            <Shirt className="h-5 w-5 text-brand-orange" />
            <span>ULVIK<span className="text-brand-orange text-xs uppercase tracking-widest ml-1 font-sans">Print</span></span>
          </div>
          <p className="text-brand-gray text-sm max-w-xs leading-relaxed">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-heading font-semibold text-sm uppercase tracking-wider">
            Navigation
          </h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/" className="text-brand-gray hover:text-brand-orange transition-colors w-fit">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="text-brand-gray hover:text-brand-orange transition-colors w-fit">
              {t('nav.about')}
            </Link>
          </div>
        </div>

        {/* Contact & Socials */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-heading font-semibold text-sm uppercase tracking-wider">
            Contact & Socials
          </h4>
          <div className="flex items-center gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-card hover:bg-brand-orange hover:text-white border border-brand-border text-brand-gray transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-card hover:bg-brand-orange hover:text-white border border-brand-border text-brand-gray transition-all"
              aria-label="WhatsApp"
            >
              <MessageSquare className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs text-brand-gray">
            Algérie • Service Cash on Delivery
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-brand-border text-center text-xs text-brand-gray">
        <p>&copy; {currentYear} Ulvik Print. All rights reserved.</p>
      </div>
    </footer>
  );
};
