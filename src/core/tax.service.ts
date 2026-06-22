import { PayrollRecord } from '../models';
import { getPayrollRecords } from '../data/mock-data';
import { logger } from '../utils/logger';

export interface TaxCalculationResult {
    grossAnnualIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    taxLiability: number;
    cess: number;
    totalTax: number;
    effectiveTaxRate: number;
    monthlyTax: number;
    inHandSalary: number;
}

export interface TaxSimulationResult {
    current: TaxCalculationResult;
    proposed: TaxCalculationResult;
    savings: {
        tax: number;
        monthly: number;
        annual: number;
    };
    additionalInvestment: number;
    roi: number;
}

export class TaxService {
    private static readonly TAX_SLABS = [
        { limit: 250000, rate: 0 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.20 },
        { limit: Infinity, rate: 0.30 },
    ];

    private static readonly STANDARD_DEDUCTION = 50000;
    private static readonly CESS_RATE = 0.04;

    static calculateTax(annualIncome: number, deductions: number = 0): TaxCalculationResult {
        const taxableIncome = Math.max(0, annualIncome - deductions - this.STANDARD_DEDUCTION);

        let tax = 0;
        let remainingIncome = taxableIncome;
        let previousLimit = 0;

        for (const slab of this.TAX_SLABS) {
            const taxableAmount = Math.min(remainingIncome, slab.limit - previousLimit);
            tax += taxableAmount * slab.rate;
            remainingIncome -= taxableAmount;
            previousLimit = slab.limit;
            if (remainingIncome <= 0) break;
        }

        const cess = tax * this.CESS_RATE;
        const totalTax = tax + cess;
        const effectiveTaxRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;
        const monthlyTax = totalTax / 12;
        const inHandSalary = (annualIncome - totalTax) / 12;

        return {
            grossAnnualIncome: annualIncome,
            totalDeductions: deductions + this.STANDARD_DEDUCTION,
            taxableIncome,
            taxLiability: tax,
            cess,
            totalTax,
            effectiveTaxRate,
            monthlyTax,
            inHandSalary,
        };
    }

    static calculateAnnualIncome(records: PayrollRecord[]): number {
        return records.reduce((total, record) => total + record.grossPay, 0);
    }

    static calculateTotalDeductions(records: PayrollRecord[]): number {
        return records.reduce((total, record) => {
            const declarations = record.declarations || {
                sec80C: 0,
                sec80D: 0,
                hraExemption: 0,
                ltaExemption: 0,
                otherDeductions: 0,
            };
            return total + declarations.sec80C + declarations.sec80D +
                declarations.hraExemption + declarations.ltaExemption +
                declarations.otherDeductions;
        }, 0);
    }

    static simulateInvestment(
        userId: string,
        additionalInvestment: number,
        section: 'sec80C' | 'sec80D' | 'other' = 'sec80C'
    ): TaxSimulationResult | null {
        const records = getPayrollRecords(userId);
        if (records.length === 0) return null;

        const annualIncome = this.calculateAnnualIncome(records);
        const currentDeductions = this.calculateTotalDeductions(records);

        const currentResult = this.calculateTax(annualIncome, currentDeductions);

        const proposedDeductions = currentDeductions + additionalInvestment;
        const proposedResult = this.calculateTax(annualIncome, proposedDeductions);

        const savings = {
            tax: currentResult.totalTax - proposedResult.totalTax,
            monthly: (currentResult.totalTax - proposedResult.totalTax) / 12,
            annual: currentResult.totalTax - proposedResult.totalTax,
        };

        const roi = additionalInvestment > 0 ? (savings.annual / additionalInvestment) * 100 : 0;

        logger.info(`Tax simulation: Additional ₹${additionalInvestment} in ${section} saves ₹${savings.annual}`);

        return {
            current: currentResult,
            proposed: proposedResult,
            savings,
            additionalInvestment,
            roi,
        };
    }

