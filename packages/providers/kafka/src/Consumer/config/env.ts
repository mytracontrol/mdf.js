/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { envBasedConfig as commonEnvBaseConfig } from '../../Common';
import { Config as ConsumerConfig } from '../types';

// *************************************************************************************************
// #region Environment variables - Kafka Consumer general configuration
const CONFIG_KAFKA_CONSUMER__GROUP_ID = process.env['CONFIG_KAFKA_CONSUMER__GROUP_ID'];
const CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT']
);
const CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT']
);
const CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL']
);
const CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE']
);
const CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION = coerce<boolean>(
  process.env['CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION']
);
const CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION']
);
const CONFIG_KAFKA_CONSUMER__MIN_BYTES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MIN_BYTES']
);
const CONFIG_KAFKA_CONSUMER__MAX_BYTES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_BYTES']
);
const CONFIG_KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER_MAX_WAIT_TIME_IN_MS']
);
const CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME']
);
const CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME']
);
const CONFIG_KAFKA_CONSUMER__RETRY__FACTOR = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__FACTOR']
);
const CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER']
);
const CONFIG_KAFKA_CONSUMER__RETRY__RETRIES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__RETRIES']
);
const CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED = coerce<boolean>(
  process.env['CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED']
);
const CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST']
);
const CONFIG_KAFKA_CONSUMER__RACK_ID = process.env['CONFIG_KAFKA_CONSUMER__RACK_ID'];
// #endregion

export const envBasedConfig: ConsumerConfig = {
  ...commonEnvBaseConfig,
  consumer: {
    groupId: CONFIG_KAFKA_CONSUMER__GROUP_ID as string,
    sessionTimeout: CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT,
    rebalanceTimeout: CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT,
    heartbeatInterval: CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL,
    metadataMaxAge: CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE,
    allowAutoTopicCreation: CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION,
    maxBytesPerPartition: CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION,
    minBytes: CONFIG_KAFKA_CONSUMER__MIN_BYTES,
    maxBytes: CONFIG_KAFKA_CONSUMER__MAX_BYTES,
    maxWaitTimeInMs: CONFIG_KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS,
    retry: {
      maxRetryTime: CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME,
      initialRetryTime: CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME,
      factor: CONFIG_KAFKA_CONSUMER__RETRY__FACTOR,
      multiplier: CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER,
      retries: CONFIG_KAFKA_CONSUMER__RETRY__RETRIES,
    },
    readUncommitted: CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED,
    maxInFlightRequests: CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST,
    rackId: CONFIG_KAFKA_CONSUMER__RACK_ID,
  },
};

