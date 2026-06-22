import axios, { AxiosInstance } from 'axios';
import { llmConfig } from '../config/llm.config';
import { logger } from '../utils/logger';

export class LLMService {
    private static instance: LLMService;
    private axiosInstance: AxiosInstance;
    private retryCount: number = 0;

    private constructor() {
        this.axiosInstance = axios.create({
            baseURL: llmConfig.apiUrl,
            headers: {
                'Authorization': `Bearer ${llmConfig.apiToken}`,
                'Content-Type': 'application/json',
            },
            timeout: llmConfig.timeout,
        });
    }

    public static getInstance(): LLMService {
        if (!LLMService.instance) {
            LLMService.instance = new LLMService();
        }
        return LLMService.instance;
    }

    async query(prompt: string, metadata?: any): Promise<string> {
        try {
            logger.info(`LLM Query: ${prompt.substring(0, 100)}...`);

            const response = await this.axiosInstance.post('/llm/query', {
                prompt,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                },
            });

            const result = response.data?.response ||
                response.data?.choices?.[0]?.message?.content ||
                'No response from LLM';

            logger.info(`LLM Response received (${result.length} chars)`);
            this.retryCount = 0;
            return result;
        } catch (error) {
            logger.error('LLM Query Error:', error);

            if (this.retryCount < llmConfig.maxRetries) {
                this.retryCount++;
                const delay = llmConfig.retryDelay * this.retryCount;
                logger.info(`Retrying in ${delay}ms (attempt ${this.retryCount})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.query(prompt, metadata);
            }

            throw new Error('Failed to get AI response after multiple retries');
        }
    }

    async analyzeDocument(prompt: string, base64Content: string, mediaType: string): Promise<string> {
        try {
            logger.info(`Analyzing document (${mediaType})...`);

            const response = await this.axiosInstance.post('/llm/query', {
                prompt,
                imageBase64: base64Content,
                imageMediaType: mediaType,
                metadata: {
                    purpose: 'payslip-extraction',
                    timestamp: new Date().toISOString(),
                },
            });

            const result = response.data?.response ||
                response.data?.choices?.[0]?.message?.content ||
                'Unable to extract data from document';

            logger.info(`Document analysis complete (${result.length} chars)`);
            return result;
        } catch (error) {
            logger.error('Document Analysis Error:', error);
            throw new Error('Failed to analyze document');
        }
    }

    async batchAnalyze(documents: Array<{ prompt: string; base64: string; mediaType: string }>): Promise<string[]> {
        const results = await Promise.all(
            documents.map(doc => this.analyzeDocument(doc.prompt, doc.base64, doc.mediaType))
        );
        return results;
    }
}