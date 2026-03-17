import { useState, useEffect } from 'react';

const KEY = 'app-lang';
const LANGS = ['en', 'ru', 'tk'];
const LABELS = { en: 'EN', ru: 'RU', tk: 'TK' };

export function useLang() {
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) || 'en');

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem(KEY, lang);
  }, [lang]);

  const cycleLang = () => setLang(l => LANGS[(LANGS.indexOf(l) + 1) % LANGS.length]);
  return { lang, cycleLang, setLang, label: LABELS[lang] || lang.toUpperCase() };
}
