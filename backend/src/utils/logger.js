import { AsyncLocalStorage } from 'async_hooks';

export const loggerStorage = new AsyncLocalStorage();

export const logger = {
  log(level, message, meta = {}) {
    const store = loggerStorage.getStore();
    const requestId = store?.requestId || null;
    const organizationId = store?.organizationId || null;
    
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(requestId && { requestId }),
      ...(organizationId && { organizationId }),
      ...meta
    };

    // Strip out sensitive fields from log metadata if present
    const sensitiveFields = ['password', 'token', 'jwt', 'secret', 'authorization', 'apiKey', 'stripeKey'];
    sensitiveFields.forEach(field => {
      if (logData[field]) delete logData[field];
      if (logData.meta && logData.meta[field]) delete logData.meta[field];
    });

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      const reqInfo = requestId ? ` [Req: ${requestId}]` : '';
      const orgInfo = organizationId ? ` [Org: ${organizationId}]` : '';
      const cleanMeta = { ...meta };
      sensitiveFields.forEach(f => delete cleanMeta[f]);
      
      console.log(
        `${logData.timestamp} ${color}[${level}]${reset}${reqInfo}${orgInfo} ${message}`,
        Object.keys(cleanMeta).length ? cleanMeta : ''
      );
    }
  },
  info(message, meta) { this.log('INFO', message, meta); },
  warn(message, meta) { this.log('WARN', message, meta); },
  error(message, meta) { this.log('ERROR', message, meta); },
  debug(message, meta) { this.log('DEBUG', message, meta); }
};
