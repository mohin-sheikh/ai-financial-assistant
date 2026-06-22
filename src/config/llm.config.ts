import dotenv from 'dotenv';

dotenv.config();

export interface LLMConfig {
    apiUrl: string;
    apiToken: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
}

export const llmConfig: LLMConfig = {
    apiUrl: process.env.LLM_API_URL || 'https://llm-wrapper-741152993481.asia-south1.run.app',
    apiToken: process.env.LLM_API_TOKEN || '',
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.LLM_RETRY_DELAY || '1000'),
};

if (!llmConfig.apiToken) {
    console.warn('LLM_API_TOKEN is not set in environment variables');
}