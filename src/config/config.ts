import { envSchema } from 'env-schema';
import { Type } from 'typebox';

const EnvironmentSchema = Type.Object(
  {
    NODE_ENV: Type.Union([Type.Literal('development'), Type.Literal('test'), Type.Literal('production')], {
      default: 'development',
    }),
    HOST: Type.String({ default: '127.0.0.1', minLength: 1 }),
    PORT: Type.Integer({ default: 3000, minimum: 1, maximum: 65_535 }),
    LOG_LEVEL: Type.Union(
      [
        Type.Literal('fatal'),
        Type.Literal('error'),
        Type.Literal('warn'),
        Type.Literal('info'),
        Type.Literal('debug'),
        Type.Literal('trace'),
        Type.Literal('silent'),
      ],
      { default: 'info' }
    ),
    MONGODB_URI: Type.String({ minLength: 1 }),
    OPENAPI_ENABLED: Type.Boolean({ default: true }),
    CORS_ORIGINS: Type.String({ default: '' }),
  },
  { additionalProperties: false }
);

type RawEnvironment = Type.Static<typeof EnvironmentSchema>;

export interface AppConfig {
  nodeEnv: RawEnvironment['NODE_ENV'];
  host: string;
  port: number;
  logLevel: RawEnvironment['LOG_LEVEL'];
  mongodbUri: string;
  openapiEnabled: boolean;
  corsOrigins: string[];
  autoIndex: boolean;
}

export function loadConfig(data: Record<string, string | undefined> = process.env, dotenv: boolean = true): AppConfig {
  const environment = envSchema<RawEnvironment>({
    schema: EnvironmentSchema,
    data,
    dotenv,
  });

  return {
    nodeEnv: environment.NODE_ENV,
    host: environment.HOST,
    port: environment.PORT,
    logLevel: environment.LOG_LEVEL,
    mongodbUri: environment.MONGODB_URI,
    openapiEnabled: environment.OPENAPI_ENABLED,
    corsOrigins: environment.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    autoIndex: environment.NODE_ENV !== 'production',
  };
}
