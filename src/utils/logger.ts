export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

class Logger {
    private level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

    private log(level: LogLevel, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(prefix, message, ...args);
                break;
            case LogLevel.INFO:
                console.info(prefix, message, ...args);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, ...args);
                break;
            case LogLevel.ERROR:
                console.error(prefix, message, ...args);
                break;
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.level === LogLevel.DEBUG) {
            this.log(LogLevel.DEBUG, message, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }
}

export const logger = new Logger();