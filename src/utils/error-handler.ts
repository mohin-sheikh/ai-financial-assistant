import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error('Error:', err.message, err.stack);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            statusCode: err.statusCode,
            isOperational: err.isOperational,
        });
        return;
    }

    res.status(500).json({
        error: 'Internal server error',
        statusCode: 500,
        isOperational: false,
    });
};