    static generateChecklist(userId: string): string[] {
        const records = getPayrollRecords(userId);
        const checklist: string[] = [];
        const latestRecord = records[records.length - 1];

        if (!latestRecord) {
            return ['No payroll records found. Please upload your payslip.'];
        }

        const declarations = latestRecord.declarations || {};
        const month = latestRecord.month;
        const year = latestRecord.year;

        checklist.push(`Investment Proof Checklist for ${month} ${year}`);
        checklist.push('='.repeat(40));

        if (declarations.sec80C > 0) {
            const remaining = Math.max(0, 150000 - declarations.sec80C);
            checklist.push(`\nSection 80C: ₹${declarations.sec80C.toLocaleString()} declared`);
            if (remaining > 0) {
                checklist.push(`   Can invest ₹${remaining.toLocaleString()} more to maximize (₹${remaining * 0.3} tax saving)`);
            } else {
                checklist.push(`   Section 80C limit maximized!`);
            }
            checklist.push('   Submit proofs for: Life Insurance, PPF, ELSS, NSC, etc.');
        } else {
            checklist.push('\nNo Section 80C declarations found');
            checklist.push('   Consider declaring up to ₹150,000 to save tax');
        }

        if (declarations.sec80D > 0) {
            checklist.push(`\nSection 80D: ₹${declarations.sec80D.toLocaleString()} declared`);
            checklist.push('   Submit health insurance premium receipts');
        } else {
            checklist.push('\nConsider health insurance for Section 80D deduction');
            checklist.push('   Submit medical insurance premium receipts');
        }

        if (latestRecord.hra > 0) {
            const hraExemption = declarations.hraExemption || 0;
            const remainingHRA = Math.max(0, latestRecord.hra - hraExemption);
            checklist.push(`\nHRA: ₹${latestRecord.hra.toLocaleString()} received`);
            checklist.push(`   💰 Exemption claimed: ₹${hraExemption.toLocaleString()}`);
            if (remainingHRA > 0) {
                checklist.push(`   Submit rent receipts worth ₹${remainingHRA.toLocaleString()}`);
                checklist.push('   Landlord PAN required if rent > ₹1L annually');
            }
        } else {
            checklist.push('\n🏠 No HRA component found');
        }

        if (latestRecord.lta > 0) {
            checklist.push(`\nLTA: ₹${latestRecord.lta.toLocaleString()} received`);
            checklist.push('   Submit travel tickets and proof of travel');
            checklist.push('   Holiday declaration form required');
        } else {
            checklist.push('\nNo LTA component found');
        }

        if (declarations.otherDeductions > 0) {
            checklist.push(`\nOther deductions: ₹${declarations.otherDeductions.toLocaleString()}`);
            checklist.push('   Submit supporting documents');
        }

        const totalDeclared = Object.values(declarations).reduce((a, b) => a + b, 0);
        checklist.push('\n' + '='.repeat(40));
        checklist.push(`Total declared: ₹${totalDeclared.toLocaleString()}`);
        checklist.push('Deadline: Usually January 31st of the assessment year');
        checklist.push('Contact: payroll@company.com for queries');

        return checklist;
    }

    static getRecommendations(userId: string): string[] {
        const records = getPayrollRecords(userId);
        const recommendations: string[] = [];
        const latestRecord = records[records.length - 1];

        if (!latestRecord) {
            return ['Please upload your payslip for personalized recommendations.'];
        }

        recommendations.push(`Tax Planning Recommendations for FY ${new Date().getFullYear()}`);
        recommendations.push('='.repeat(40));

        const sec80C = latestRecord.declarations?.sec80C || 0;
        if (sec80C < 150000) {
            const remaining = 150000 - sec80C;
            const potentialSavings = this.simulateInvestment(userId, remaining);
            if (potentialSavings) {
                recommendations.push(
                    `\nMaximize Section 80C:`,
                    `   Invest ₹${remaining.toLocaleString()} more to save ₹${potentialSavings.savings.annual.toLocaleString()} in tax`,
                    `   Available options: PPF, ELSS, Life Insurance, NSC, Sukanya Samriddhi`
                );
            }
        }

        if (latestRecord.hra > 0) {
            const hraExemption = latestRecord.declarations?.hraExemption || 0;
            if (hraExemption < latestRecord.hra) {
                const potential = latestRecord.hra - hraExemption;
                recommendations.push(
                    `\nOptimize HRA:`,
                    `   Claim additional ₹${potential.toLocaleString()} HRA exemption`,
                    `   Submit rent receipts and rent agreement`
                );
            }
        }

        if (!latestRecord.declarations?.sec80D || latestRecord.declarations.sec80D < 25000) {
            const current = latestRecord.declarations?.sec80D || 0;
            const potential = 25000 - current;
            recommendations.push(
                `\nMaximize Health Insurance:`,
                `   Claim ₹${potential.toLocaleString()} more under Section 80D`,
                `   Family health insurance premiums qualify`
            );
        }

        recommendations.push('\nGeneral Tips:');
        recommendations.push('• Maintain all investment proofs for at least 5 years');
        recommendations.push('• File ITR by July 31st to avoid penalties');
        recommendations.push('• Consider NPS for additional ₹50,000 deduction under Section 80CCD(1B)');
        recommendations.push('• Claim interest on home loan (Section 24) up to ₹2,00,000');

        return recommendations;
    }
}