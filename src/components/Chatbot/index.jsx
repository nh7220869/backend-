import clsx from 'clsx';
import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApiConfig } from '../../config/api';
import { authPostJson } from '../../utils/authFetch';


const Chatbot = forwardRef((props, ref) => {
  const {siteConfig} = useDocusaurusContext();
  const { isAuthenticated, user } = useAuth();
  const apiConfig = useApiConfig();
  const RAG_API_URL = apiConfig.ENDPOINTS.CHAT;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Expose method to send message from external components
  useImperativeHandle(ref, () => ({
    sendMessage: (text) => {
      // Block chatbot access for non-authenticated users
      if (!isAuthenticated) {
        setIsOpen(true);
        setMessages([{
          text: 'Please sign in to use the chatbot. Create an account or log in to access AI-powered assistance.',
          sender: 'bot'
        }]);
        return;
      }

      if (text && text.trim() !== '') {
        // Create a detailed prompt for better responses
        const prompt = `Please provide a complete and detailed explanation of the following text from the Physical AI & Humanoid Robotics textbook. Explain all concepts thoroughly, including technical terms, and provide examples where applicable.

Selected text:
"${text}"

Please give a comprehensive explanation, not just a brief definition.`;

        setInput(prompt);
        setIsOpen(true);
        // Auto-send after a brief delay to allow the UI to update
        setTimeout(() => {
          handleSendMessageWithText(prompt);
        }, 100);
      }
    },
  }));

  // Helper function to send message with custom text
  const handleSendMessageWithText = useCallback(async (messageText) => {
    if (!messageText || messageText.trim() === '') return;

    // Block chatbot access for non-authenticated users
    if (!isAuthenticated) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Please sign in to use the chatbot. Create an account or log in to access AI-powered assistance.', sender: 'bot' }
      ]);
      return;
    }

    const userMessage = { text: messageText, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use authenticated fetch with JWT token
      const data = await authPostJson(RAG_API_URL, {
        question: messageText,
        selected_text: null
      });

      const botMessage = { text: data.answer, sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message to RAG API:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Sorry, I could not get a response. Please try again later.', sender: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [RAG_API_URL, isAuthenticated]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '') return;
    await handleSendMessageWithText(input);
  }, [input, handleSendMessageWithText]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <div className="chatbot-container">
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Book Assistant</h3>
          </div>
          <div className="chatbot-messages">
            {messages.length === 0 && !isLoading && (
              <div className="chatbot-welcome-message">
                {isAuthenticated
                  ? `Hi ${user?.name || 'there'}! Ask me anything about the "Physical AI & Humanoid Robotics" textbook.`
                  : 'Please sign in to use the chatbot. Create an account or log in to access AI-powered assistance.'
                }
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={clsx('chatbot-message', `chatbot-message--${msg.sender}`)}>
                {msg.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message chatbot-message--bot">
                <div className="chatbot-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input-container">
            <input
              type="text"
              className="chatbot-input"
              placeholder={isAuthenticated ? "Ask a question..." : "Sign in to chat..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !isAuthenticated}
            />
            <button
              className="chatbot-send-button"
              onClick={handleSendMessage}
              disabled={isLoading || !isAuthenticated}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

Chatbot.displayName = 'Chatbot';

export default Chatbot;
