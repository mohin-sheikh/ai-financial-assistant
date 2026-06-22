import express, { Request, Response } from 'express';
import { TaxService } from '../core/tax.service';
import { PayrollService } from '../core/payroll.service';
import { authorizeOwnData } from '../security/auth.middleware';
import { addAuditLog } from '../data/mock-data';
import { LLMService } from '../services/llm.service';
import { TAX_SIMULATION_PROMPT } from '../prompts/grounding.prompts';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/summary', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const records = PayrollService.getUserPayrollRecords(userId);

        if (records.length === 0) {
            res.status(404).json({ error: 'No payroll records found' });
            return;
        }

        const annualIncome = TaxService.calculateAnnualIncome(records);
        const totalDeductions = TaxService.calculateTotalDeductions(records);
        const taxResult = TaxService.calculateTax(annualIncome, totalDeductions);

        addAuditLog({
            userId,
            action: 'VIEW',
            resource: 'tax_summary',
            details: { annualIncome, totalTax: taxResult.totalTax },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            annualIncome,
            totalDeductions,
            taxableIncome: taxResult.taxableIncome,
            taxLiability: taxResult.taxLiability,
            cess: taxResult.cess,
            totalTax: taxResult.totalTax,
            effectiveTaxRate: taxResult.effectiveTaxRate,
            monthlyTax: taxResult.monthlyTax,
            inHandSalary: taxResult.inHandSalary,
        });
    } catch (error) {
        logger.error('Tax summary error:', error);
        res.status(500).json({ error: 'Failed to get tax summary' });
    }
});

router.post('/simulate', authorizeOwnData, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { additionalInvestment, section = 'sec80C' } = req.body;

        if (!additionalInvestment || additionalInvestment < 0) {
            res.status(400).json({ error: 'Valid additional investment amount required' });
            return;
        }

        const records = PayrollService.getUserPayrollRecords(userId);
        if (records.length === 0) {
            res.status(404).json({ error: 'No payroll records found' });
            return;
        }

        const result = TaxService.simulateInvestment(userId, additionalInvestment, section);

        if (!result) {
            res.status(404).json({ error: 'Failed to run simulation' });
            return;
        }

        const llmService = LLMService.getInstance();
        const currentData = {
            annualIncome: result.current.grossAnnualIncome,
            currentTax: result.current.totalTax,
            currentDeductions: result.current.totalDeductions,
        };

        const prompt = TAX_SIMULATION_PROMPT(currentData, additionalInvestment);
        const explanation = await llmService.query(prompt, {
            userId,
            simulationId: `sim-${Date.now()}`,
        });

        addAuditLog({
            userId,
            action: 'SIMULATE',
            resource: 'tax_simulation',
            details: { additionalInvestment, section, savings: result.savings.annual },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            result: {
                currentTax: result.current.totalTax,
                proposedTax: result.proposed.totalTax,
                taxSavings: result.savings.annual,
                monthlySavings: result.savings.monthly,
                additionalInvestment: result.additionalInvestment,
                roi: result.roi.toFixed(2) + '%',
            },
            explanation,
        });
    } catch (error) {
        logger.error('Tax simulation error:', error);
        res.status(500).json({ error: 'Failed to run simulation' });
    }
});

router.get('/checklist', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const checklist = TaxService.generateChecklist(userId);

        addAuditLog({
            userId,
            action: 'VIEW',
            resource: 'checklist',
            details: {},
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            checklist,
            formatted: checklist.join('\n'),
        });
    } catch (error) {
        logger.error('Checklist error:', error);
        res.status(500).json({ error: 'Failed to generate checklist' });
    }
});

router.get('/recommendations', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const recommendations = TaxService.getRecommendations(userId);

        res.json({
            recommendations,
            formatted: recommendations.join('\n'),
        });
    } catch (error) {
        logger.error('Recommendations error:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

export default router;