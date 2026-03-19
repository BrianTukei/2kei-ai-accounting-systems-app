interface LogEntry {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: Date;
  metadata?: any;
}

class Logger {
  private logs: LogEntry[] = [];

  info(message: string, metadata?: any) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: any) {
    this.log('error', message, metadata);
  }

  debug(message: string, metadata?: any) {
    this.log('debug', message, metadata);
  }

  private log(level: LogEntry['level'], message: string, metadata?: any) {
    const logEntry: LogEntry = {
      message,
      level,
      timestamp: new Date(),
      metadata
    };

    this.logs.push(logEntry);

    // Console output for development
    const timestamp = logEntry.timestamp.toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, metadata || '');
        break;
      case 'warn':
        console.warn(logMessage, metadata || '');
        break;
      case 'error':
        console.error(logMessage, metadata || '');
        break;
      case 'debug':
        console.debug(logMessage, metadata || '');
        break;
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
