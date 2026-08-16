import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.js';

describe('application configuration', () => {
  it('validates, coerces, and normalizes environment values', () => {
    const config = loadConfig(
      {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '4100',
        LOG_LEVEL: 'info',
        MONGODB_URI: 'mongodb://localhost:27017/notes',
        OPENAPI_ENABLED: 'false',
        CORS_ORIGINS: ' https://first.example,https://second.example ',
      },
      false
    );

    expect(config).toEqual({
      nodeEnv: 'production',
      host: '0.0.0.0',
      port: 4100,
      logLevel: 'info',
      mongodbUri: 'mongodb://localhost:27017/notes',
      openapiEnabled: false,
      corsOrigins: ['https://first.example', 'https://second.example'],
      autoIndex: false,
    });
  });
});
