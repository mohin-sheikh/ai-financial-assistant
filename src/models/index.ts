import { v4 as uuidv4 } from 'uuid';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'employee' | 'admin' | 'payroll';
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayrollRecord {
    id: string;
    userId: string;
    month: string;
    year: number;
    basicSalary: number;
    hra: number;
    lta: number;
    specialAllowance: number;
    pf: number;
    professionalTax: number;
    tds: number;
    reimbursements: number;
    otherDeductions: number;
    grossPay: number;
    netPay: number;
    yearToDate: {
        gross: number;
        net: number;
        taxPaid: number;
        pf: number;
    };
    declarations: {
        sec80C: number;
        sec80D: number;
        hraExemption: number;
        ltaExemption: number;
        otherDeductions: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface Document {
    id: string;
    userId: string;
    type: 'payslip' | 'investment-proof' | 'form-16';
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileBase64?: string;
    extractedData?: Partial<PayrollRecord>;
    processed: boolean;
    uploadDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    id: string;
    userId: string;
    action: 'UPLOAD' | 'QUERY' | 'VIEW' | 'SIMULATE' | 'LOGIN' | 'LOGOUT';
    resource: string;
    details: any;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}

export interface QueryContext {
    user: User;
    records: PayrollRecord[];
    documents: Document[];
    currentMonth: string;
}

export const createUser = (data: Partial<User>): User => ({
    id: uuidv4(),
    name: data.name || '',
    email: data.email || '',
    role: data.role || 'employee',
    password: data.password || 'demo123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
});

export const createPayrollRecord = (data: Partial<PayrollRecord>): PayrollRecord => ({
    id: uuidv4(),
    userId: data.userId || '',
    month: data.month || new Date().toLocaleString('default', { month: 'long' }),
    year: data.year || new Date().getFullYear(),
    basicSalary: data.basicSalary || 0,
    hra: data.hra || 0,
    lta: data.lta || 0,
    specialAllowance: data.specialAllowance || 0,
    pf: data.pf || 0,
    professionalTax: data.professionalTax || 0,
    tds: data.tds || 0,
    reimbursements: data.reimbursements || 0,
    otherDeductions: data.otherDeductions || 0,
    grossPay: data.grossPay || 0,
    netPay: data.netPay || 0,
    yearToDate: {
        gross: data.yearToDate?.gross || 0,
        net: data.yearToDate?.net || 0,
        taxPaid: data.yearToDate?.taxPaid || 0,
        pf: data.yearToDate?.pf || 0,
    },
    declarations: {
        sec80C: data.declarations?.sec80C || 0,
        sec80D: data.declarations?.sec80D || 0,
        hraExemption: data.declarations?.hraExemption || 0,
        ltaExemption: data.declarations?.ltaExemption || 0,
        otherDeductions: data.declarations?.otherDeductions || 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createDocument = (data: Partial<Document>): Document => ({
    id: uuidv4(),
    userId: data.userId || '',
    type: data.type || 'payslip',
    fileName: data.fileName || '',
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || '',
    processed: false,
    uploadDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
});