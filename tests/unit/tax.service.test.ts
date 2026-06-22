import { TaxService } from '../../src/core/tax.service';
import { createPayrollRecord } from '../../src/models';

describe('TaxService', () => {
    describe('calculateTax', () => {
        it('should calculate correct tax for income below 2.5L', () => {
            const result = TaxService.calculateTax(200000, 0);
            expect(result.totalTax).toBe(0);
            expect(result.taxableIncome).toBe(150000);
        });

        it('should calculate correct tax for income between 2.5L and 5L', () => {
            const result = TaxService.calculateTax(400000, 0);
            expect(result.taxableIncome).toBe(350000);
            expect(result.taxLiability).toBe(5000);
            expect(result.cess).toBe(200);
            expect(result.totalTax).toBe(5200);
        });

        it('should apply standard deduction correctly', () => {
            const result = TaxService.calculateTax(400000, 0);
            expect(result.totalDeductions).toBe(50000);
            expect(result.taxableIncome).toBe(350000);
        });
    });

    describe('calculateTotalDeductions', () => {
        it('should sum up all declarations from payroll records', () => {
            const records = [
                createPayrollRecord({
                    declarations: {
                        sec80C: 50000,
                        sec80D: 10000,
                        hraExemption: 20000,
                        ltaExemption: 5000,
                        otherDeductions: 5000,
                    }
                }),
                createPayrollRecord({
                    declarations: {
                        sec80C: 30000,
                        sec80D: 5000,
                        hraExemption: 10000,
                        ltaExemption: 3000,
                        otherDeductions: 2000,
                    }
                })
            ];

            const total = TaxService.calculateTotalDeductions(records);
            expect(total).toBe(50000 + 10000 + 20000 + 5000 + 5000 + 30000 + 5000 + 10000 + 3000 + 2000);
        });
    });
});