import { Type } from '@fastify/type-provider-typebox';

export const LiveHealthSchema = Type.Object(
  {
    status: Type.Literal('ok'),
  },
  { additionalProperties: false }
);

export const ReadyHealthSchema = Type.Object(
  {
    status: Type.Literal('ready'),
  },
  { additionalProperties: false }
);

export const UnavailableHealthSchema = Type.Object(
  {
    status: Type.Literal('unavailable'),
  },
  { additionalProperties: false }
);
