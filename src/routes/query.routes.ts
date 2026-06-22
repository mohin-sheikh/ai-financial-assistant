import express, { Request, Response } from 'express';
import { authorizeOwnData } from '../security/auth.middleware';
import { PayrollService } from '../core/payroll.service';
import { LLMService } from '../services/llm.service';
import { GROUNDED_QUERY_PROMPT } from '../prompts/grounding.prompts';
import { addAuditLog } from '../data/mock-data';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/ask', authorizeOwnData, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { question } = req.body;

        if (!question) {
            res.status(400).json({ error: 'Question is required' });
            return;
        }

        const records = PayrollService.getUserPayrollRecords(userId);
        const latestRecord = PayrollService.getLatestRecord(userId);

        if (records.length === 0) {
            res.status(404).json({ error: 'No payroll data found for user' });
            return;
        }

        const userData = {
            userId,
            records: records.map(r => ({
                month: r.month,
                year: r.year,
                basicSalary: r.basicSalary,
                hra: r.hra,
                lta: r.lta,
                pf: r.pf,
                tds: r.tds,
                grossPay: r.grossPay,
                netPay: r.netPay,
                yearToDate: r.yearToDate,
                declarations: r.declarations,
            })),
            latestRecord: latestRecord ? {
                month: latestRecord.month,
                year: latestRecord.year,
                grossPay: latestRecord.grossPay,
                netPay: latestRecord.netPay,
                breakdown: PayrollService.getSalaryBreakdown(latestRecord),
            } : null,
        };

        const prompt = GROUNDED_QUERY_PROMPT(question, userData);

        const llmService = LLMService.getInstance();
        const response = await llmService.query(prompt, {
            userId,
            question,
            timestamp: new Date().toISOString(),
        });

        addAuditLog({
            userId,
            action: 'QUERY',
            resource: 'ai_assistant',
            details: { question, responseLength: response.length },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            question,
            response,
            grounded: true,
            dataUsed: {
                recordsCount: records.length,
                hasLatestRecord: !!latestRecord,
            },
        });
    } catch (error) {
        logger.error('Query error:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});

router.post('/explain', authorizeOwnData, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { component } = req.body;

        if (!component) {
            res.status(400).json({ error: 'Component to explain is required' });
            return;
        }

        const latestRecord = PayrollService.getLatestRecord(userId);
        if (!latestRecord) {
            res.status(404).json({ error: 'No payroll record found' });
            return;
        }

        const componentMap: Record<string, number> = {
            basicSalary: latestRecord.basicSalary,
            hra: latestRecord.hra,
            lta: latestRecord.lta,
            pf: latestRecord.pf,
            tds: latestRecord.tds,
            grossPay: latestRecord.grossPay,
            netPay: latestRecord.netPay,
            professionalTax: latestRecord.professionalTax,
            specialAllowance: latestRecord.specialAllowance,
            reimbursements: latestRecord.reimbursements,
        };

        const value = componentMap[component];
        if (value === undefined) {
            res.status(400).json({ error: 'Unknown component' });
            return;
        }

        const llmService = LLMService.getInstance();
        const prompt = `Explain "${component}" (₹${value.toLocaleString()}) in simple terms for an employee. Cover: what it means, how it's calculated, and its tax implications.`;

        const explanation = await llmService.query(prompt, {
            userId,
            component,
            value,
        });

        res.json({
            component,
            value,
            explanation,
        });
    } catch (error) {
        logger.error('Explain error:', error);
        res.status(500).json({ error: 'Failed to explain component' });
    }
});

router.get('/faqs', (_req: Request, res: Response): void => {
    res.json({
        faqs: [
            {
                question: 'Why is my net salary lower this month?',
                answer: 'Check your TDS, PF, or other deductions. Compare with previous months.',
            },
            {
                question: 'How much HRA did I receive?',
                answer: 'Look at the HRA component in your payslip breakdown.',
            },
            {
                question: 'What deductions were applied?',
                answer: 'Common deductions: PF, Professional Tax, Income Tax (TDS), and other deductions.',
            },
            {
                question: 'How is my tax calculated?',
                answer: 'Tax is calculated based on your annual income minus eligible deductions.',
            },
            {
                question: 'How can I save more tax?',
                answer: 'Maximize Section 80C (₹150,000), claim HRA exemption, and consider health insurance (80D).',
            },
        ],
    });
});

export default router;