import express, { Request, Response } from 'express';
import { DocumentService } from '../core/document.service';
import { PayrollService } from '../core/payroll.service';
import { authorizeOwnData } from '../security/auth.middleware';
import { addAuditLog } from '../data/mock-data';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/upload', authorizeOwnData, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { fileBase64, fileName, mimeType } = req.body;

        if (!fileBase64 || !fileName) {
            res.status(400).json({ error: 'File data required' });
            return;
        }

        const document = await DocumentService.processPayslip(
            userId,
            fileBase64,
            mimeType || 'application/pdf',
            fileName
        );

        res.status(201).json({
            message: 'Payslip uploaded and processed successfully',
            document: {
                id: document.id,
                fileName: document.fileName,
                processed: document.processed,
                extractedData: document.extractedData,
            },
        });
    } catch (error) {
        logger.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process payslip' });
    }
});

router.get('/records', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const records = PayrollService.getUserPayrollRecords(userId);

        addAuditLog({
            userId,
            action: 'VIEW',
            resource: 'payroll_records',
            details: { count: records.length },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            records: records.map(r => ({
                id: r.id,
                month: r.month,
                year: r.year,
                grossPay: r.grossPay,
                netPay: r.netPay,
                basicSalary: r.basicSalary,
                hra: r.hra,
                tds: r.tds,
                pf: r.pf,
            })),
        });
    } catch (error) {
        logger.error('Fetch records error:', error);
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

router.get('/records/:recordId', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { recordId } = req.params;
        const records = PayrollService.getUserPayrollRecords(userId);
        const record = records.find(r => r.id === recordId);

        if (!record) {
            res.status(404).json({ error: 'Record not found' });
            return;
        }

        const breakdown = PayrollService.getSalaryBreakdown(record);
        res.json({ record, breakdown });
    } catch (error) {
        logger.error('Get record error:', error);
        res.status(500).json({ error: 'Failed to get record' });
    }
});

router.post('/compare', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { month1, month2, year1, year2 } = req.body;

        const record1 = PayrollService.getRecordByMonth(userId, month1, year1);
        const record2 = PayrollService.getRecordByMonth(userId, month2, year2);

        if (!record1 || !record2) {
            res.status(404).json({ error: 'One or both records not found' });
            return;
        }

        const comparison = PayrollService.compareMonths(record1, record2);

        addAuditLog({
            userId,
            action: 'VIEW',
            resource: 'comparison',
            details: { month1, year1, month2, year2 },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json({
            record1: { month: record1.month, year: record1.year, netPay: record1.netPay },
            record2: { month: record2.month, year: record2.year, netPay: record2.netPay },
            differences: comparison,
        });
    } catch (error) {
        logger.error('Compare error:', error);
        res.status(500).json({ error: 'Failed to compare records' });
    }
});

router.get('/ytd', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const summary = PayrollService.getYTDSummary(userId);

        addAuditLog({
            userId,
            action: 'VIEW',
            resource: 'ytd_summary',
            details: {},
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        res.json(summary);
    } catch (error) {
        logger.error('YTD error:', error);
        res.status(500).json({ error: 'Failed to get YTD summary' });
    }
});

router.get('/trends', authorizeOwnData, (req: Request, res: Response): void => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const trends = PayrollService.analyzeTrends(userId);
        res.json(trends);
    } catch (error) {
        logger.error('Trend analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze trends' });
    }
});

export default router;