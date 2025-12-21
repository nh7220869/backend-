import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import openRouterRateLimiter from '@site/src/utils/rateLimiter';
import { API_CONFIG } from '@site/src/config/api';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Language mapping
const LANGUAGE_MAP = {
  en: { name: 'English', native: 'English', code: 'en' },
  ur: { name: 'Urdu', native: 'اردو', code: 'ur' },
  es: { name: 'Spanish', native: 'Español', code: 'es' },
};

export const TranslationProvider = ({ children }) => {
  const location = useLocation();

  // Initialize language from localStorage or default to 'en'
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedLanguage') || 'en';
    }
    return 'en';
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  const [pageTranslations, setPageTranslations] = useState(null);
  const [originalContent, setOriginalContent] = useState({});

  // Function to change language
  const setLanguage = (langCode) => {
    setCurrentLanguageState(langCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', langCode);
    }
  };

  // Trigger translation when language changes
  useEffect(() => {
    if (currentLanguage !== 'en') {
      // Small delay to let page render
      const timer = setTimeout(() => {
        translatePage(currentLanguage);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Restore to English
      translatePage('en');
    }
  }, [currentLanguage, location.pathname]);

  // Clear translations when page changes
  useEffect(() => {
    setPageTranslations(null);
  }, [location.pathname]);

  // Translate text using OpenRouter API with rate limiting and retry
  const translateText = async (text, targetLang, retries = 3) => {
    if (!text || text.trim() === '') return text;

    // Check cache first
    const cacheKey = `${targetLang}:${text.substring(0, 100)}`;
    if (translationCache[cacheKey]) {
      console.log('Using cached translation');
      return translationCache[cacheKey];
    }

    // Wait for rate limiter slot
    await openRouterRateLimiter.waitForSlot();

    try {
      const languageInfo = LANGUAGE_MAP[targetLang] || LANGUAGE_MAP.en;
      const targetLanguageName = languageInfo.native || languageInfo.name;

      console.log(`Translating: "${text.substring(0, 50)}..." to ${targetLanguageName}`);

      const response = await fetch(API_CONFIG.ENDPOINTS.TRANSLATE_GEMINI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: text,
          targetLanguage: targetLanguageName,
        }),
      });

      const data = await response.json();

      // Handle quota exceeded error
      if (!response.ok) {
        if (data.error && data.error.includes('Quota exceeded')) {
          if (retries > 0) {
            console.warn(`Quota exceeded, retrying in 16 seconds... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 16000));
            return translateText(text, targetLang, retries - 1);
          } else {
            console.error('Max retries reached for quota');
            return text;
          }
        }
        throw new Error(data.details || data.error || 'Translation failed');
      }

      if (data.success && data.translatedText) {
        // Cache the translation
        setTranslationCache(prev => ({
          ...prev,
          [cacheKey]: data.translatedText,
        }));
        console.log('Translation successful');
        return data.translatedText;
      }

      return text;
    } catch (error) {
      console.error('Translation error:', error.message);
      if (retries > 0) {
        console.log(`Retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return translateText(text, targetLang, retries - 1);
      }
      return text;
    }
  };

  // Translate entire page content
  const translatePage = async (targetLang) => {
    if (targetLang === 'en') {
      // Restore original English content
      const articleElement = document.querySelector('article');
      if (articleElement && originalContent[location.pathname]) {
        const savedContent = originalContent[location.pathname];
        savedContent.forEach(({ node, text }) => {
          if (node && node.parentElement) {
            node.textContent = text;
          }
        });
      }
      setPageTranslations(null);
      setIsTranslating(false);
      setTimeout(() => window.scrollTo(0, 0), 100);
      return;
    }

    setIsTranslating(true);

    try {
      // Find the main content area
      const articleElement = document.querySelector('article');
      if (!articleElement) {
        console.warn('No article element found');
        setIsTranslating(false);
        return;
      }

      // Extract all text nodes that need translation
      const elementsToTranslate = [];
      const walker = document.createTreeWalker(
        articleElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip empty nodes and code blocks
            if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
            if (node.parentElement.tagName === 'CODE' ||
                node.parentElement.tagName === 'PRE') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let currentNode;
      const originalNodes = [];
      while ((currentNode = walker.nextNode())) {
        const originalText = currentNode.textContent;
        elementsToTranslate.push({
          node: currentNode,
          originalText: originalText,
        });
        originalNodes.push({
          node: currentNode,
          text: originalText,
        });
      }

      // Save original content for this page
      setOriginalContent(prev => ({
        ...prev,
        [location.pathname]: originalNodes,
      }));

      // Translate in batches - OpenRouter has much higher limits
      const translations = {};
      const batchSize = 10;

      console.log(`Total text segments to translate: ${elementsToTranslate.length}`);

      for (let i = 0; i < elementsToTranslate.length; i += batchSize) {
        const batch = elementsToTranslate.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / elementsToTranslate.length) * 100);

        console.log(`Translating batch ${Math.floor(i / batchSize) + 1} (${progress}% complete)`);

        // Translate batch sequentially to avoid overwhelming API
        for (const { node, originalText } of batch) {
          try {
            const translated = await translateText(originalText, targetLang);
            translations[originalText] = translated;

            // Apply translation immediately
            if (translated && node && node.parentElement) {
              node.textContent = translated;
            }
          } catch (error) {
            console.error(`Failed to translate: "${originalText.substring(0, 50)}..."`, error);
          }
        }
      }

      console.log('Page translation complete!');

      setPageTranslations(translations);
      setIsTranslating(false);
    } catch (error) {
      console.error('Page translation error:', error);
      setIsTranslating(false);
    }
  };

  const value = {
    currentLanguage,
    setLanguage,
    isTranslating,
    translateText,
    translatePage,
    pageTranslations,
    languageInfo: LANGUAGE_MAP[currentLanguage] || LANGUAGE_MAP.en,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
