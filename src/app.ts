import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticate } from './security/auth.middleware';
import authRoutes from './routes/auth.routes';
import payslipRoutes from './routes/payslip.routes';
import taxRoutes from './routes/tax.routes';
import queryRoutes from './routes/query.routes';
import { errorHandler } from './utils/error-handler';

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

app.use(cors({
    origin: '*',
    credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/payslip', authenticate, payslipRoutes);
app.use('/api/tax', authenticate, taxRoutes);
app.use('/api/query', authenticate, queryRoutes);

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;