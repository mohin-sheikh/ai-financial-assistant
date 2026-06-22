import express, { Request, Response } from 'express';
import { generateToken } from '../security/auth.middleware';
import { getUserByEmail } from '../data/mock-data';
import { addAuditLog } from '../data/mock-data';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }

        const user = getUserByEmail(email);
        if (!user) {
            addAuditLog({
                userId: 'unknown',
                action: 'LOGIN',
                resource: 'auth',
                details: { email, success: false, reason: 'User not found' },
                ipAddress: req.ip || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'unknown',
            });
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (user.password !== password) {
            addAuditLog({
                userId: user.id,
                action: 'LOGIN',
                resource: 'auth',
                details: { email, success: false, reason: 'Invalid password' },
                ipAddress: req.ip || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'unknown',
            });
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken(user);

        addAuditLog({
            userId: user.id,
            action: 'LOGIN',
            resource: 'auth',
            details: { email, success: true },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        logger.info(`User logged in: ${email}`);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/logout', (_req: Request, res: Response): void => {
    res.json({ message: 'Logged out successfully' });
});

export default router;