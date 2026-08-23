type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
  userId?: string;
}

class Logger {
  private static instance: Logger;
  private isDevelopment = import.meta.env.DEV;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async log(level: LogLevel, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = { level, message, context, timestamp };

    // In a real production app, we would send this to a logging service (e.g., Sentry, LogRocket, or a custom Supabase table)
    if (this.isDevelopment) {
      const color = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: blue';
      console.log(`%c[${level.toUpperCase()}] ${timestamp}: ${message}`, color, context || '');
    } else {
      // Production logging logic here
      // Example: await supabase.from('logs').insert(logEntry);
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
    }
  }

  public info(message: string, context?: any) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: any) {
    this.log('error', message, context);
  }
}

export const logger = Logger.getInstance();
