/**
 * OpenRouter Adapter
 *
 * Adapts existing OpenRouter API functions to be compatible with
 * the agent system's expected OpenAI SDK-like interface.
 *
 * INTEGRATION: Wraps callOpenRouterCompletion and callOpenRouterEmbeddings
 * to match the interface expected by agent initialization functions.
 */

import { callOpenRouterCompletion, callOpenRouterEmbeddings } from './openRouterApi.js';

/**
 * Create OpenAI SDK-compatible client for chat completions
 *
 * REUSABLE: Makes existing OpenRouter API work with agent system
 */
export function createOpenRouterClient() {
  return {
    chat: {
      completions: {
        create: async ({ model, messages, temperature = 0.7, max_tokens = 1024 }) => {
          const content = await callOpenRouterCompletion(
            messages,
            model,
            temperature,
            max_tokens
          );

          // Return OpenAI SDK-compatible response
          return {
            choices: [{
              message: {
                content
              }
            }]
          };
        }
      }
    }
  };
}

/**
 * Create OpenAI SDK-compatible client for embeddings
 *
 * REUSABLE: Makes existing embedding API work with agent system
 */
export function createEmbeddingClient() {
  return {
    embeddings: {
      create: async ({ model, input }) => {
        const embedding = await callOpenRouterEmbeddings(input, model);

        // Return OpenAI SDK-compatible response
        return {
          data: [{
            embedding
          }]
        };
      }
    }
  };
}

export default {
  createOpenRouterClient,
  createEmbeddingClient
};
