import React from 'react';
import { useTranslation } from 'react-i18next';
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from '../config';
import { MapPin, Clock, Instagram, MessageSquare, Compass, ShieldCheck } from 'lucide-react';

export const About: React.FC = () => {
  const { t } = useTranslation();
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 md:px-8">
      
      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6 text-center">
        {t('about.title')}
      </h1>
      
      <p className="text-brand-gray text-center text-sm md:text-base max-w-2xl mx-auto mb-16 leading-relaxed">
        Votre atelier d'impression textile de confiance en Algérie. Nous combinons créativité et qualité pour des t-shirts exceptionnels.
      </p>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
        
        {/* Text Details (Left 5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Brand Philosophy */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-6 md:p-8">
            <h2 className="text-white font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-orange" />
              <span>Notre mission</span>
            </h2>
            <p className="text-brand-gray text-sm leading-relaxed mb-4">
              {t('about.description_1')}
            </p>
            <p className="text-brand-gray text-sm leading-relaxed">
              {t('about.description_2')}
            </p>
          </div>

          {/* Address & Hours */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-6 md:p-8 flex flex-col gap-6">
            
            {/* Address */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-heading font-semibold text-sm mb-1">
                  {t('about.address_label')}
                </h3>
                <p className="text-brand-gray text-sm leading-relaxed">
                  {t('about.address_value')}
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-heading font-semibold text-sm mb-1">
                  {t('about.hours_label')}
                </h3>
                <p className="text-brand-gray text-sm leading-relaxed">
                  {t('about.hours_value')}
                </p>
              </div>
            </div>

            {/* Contact Social Links */}
            <div className="flex gap-4 border-t border-brand-border pt-6 mt-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-orange text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-brand-orange" />
                <span>Instagram</span>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Google Map Iframe (Right 7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-brand-card rounded-2xl border border-brand-border p-3 overflow-hidden shadow-xl aspect-[16/10] w-full">
            <iframe
              title="Ulvic Print Store Location"
              src="https://maps.google.com/maps?q=34.882157,-1.307842&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 border border-brand-border text-brand-gray text-[11px] max-w-fit mx-auto lg:mx-0">
            <ShieldCheck className="w-4 h-4 text-brand-orange flex-shrink-0" />
            <span>Retrouvez-nous facilement au centre-ville de Tlemcen.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
