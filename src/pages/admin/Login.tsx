import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/admin');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || t('admin.login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-brand-card rounded-2xl border border-brand-border p-6 md:p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mt-2">
            {t('admin.login_title')}
          </h1>
          <p className="text-xs text-brand-gray">
            Accès réservé aux administrateurs du site.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-brand-gray">
              {t('admin.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ulvikprint.com"
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl pl-10 pr-4 py-3 text-white transition-all outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-brand-gray">
              {t('admin.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl pl-10 pr-4 py-3 text-white transition-all outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white font-heading font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Vérification...</span>
              </>
            ) : (
              <span>{t('admin.login_btn')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
