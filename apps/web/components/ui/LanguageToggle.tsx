'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n, t } = useTranslation('common');
  const current = (i18n.language as 'ar' | 'en') || 'ar';
  const next = current === 'ar' ? 'en' : 'ar';

  const handleToggle = useCallback(async () => {
    await i18n.changeLanguage(next);
  }, [i18n, next]);

  const label = next === 'ar' ? t('language.toggleToArabic') : t('language.toggleToEnglish');

  return (
    <button type="button" onClick={handleToggle} className="glass px-3 py-2 text-sm font-medium">
      {label}
    </button>
  );
}
