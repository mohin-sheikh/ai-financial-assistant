import { User, PayrollRecord, createUser, createPayrollRecord } from '../models';
import { logger } from '../utils/logger';

export const users: Map<string, User> = new Map();
export const payrollRecords: Map<string, PayrollRecord[]> = new Map();
export const documents: Map<string, any[]> = new Map();
export const auditLogs: any[] = [];

export const mockUsers: User[] = [
    createUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'employee',
        password: 'demo123',
    }),
    createUser({
        id: 'user-456',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: 'employee',
        password: 'demo123',
    }),
    createUser({
        id: 'admin-001',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'admin',
        password: 'admin123',
    }),
];

const generatePayrollRecords = (userId: string, months: number = 6): PayrollRecord[] => {
    const records: PayrollRecord[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    for (let i = 0; i < months; i++) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = new Date(currentYear, monthIndex, 1).toLocaleString('default', { month: 'long' });
        const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;

        const baseProgression = 50000 + (i * 500);
        const randomFactor = 1 + (Math.random() * 0.05 - 0.025); // ±2.5% variation

        const basicSalary = Math.round(baseProgression * randomFactor);
        const hra = Math.round(basicSalary * 0.4);
        const lta = Math.round(2000 + (i * 100) * randomFactor);
        const specialAllowance = Math.round(10000 + (i * 500) * randomFactor);
        const pf = Math.round(basicSalary * 0.12);
        const professionalTax = 200;
        const tds = Math.round((basicSalary + hra + specialAllowance) * 0.1 * randomFactor);
        const reimbursements = Math.round(1500 + (i * 50) * randomFactor);
        const grossPay = basicSalary + hra + lta + specialAllowance + reimbursements;
        const otherDeductions = 500;
        const netPay = grossPay - pf - professionalTax - tds - otherDeductions;

        const record = createPayrollRecord({
            userId,
            month: monthName,
            year,
            basicSalary,
            hra,
            lta,
            specialAllowance,
            pf,
            professionalTax,
            tds,
            reimbursements,
            otherDeductions,
            grossPay,
            netPay,
            declarations: {
                sec80C: 150000 - (i * 5000),
                sec80D: 25000,
                hraExemption: Math.round(hra * 0.5),
                ltaExemption: Math.round(lta * 0.6),
                otherDeductions: 10000,
            },
            yearToDate: {
                gross: 0,
                net: 0,
                taxPaid: 0,
                pf: 0,
            },
        });

        records.push(record);
    }

    let runningGross = 0, runningNet = 0, runningTax = 0, runningPf = 0;
    records.reverse().forEach(record => {
        runningGross += record.grossPay;
        runningNet += record.netPay;
        runningTax += record.tds;
        runningPf += record.pf;
        record.yearToDate = {
            gross: runningGross,
            net: runningNet,
            taxPaid: runningTax,
            pf: runningPf,
        };
    });

    return records;
};

export const initializeMockData = () => {
    logger.info('Initializing mock data...');

    mockUsers.forEach(user => {
        users.set(user.id, user);
        logger.info(`Created user: ${user.name} (${user.id})`);
    });

    mockUsers.forEach(user => {
        if (user.role === 'employee') {
            const records = generatePayrollRecords(user.id, 6);
            payrollRecords.set(user.id, records);
            logger.info(`Generated ${records.length} payroll records for ${user.name}`);
        }
    });

    mockUsers.forEach(user => {
        if (user.role === 'employee') {
            documents.set(user.id, [
                {
                    id: 'doc-1',
                    userId: user.id,
                    type: 'payslip',
                    fileName: 'payslip_jan_2026.pdf',
                    fileSize: 245000,
                    mimeType: 'application/pdf',
                    processed: true,
                    uploadDate: new Date('2026-01-31'),
                    extractedData: {
                        basicSalary: 50000,
                        hra: 20000,
                        pf: 6000,
                        netPay: 35000,
                    }
                },
                {
                    id: 'doc-2',
                    userId: user.id,
                    type: 'payslip',
                    fileName: 'payslip_feb_2026.pdf',
                    fileSize: 248000,
                    mimeType: 'application/pdf',
                    processed: true,
                    uploadDate: new Date('2026-02-28'),
                    extractedData: {
                        basicSalary: 50500,
                        hra: 20200,
                        pf: 6060,
                        netPay: 35350,
                    }
                }
            ]);
            logger.info(`Added sample documents for ${user.name}`);
        }
    });

    logger.info('Mock data initialization complete!');
    logger.info(`${users.size} users, ${payrollRecords.size} payroll sets loaded`);
};

export const getUserById = (id: string): User | undefined => {
    return users.get(id);
};

export const getUserByEmail = (email: string): User | undefined => {
    for (const user of users.values()) {
        if (user.email === email) {
            return user;
        }
    }
    return undefined;
};

export const getPayrollRecords = (userId: string): PayrollRecord[] => {
    return payrollRecords.get(userId) || [];
};

export const getLatestPayrollRecord = (userId: string): PayrollRecord | null => {
    const records = getPayrollRecords(userId);
    if (records.length === 0) return null;
    return records.sort((a, b) => {
        const dateA = new Date(`${a.month} 1, ${a.year}`);
        const dateB = new Date(`${b.month} 1, ${b.year}`);
        return dateB.getTime() - dateA.getTime();
    })[0];
};

export const getUserDocuments = (userId: string): any[] => {
    return documents.get(userId) || [];
};

export const addAuditLog = (log: any) => {
    auditLogs.push({
        ...log,
        id: `audit-${Date.now()}`,
        timestamp: new Date(),
    });
};