import React, { useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl } from '../../config/api';
import { getAuthToken } from '../../contexts/AuthContext';

/**
 * ProtectedContent - Wraps content that requires authentication and email verification
 * Shows a login prompt overlay if user is not authenticated
 * Shows verification prompt if user is authenticated but email is not verified
 */
const ProtectedContent = ({ children }) => {
  const { isAuthenticated, emailVerified, user, loading } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { siteConfig } = useDocusaurusContext();
  const baseUrl = siteConfig.baseUrl || '/';
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignup = () => {
    const currentPath = location.pathname;
    history.push(`${baseUrl}signup?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleLogin = () => {
    const currentPath = location.pathname;
    history.push(`${baseUrl}login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleResendVerification = async () => {
    setIsSending(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const response = await fetch(`${getApiBaseUrl()}/api/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent successfully! Check your inbox.');
      } else {
        setMessage(data.error || 'Failed to send verification email.');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setMessage('Network error. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated and email verified, show the content
  if (isAuthenticated && emailVerified) {
    return <>{children}</>;
  }

  // If authenticated but email not verified, show verification prompt
  if (isAuthenticated && !emailVerified) {
    return (
      <div style={{ position: 'relative', minHeight: '60vh' }}>
        {/* Blurred preview of content */}
        <div style={{ filter: 'blur(8px)', pointerEvents: 'none', opacity: 0.3 }}>
          {children}
        </div>

        {/* Email verification prompt overlay */}
        <div className="protected-content-overlay">
          <div className="protected-content-container">
            <div className="protected-content-icon">&#128231;</div>
            <h2 className="protected-content-title">Verify Your Email</h2>
            <p className="protected-content-description">
              Please verify your email address to access the content. We've sent a verification
              email to <strong>{user?.email}</strong>.
            </p>
            <p className="protected-content-description">
              Check your inbox and click the verification link to continue.
            </p>
            {message && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  backgroundColor: message.includes('sent') ? '#dcfce7' : '#fee2e2',
                  color: message.includes('sent') ? '#16a34a' : '#dc2626',
                  border: message.includes('sent') ? '1px solid #bbf7d0' : '1px solid #fecaca',
                }}
              >
                {message}
              </div>
            )}
            <div className="protected-content-button-group">
              <button
                className="protected-content-primary-button"
                onClick={handleResendVerification}
                disabled={isSending}
                style={isSending ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {isSending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt overlay
  return (
    <div style={{ position: 'relative', minHeight: '60vh' }}>
      {/* Blurred preview of content */}
      <div style={{ filter: 'blur(8px)', pointerEvents: 'none', opacity: 0.3 }}>
        {children}
      </div>

      {/* Login prompt overlay */}
      <div className="protected-content-overlay">
        <div className="protected-content-container">
          <div className="protected-content-icon">🔒</div>
          <h2 className="protected-content-title">Sign in to Access Content</h2>
          <p className="protected-content-description">
            Create a free account to read the complete book on Physical AI & Humanoid Robotics.
            We'll personalize your learning experience based on your background.
          </p>
          <div className="protected-content-button-group">
            <button className="protected-content-primary-button" onClick={handleSignup}>
              Create Free Account
            </button>
            <button className="protected-content-secondary-button" onClick={handleLogin}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedContent;
