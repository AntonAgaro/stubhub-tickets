import type { FastifyServerOptions } from 'fastify';

import type { AppConfig } from './config.js';

export function createLoggerOptions(config: AppConfig): FastifyServerOptions['logger'] {
  const base = {
    level: config.logLevel,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
      censor: '[REDACTED]',
    },
  };

  return config.nodeEnv === 'development'
    ? {
        ...base,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
          },
        },
      }
    : base;
}
