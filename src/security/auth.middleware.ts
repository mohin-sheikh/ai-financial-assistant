import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { logger } from '../utils/logger';

declare global {
    namespace Express {
        interface Request {
            user?: User;
            token?: string;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export const generateToken = (user: User): string => {
    const payload: AuthTokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): AuthTokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch (error) {
        return null;
    }
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role as 'employee' | 'admin' | 'payroll',
            name: 'John Doe',
            createdAt: new Date(),
            updatedAt: new Date(),
            password: '',
        };
        req.token = token;

        logger.info(`User authenticated: ${decoded.userId} (${decoded.role})`);
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

export const authorizeOwnData = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const userId = req.params.userId || req.body.userId || req.query.userId;

    if (req.user.role === 'admin' || req.user.role === 'payroll') {
        next();
        return;
    }

    if (userId && req.user.id !== userId) {
        res.status(403).json({
            error: 'Forbidden: You can only access your own data'
        });
        return;
    }

    next();
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: `Forbidden: Required roles: ${roles.join(', ')}`
            });
            return;
        }

        next();
    };
};