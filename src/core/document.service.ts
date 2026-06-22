import { Document, createDocument } from '../models';
import { documents, addAuditLog } from '../data/mock-data';
import { LLMService } from '../services/llm.service';
import { EXTRACT_PAYSLIP_PROMPT } from '../prompts/grounding.prompts';
import { logger } from '../utils/logger';

export class DocumentService {
    static saveDocument(
        userId: string,
        fileName: string,
        fileBase64: string,
        mimeType: string,
        type: 'payslip' | 'investment-proof' | 'form-16' = 'payslip'
    ): Document {
        const doc = createDocument({
            userId,
            fileName,
            fileBase64,
            mimeType,
            type,
            fileSize: Buffer.from(fileBase64, 'base64').length,
        });

        if (!documents.has(userId)) {
            documents.set(userId, []);
        }
        documents.get(userId)!.push(doc);

        addAuditLog({
            userId,
            action: 'UPLOAD',
            resource: 'document',
            details: { documentId: doc.id, fileName, type },
            ipAddress: '127.0.0.1',
            userAgent: 'system',
        });

        logger.info(`Document saved: ${fileName} for user ${userId}`);
        return doc;
    }

    static async processPayslip(
        userId: string,
        fileBase64: string,
        mimeType: string,
        fileName: string
    ): Promise<Document> {
        const doc = this.saveDocument(userId, fileName, fileBase64, mimeType, 'payslip');

        try {
            const llmService = LLMService.getInstance();
            const extractedText = await llmService.analyzeDocument(
                EXTRACT_PAYSLIP_PROMPT,
                fileBase64,
                mimeType
            );

            let extractedData;
            try {
                const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                } else {
                    extractedData = this.extractWithRegex(extractedText);
                }
            } catch (e) {
                logger.warn('Failed to parse LLM response, using regex fallback');
                extractedData = this.extractWithRegex(extractedText);
            }

            doc.extractedData = extractedData;
            doc.processed = true;

            addAuditLog({
                userId,
                action: 'UPLOAD',
                resource: 'payslip_processed',
                details: { documentId: doc.id, fileName },
                ipAddress: '127.0.0.1',
                userAgent: 'system',
            });

            logger.info(`Payslip processed: ${fileName} for user ${userId}`);
            return doc;
        } catch (error) {
            logger.error(`Error processing payslip: ${error}`);
            throw new Error('Failed to process payslip');
        }
    }

    private static extractWithRegex(text: string): any {
        const data: any = {};

        const patterns = {
            basicSalary: /(?:basic|base)\s*salary:?\s*₹?\s*([\d,]+)/i,
            hra: /hra:?\s*₹?\s*([\d,]+)/i,
            lta: /lta:?\s*₹?\s*([\d,]+)/i,
            pf: /(?:provident\s*fund|pf):?\s*₹?\s*([\d,]+)/i,
            professionalTax: /(?:professional\s*tax|prof\s*tax):?\s*₹?\s*([\d,]+)/i,
            tds: /(?:income\s*tax|tds|tax\s*deducted):?\s*₹?\s*([\d,]+)/i,
            grossPay: /(?:gross\s*pay|gross\s*salary):?\s*₹?\s*([\d,]+)/i,
            netPay: /(?:net\s*pay|take\s*home):?\s*₹?\s*([\d,]+)/i,
            month: /(?:month|period):?\s*([a-zA-Z]+\s*\d{4})/i,
        };

        for (const [key, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                const value = match[1].replace(/,/g, '');
                data[key] = isNaN(Number(value)) ? value : Number(value);
            }
        }

        return data;
    }

    static getUserDocuments(userId: string): Document[] {
        return documents.get(userId) || [];
    }

    static getDocument(documentId: string): Document | null {
        for (const docs of documents.values()) {
            const doc = docs.find(d => d.id === documentId);
            if (doc) return doc;
        }
        return null;
    }

    static deleteDocument(userId: string, documentId: string): boolean {
        const userDocs = documents.get(userId);
        if (!userDocs) return false;

        const index = userDocs.findIndex(d => d.id === documentId);
        if (index !== -1) {
            userDocs.splice(index, 1);
            addAuditLog({
                userId,
                action: 'VIEW',
                resource: 'document_deleted',
                details: { documentId },
                ipAddress: '127.0.0.1',
                userAgent: 'system',
            });
            return true;
        }
        return false;
    }
}