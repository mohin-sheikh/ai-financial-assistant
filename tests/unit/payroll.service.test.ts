import { PayrollService } from '../../src/core/payroll.service';
import { createPayrollRecord } from '../../src/models';

describe('PayrollService', () => {
    describe('calculateYTD', () => {
        it('should calculate correct YTD values', () => {
            const records = [
                createPayrollRecord({ grossPay: 50000, netPay: 35000, tds: 5000, pf: 6000 }),
                createPayrollRecord({ grossPay: 52000, netPay: 36000, tds: 5200, pf: 6240 }),
                createPayrollRecord({ grossPay: 54000, netPay: 37000, tds: 5400, pf: 6480 }),
            ];

            const ytd = PayrollService.calculateYTD(records);
            expect(ytd.gross).toBe(156000);
            expect(ytd.net).toBe(108000);
            expect(ytd.taxPaid).toBe(15600);
            expect(ytd.pf).toBe(18720);
        });
    });

    describe('compareMonths', () => {
        it('should correctly identify differences between two records', () => {
            const record1 = createPayrollRecord({ basicSalary: 50000, hra: 20000, grossPay: 70000, netPay: 50000 });
            const record2 = createPayrollRecord({ basicSalary: 48000, hra: 19000, grossPay: 67000, netPay: 48000 });

            const diff = PayrollService.compareMonths(record1, record2);
            expect(diff.basicSalary.difference).toBe(2000);
            expect(diff.hra.difference).toBe(1000);
            expect(diff.grossPay.difference).toBe(3000);
            expect(diff.netPay.difference).toBe(2000);
        });
    });
});