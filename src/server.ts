import { createApplication } from './bootstrap.js';
import { loadConfig } from './config/config.js';
import { createLoggerOptions } from './config/logger.js';

async function start(): Promise<void> {
  const config = loadConfig();
  const app = await createApplication({
    mongodbUri: config.mongodbUri,
    autoIndex: config.autoIndex,
    openapiEnabled: config.openapiEnabled,
    swaggerUiEnabled: config.openapiEnabled && config.nodeEnv === 'development',
    corsOrigins: config.corsOrigins,
    logger: createLoggerOptions(config),
  });
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'Shutting down');
    await app.close();
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  await app.listen({ host: config.host, port: config.port });
}

try {
  await start();
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
