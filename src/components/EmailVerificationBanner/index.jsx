import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl } from '../../config/api';
import { getAuthToken } from '../../contexts/AuthContext';

const styles = {
  banner: {
    backgroundColor: '#fef3c7',
    borderBottom: '2px solid #f59e0b',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    flexWrap: 'wrap',
  },
  text: {
    margin: 0,
    color: '#92400e',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: '#d97706',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#92400e',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '0 8px',
    marginLeft: '8px',
  },
  success: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
};

const EmailVerificationBanner = () => {
  const { isAuthenticated, emailVerified, user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if user is not authenticated, email is verified, or banner is dismissed
  if (!isAuthenticated || emailVerified || isDismissed) {
    return null;
  }

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
        setMessage('Verification email sent! Check your inbox.');
      } else {
        setMessage(data.error || 'Failed to send verification email. Please try again.');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setMessage('Network error. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={styles.banner}>
      <p style={styles.text}>
        Please verify your email address to access all features.
      </p>

      <button
        onClick={handleResendVerification}
        disabled={isSending}
        style={{
          ...styles.button,
          ...(isSending ? styles.buttonDisabled : {}),
        }}
        onMouseOver={(e) => !isSending && (e.target.style.backgroundColor = '#d97706')}
        onMouseOut={(e) => !isSending && (e.target.style.backgroundColor = '#f59e0b')}
      >
        {isSending ? 'Sending...' : 'Resend Verification Email'}
      </button>

      {message && (
        <div style={message.includes('sent') ? styles.success : styles.error}>
          {message}
        </div>
      )}

      <button
        onClick={() => setIsDismissed(true)}
        style={styles.closeButton}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default EmailVerificationBanner;
