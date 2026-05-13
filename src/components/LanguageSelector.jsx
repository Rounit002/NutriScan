import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
];

export default function LanguageSelector({ className = '' }) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <label className={`language-selector ${className}`.trim()}>
      <span>{t('select_language')}</span>
      <select value={i18n.resolvedLanguage || i18n.language || 'en'} onChange={handleLanguageChange}>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
