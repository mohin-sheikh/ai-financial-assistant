import app from './app';
import { logger } from './utils/logger';
import { initializeMockData } from './data/mock-data';

const PORT = process.env.PORT || 3000;

initializeMockData();

const server = app.listen(PORT, () => {
    logger.info(`Financial Wellness AI Agent running on port ${PORT}`);
    logger.info(`http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Demo user: user-123 / password: demo123`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

export default server;