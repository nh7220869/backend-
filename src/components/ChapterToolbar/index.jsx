import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiConfig } from '../../config/api';
import { authPostJson } from '../../utils/authFetch';
// import './ChapterToolbar.css';


const ChapterToolbar = ({ chapterContent, chapterTitle }) => {
  const { user, isAuthenticated } = useAuth();
  const apiConfig = useApiConfig();
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [personalizedContent, setPersonalizedContent] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showPersonalizeModal || showTranslateModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showPersonalizeModal, showTranslateModal]);

  const getPageContent = () => {
    if (chapterContent) return chapterContent;
    const article = document.querySelector('article');
    return article ? article.innerText : '';
  };

  const handlePersonalize = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to personalize content');
      return;
    }

    setShowPersonalizeModal(true);
    setIsPersonalizing(true);
    setError('');
    setPersonalizedContent('');

    const content = getPageContent();
    if (!content) {
      setError('No content found to personalize');
      setIsPersonalizing(false);
      return;
    }

    try {
      // Use authenticated fetch with JWT token
      const data = await authPostJson(apiConfig.ENDPOINTS.PERSONALIZE, {
        content: content.substring(0, 8000),
        userBackground: {
          softwareBackground: user?.softwareBackground || '',
          hardwareBackground: user?.hardwareBackground || '',
          experienceLevel: user?.experienceLevel || 'beginner',
        },
      });

      if (data.success === false) {
        setError(data.message || 'Personalization failed.');
        return;
      }

      setPersonalizedContent(data.personalizedContent || data.content);
    } catch (err) {
      console.error('Personalization error:', err);
      if (err.message?.includes('404')) {
        setError('Personalization service not found. Please ensure the backend is running.');
      } else if (err instanceof TypeError || err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('Cannot connect to backend server. Please ensure the central backend is running on port 3000.');
      } else if (err instanceof SyntaxError) {
        setError('Invalid response from server. The backend may not be running correctly.');
      } else {
        setError(err.message || 'Failed to personalize content. Please try again.');
      }
    } finally {
      setIsPersonalizing(false);
    }
  };

  const handleTranslate = async () => {
    setShowTranslateModal(true);
    setIsTranslating(true);
    setError('');
    setTranslatedContent('');

    const content = getPageContent();
    if (!content) {
      setError('No content found to translate');
      setIsTranslating(false);
      return;
    }

    try {
      // Use authenticated fetch with JWT token
      const data = await authPostJson(apiConfig.ENDPOINTS.TRANSLATE_GEMINI, {
        text: content.substring(0, 8000),
        targetLanguage: 'Urdu',
      });

      if (data.success && data.translatedText) {
        setTranslatedContent(data.translatedText);
      } else {
        setError(data.message || 'Invalid response from translation service');
      }
    } catch (err) {
      console.error('Translation error:', err);
      if (err.message?.includes('404')) {
        setError('Translation service not found. Please ensure the backend is running.');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to backend server. Please check if the central backend is running on port 3000.');
      } else {
        setError(err.message || 'Failed to translate content. Please try again.');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const closeModal = () => {
    setShowPersonalizeModal(false);
    setShowTranslateModal(false);
    setError('');
  };

  return (
    <>
      <div className="chapter-toolbar">
        <button
          className={`toolbar-btn personalize-btn ${isAuthenticated ? '' : 'disabled'}`}
          onClick={handlePersonalize}
          disabled={!isAuthenticated}
          title={isAuthenticated ? 'Personalize content based on your background' : 'Sign in to personalize content'}
        >
          <span className="btn-icon">✨</span>
          <span className="btn-text">Personalize Content</span>
          <span className="btn-sparkle"></span>
        </button>

        <button
          className="toolbar-btn translate-btn"
          onClick={handleTranslate}
        >
          <span className="btn-icon">🌐</span>
          <span className="btn-text">Translate to Urdu</span>
          <span className="btn-wave"></span>
        </button>
      </div>

      {/* Personalize Modal */}
      {showPersonalizeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-icon">✨</span>
                Personalized Content
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <span>×</span>
              </button>
            </div>

            {user && (
              <div className="user-info-card">
                <div className="info-item">
                  <span className="info-label">Experience Level:</span>
                  <span className="info-value">
                    {user.experienceLevel?.charAt(0).toUpperCase() + user.experienceLevel?.slice(1) || 'Not specified'}
                  </span>
                </div>
                {user.softwareBackground && (
                  <div className="info-item">
                    <span className="info-label">Software Background:</span>
                    <span className="info-value">{user.softwareBackground}</span>
                  </div>
                )}
                {user.hardwareBackground && (
                  <div className="info-item">
                    <span className="info-label">Hardware Background:</span>
                    <span className="info-value">{user.hardwareBackground}</span>
                  </div>
                )}
              </div>
            )}

            {error && <div className="error-message shake">{error}</div>}

            {isPersonalizing ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Personalizing content for your background...</span>
              </div>
            ) : personalizedContent ? (
              <div className="content-display personalized-content">
                {personalizedContent}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Translate Modal */}
      {showTranslateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-icon">🌐</span>
                Urdu Translation
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <span>×</span>
              </button>
            </div>

            {error && <div className="error-message shake">{error}</div>}

            {isTranslating ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Translating to Urdu...</span>
              </div>
            ) : translatedContent ? (
              <div className="content-display urdu-content">
                {translatedContent}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default ChapterToolbar;