import { PayrollRecord } from '../models';
import { getPayrollRecords, getLatestPayrollRecord } from '../data/mock-data';

export class PayrollService {
    static getUserPayrollRecords(userId: string): PayrollRecord[] {
        return getPayrollRecords(userId);
    }

    static getLatestRecord(userId: string): PayrollRecord | null {
        return getLatestPayrollRecord(userId);
    }

    static getRecordByMonth(userId: string, month: string, year: number): PayrollRecord | null {
        const records = this.getUserPayrollRecords(userId);
        return records.find(r => r.month === month && r.year === year) || null;
    }

    static calculateYTD(records: PayrollRecord[]): { gross: number; net: number; taxPaid: number; pf: number } {
        return records.reduce((acc, record) => ({
            gross: acc.gross + record.grossPay,
            net: acc.net + record.netPay,
            taxPaid: acc.taxPaid + record.tds,
            pf: acc.pf + record.pf,
        }), { gross: 0, net: 0, taxPaid: 0, pf: 0 });
    }

    static compareMonths(record1: PayrollRecord, record2: PayrollRecord): any {
        const differences: any = {};
        const keys = ['basicSalary', 'hra', 'lta', 'specialAllowance', 'pf', 'tds', 'grossPay', 'netPay'];

        keys.forEach(key => {
            const val1 = record1[key as keyof PayrollRecord] as number;
            const val2 = record2[key as keyof PayrollRecord] as number;
            const diff = val1 - val2;
            if (diff !== 0) {
                differences[key] = {
                    current: val1,
                    previous: val2,
                    difference: diff,
                    percentage: val2 !== 0 ? Math.round((diff / val2) * 100) : 0
                };
            }
        });

        return differences;
    }

    static getSalaryBreakdown(record: PayrollRecord): any {
        return {
            earnings: {
                basicSalary: { amount: record.basicSalary, label: 'Basic Salary' },
                hra: { amount: record.hra, label: 'House Rent Allowance' },
                lta: { amount: record.lta, label: 'Leave Travel Allowance' },
                specialAllowance: { amount: record.specialAllowance, label: 'Special Allowance' },
                reimbursements: { amount: record.reimbursements, label: 'Reimbursements' },
            },
            deductions: {
                pf: { amount: record.pf, label: 'Provident Fund' },
                professionalTax: { amount: record.professionalTax, label: 'Professional Tax' },
                tds: { amount: record.tds, label: 'Income Tax (TDS)' },
                otherDeductions: { amount: record.otherDeductions, label: 'Other Deductions' },
            },
            summary: {
                grossPay: record.grossPay,
                totalDeductions: record.pf + record.professionalTax + record.tds + record.otherDeductions,
                netPay: record.netPay,
            }
        };
    }

    static getYTDSummary(userId: string): any {
        const records = this.getUserPayrollRecords(userId);
        const ytd = this.calculateYTD(records);
        const latestRecord = this.getLatestRecord(userId);

        return {
            totalRecords: records.length,
            yearToDate: ytd,
            averageMonthly: {
                gross: records.length > 0 ? ytd.gross / records.length : 0,
                net: records.length > 0 ? ytd.net / records.length : 0,
                tax: records.length > 0 ? ytd.taxPaid / records.length : 0,
            },
            latestMonth: latestRecord ? {
                month: latestRecord.month,
                year: latestRecord.year,
                gross: latestRecord.grossPay,
                net: latestRecord.netPay,
                tax: latestRecord.tds,
            } : null,
        };
    }

    static analyzeTrends(userId: string): any {
        const records = this.getUserPayrollRecords(userId);
        if (records.length < 2) {
            return { message: 'Need at least 2 months of data for trend analysis.' };
        }

        const sorted = [...records].sort((a, b) => {
            const dateA = new Date(`${a.month} 1, ${a.year}`);
            const dateB = new Date(`${b.month} 1, ${b.year}`);
            return dateA.getTime() - dateB.getTime();
        });

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        return {
            period: `${first.month} ${first.year} to ${last.month} ${last.year}`,
            grossPay: {
                start: first.grossPay,
                end: last.grossPay,
                change: last.grossPay - first.grossPay,
                percentageChange: first.grossPay > 0 ? ((last.grossPay - first.grossPay) / first.grossPay) * 100 : 0,
            },
            netPay: {
                start: first.netPay,
                end: last.netPay,
                change: last.netPay - first.netPay,
                percentageChange: first.netPay > 0 ? ((last.netPay - first.netPay) / first.netPay) * 100 : 0,
            },
            monthlyData: sorted.map(r => ({
                month: r.month,
                year: r.year,
                grossPay: r.grossPay,
                netPay: r.netPay,
            })),
        };
    }
}