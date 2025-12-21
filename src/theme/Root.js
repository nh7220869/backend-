import React, { useRef, useState, useEffect } from 'react';
import Chatbot from '@site/src/components/Chatbot';
import TextSelectionPopup from '@site/src/components/TextSelectionPopup';
import TranslationModal from '@site/src/components/TranslationModal';
import PageTranslator from '@site/src/components/PageTranslator';
import ErrorBoundary from '@site/src/components/ErrorBoundary';
import SessionDebug from '@site/src/components/SessionDebug';
import { AuthProvider } from '@site/src/contexts/AuthContext';
import { TranslationProvider } from '@site/src/contexts/TranslationContext';
import LoadingScreen from '@site/src/components/LoadingScreen';
import { useApiConfig } from '@site/src/config/api';

// Default implementation, that you can customize
function Root({ children }) {
  const chatbotRef = useRef(null);
  const apiConfig = useApiConfig();
  const [translationModal, setTranslationModal] = useState({
    isOpen: false,
    originalText: '',
    translatedText: '',
    isLoading: false,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loader for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Handle "Ask AI" button click
  const handleAskAI = (selectedText) => {
    if (chatbotRef.current && selectedText) {
      chatbotRef.current.sendMessage(selectedText);
    }
  };

  // Handle "Translate to Urdu" button click
  const handleTranslate = async (selectedText) => {
    if (!selectedText || selectedText.trim() === '') return;

    // Open modal and show loading state
    setTranslationModal({
      isOpen: true,
      originalText: selectedText,
      translatedText: '',
      isLoading: true,
      error: null,
    });

    try {
      // Call Gemini translation backend
      const response = await fetch(apiConfig.ENDPOINTS.TRANSLATE_GEMINI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: selectedText,
          targetLanguage: 'Urdu',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Translation failed');
      }

      const data = await response.json();

      if (data.success && data.translatedText) {
        setTranslationModal({
          isOpen: true,
          originalText: selectedText,
          translatedText: data.translatedText,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Invalid response from translation service');
      }
    } catch (error) {
      console.error('Translation error:', error);
      const errorMessage = error.message?.includes('fetch') || error.name === 'TypeError'
        ? 'Cannot connect to backend server. Please ensure the central backend is running on port 3000.'
        : (error.message || 'Sorry, there was an issue with the API. Please try again later.');
      setTranslationModal({
        isOpen: true,
        originalText: selectedText,
        translatedText: '',
        isLoading: false,
        error: errorMessage,
      });
    }
  };

  // Handle modal close
  const handleCloseTranslationModal = () => {
    setTranslationModal({
      isOpen: false,
      originalText: '',
      translatedText: '',
      isLoading: false,
      error: null,
    });
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <TranslationProvider>
          {isLoading && <LoadingScreen />}
          <div style={{ display: isLoading ? 'none' : 'block' }}>
            {children}
          </div>
          <PageTranslator />
          <TextSelectionPopup onAskAI={handleAskAI} onTranslate={handleTranslate} />
          <TranslationModal
            isOpen={translationModal.isOpen}
            onClose={handleCloseTranslationModal}
            originalText={translationModal.originalText}
            translatedText={translationModal.translatedText}
            isLoading={translationModal.isLoading}
            error={translationModal.error}
          />
          <Chatbot ref={chatbotRef} />
          <SessionDebug />
        </TranslationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default Root;
