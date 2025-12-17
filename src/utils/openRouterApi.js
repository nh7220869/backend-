import axios from 'axios';
import config from '../config/index.js';

const openrouterConfig = config.openRouter;

// ===== RATE LIMITER =====
// OpenRouter: Much more generous limits (200 req/min for free models)
// We use 50 req/min to be conservative, or whatever the env variable specifies
const rateLimiter = {
  requests: [],
  maxRequests: 50, // Default conservative
  timeWindow: 60000, // 60 seconds

  init: (maxRequests) => {
    if (maxRequests) {
      rateLimiter.maxRequests = maxRequests;
    }
  },

  async checkLimit() {
    const now = Date.now();

    // Remove old requests (older than `timeWindow`)
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    // Check if under limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    // Calculate wait time
    const oldestRequest = this.requests[0];
    const waitTime = this.timeWindow - (now - oldestRequest) + 1000;

    console.log(`Rate limit: ${this.requests.length}/${this.maxRequests} requests. Waiting ${Math.ceil(waitTime/1000)}s...`);

    // Wait for the required time
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Remove the oldest request and add new one
    this.requests.shift();
    this.requests.push(Date.now());
    return true;
  },

  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.maxRequests - this.requests.length;
  }
};

// Initialize rate limiter with a configurable max if desired
// (For now, keeping it at 50, but can be updated via config)
rateLimiter.init(process.env.OPENROUTER_RATE_LIMIT_PER_MINUTE ? parseInt(process.env.OPENROUTER_RATE_LIMIT_PER_MINUTE) : 50);

const callOpenRouterCompletion = async (messages, model = openrouterConfig.chatModel, temperature = 0.7, maxTokens = 1024, httpReferer = 'https://physical-ai-humanoid-robotics-book-claude.app/', xTitle = 'Physical AI Book API') => {
  if (!openrouterConfig.apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  await rateLimiter.checkLimit();
  console.log(`OpenRouter API: ${rateLimiter.getRemainingRequests()}/${rateLimiter.maxRequests} requests remaining`);

  try {
    const response = await axios.post(
      `${openrouterConfig.baseUrl}/chat/completions`,
      {
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${openrouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': httpReferer,
          'X-Title': xTitle
        },
        timeout: 30000
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      console.error('Unexpected response format from OpenRouter API:', JSON.stringify(response.data, null, 2));
      throw new Error('Unexpected response format from OpenRouter API');
    }
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    if (error.response) {
      const errorMessage = error.response.data?.error?.message || 'Unknown API error';
      if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
        const quotaError = new Error('OpenRouter API rate limit reached. Please wait a moment and try again.');
        quotaError.status = 429;
        throw quotaError;
      }
      const apiError = new Error(`OpenRouter API error: ${errorMessage}`);
      apiError.status = error.response.status || 500;
      throw apiError;
    } else if (error.request) {
      const noResponseError = new Error('No response from OpenRouter API. Please check your internet connection.');
      noResponseError.status = 503;
      throw noResponseError;
    } else {
      throw new Error(`Failed to call OpenRouter API: ${error.message}`);
    }
  }
};

const callOpenRouterEmbeddings = async (text, model = openrouterConfig.embeddingModel) => {
  if (!openrouterConfig.apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }
  if (!model) {
    throw new Error('OPENROUTER_EMBEDDING_MODEL is not configured.');
  }

  // Check rate limit for embeddings as well
  await rateLimiter.checkLimit();
  console.log(`OpenRouter Embedding API: ${rateLimiter.getRemainingRequests()}/${rateLimiter.maxRequests} requests remaining`);

  try {
    const response = await axios.post(
      `${openrouterConfig.baseUrl}/embeddings`,
      {
        model: model,
        input: text
      },
      {
        headers: {
          'Authorization': `Bearer ${openrouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://physical-ai-humanoid-robotics-book-claude.app/',
          'X-Title': 'Physical AI Book Embedding'
        },
        timeout: 30000
      }
    );

    if (response.data?.data?.[0]?.embedding) {
      return response.data.data[0].embedding;
    } else {
      console.error('Unexpected response format from OpenRouter Embedding API:', JSON.stringify(response.data, null, 2));
      throw new Error('Unexpected response format from OpenRouter Embedding API');
    }
  } catch (error) {
    console.error('Error calling OpenRouter Embedding API:', error);
    if (error.response) {
      const errorMessage = error.response.data?.error?.message || 'Unknown API error';
      if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
        const quotaError = new Error('OpenRouter API embedding rate limit reached. Please wait a moment and try again.');
        quotaError.status = 429;
        throw quotaError;
      }
      const apiError = new Error(`OpenRouter Embedding API error: ${errorMessage}`);
      apiError.status = error.response.status || 500;
      throw apiError;
    } else if (error.request) {
      const noResponseError = new Error('No response from OpenRouter Embedding API. Please check your internet connection.');
      noResponseError.status = 503;
      throw noResponseError;
    } else {
      throw new Error(`Failed to call OpenRouter Embedding API: ${error.message}`);
    }
  }
};


export { callOpenRouterCompletion, callOpenRouterEmbeddings, rateLimiter };
