/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';
const MECHANISM_TYPES = ['plain', 'scram-sha-256', 'scram-sha-512'];

export const schema = Joi.object({
  client: Joi.object({
    kafkaJS: Joi.object({
      clientId: Joi.string(),
      brokers: Joi.array().items(Joi.string()),
      ssl: Joi.boolean(),
      sasl: Joi.alternatives().conditional('ssl', {
        is: true,
        then: Joi.object({
          mechanism: Joi.string()
            .allow(...MECHANISM_TYPES)
            .required(),
          username: Joi.when('mechanism', {
            is: Joi.string().regex(/^(plain|scram-sha-256|scram-sha-512)$/i),
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
          }),
          password: Joi.when('mechanism', {
            is: Joi.string().regex(/^(plain|scram-sha-256|scram-sha-512)$/i),
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
          }),
        }),
        otherwise: Joi.forbidden(),
      }),
      connectionTimeout: Joi.number().positive(),
      authenticationTimeout: Joi.number().positive(),
      reauthenticationThreshold: Joi.number().positive(),
      requestTimeout: Joi.number().positive(),
      enforceRequestTimeout: Joi.boolean(),
      retry: Joi.object({
        maxRetryTime: Joi.number().positive(),
        initialRetryTime: Joi.number().positive(),
        retries: Joi.number().unsafe().positive(),
      }),
      logLevel: Joi.number().min(0).max(5),
    }).unknown(true),
    ca: Joi.array().optional(),
    key: Joi.binary().optional(),
    cert: Joi.binary().optional(),
  }).unknown(true),
  consumer: Joi.object({
    groupId: Joi.string(),
    sessionTimeout: Joi.number().min(0),
    rebalanceTimeout: Joi.number().min(0),
    heartbeatInterval: Joi.number().min(0),
    metadataMaxAge: Joi.number().min(0),
    allowAutoTopicCreation: Joi.boolean(),
    maxBytesPerPartition: Joi.number().min(0),
    minBytes: Joi.number().min(1),
    maxBytes: Joi.number().min(1),
    maxWaitTimeInMs: Joi.number().min(1),
    retry: Joi.object({
      maxRetryTime: Joi.number().min(1),
      initialRetryTime: Joi.number().min(1),
      retries: Joi.number().min(1),
    }).default(),
    readUncommitted: Joi.boolean(),
    maxInFlightRequests: Joi.number(),
    rackId: Joi.string(),
  }).unknown(true),
}).unknown(true);
