/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { hostname } from 'os';
import { defaultConfig as commonDefaultConfig } from '../../Common';
import { Config as ConsumerConfig } from '../types';

// *************************************************************************************************
// #region Default values
const KAFKA_CONSUMER__GROUP_ID = hostname();
const KAFKA_CONSUMER__SESSION_TIMEOUT = 30000;
const KAFKA_CONSUMER__REBALANCE_TIMEOUT = 60000;
const KAFKA_CONSUMER__HEARTBEAT_INTERVAL = 3000;
const KAFKA_CONSUMER__METADATA_MAX_AGE = 300000;
const KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION = true;
const KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION = 1048576;
const KAFKA_CONSUMER__MIN_BYTES = 1;
const KAFKA_CONSUMER__MAX_BYTES = 10485760;
const KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS = 5000;
const KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME = 30000;
const KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME = 300;
const KAFKA_CONSUMER__RETRY__FACTOR = 0.2;
const KAFKA_CONSUMER__RETRY__MULTIPLIER = 2;
const KAFKA_CONSUMER__RETRY__RETRIES = 5;
const KAFKA_CONSUMER__READ_UNCOMMITTED = false;

export const defaultConfig: ConsumerConfig = {
  ...commonDefaultConfig,
  consumer: {
    groupId: KAFKA_CONSUMER__GROUP_ID,
    sessionTimeout: KAFKA_CONSUMER__SESSION_TIMEOUT,
    rebalanceTimeout: KAFKA_CONSUMER__REBALANCE_TIMEOUT,
    heartbeatInterval: KAFKA_CONSUMER__HEARTBEAT_INTERVAL,
    metadataMaxAge: KAFKA_CONSUMER__METADATA_MAX_AGE,
    allowAutoTopicCreation: KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION,
    maxBytesPerPartition: KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION,
    minBytes: KAFKA_CONSUMER__MIN_BYTES,
    maxBytes: KAFKA_CONSUMER__MAX_BYTES,
    maxWaitTimeInMs: KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS,
    retry: {
      maxRetryTime: KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME,
      initialRetryTime: KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME,
      factor: KAFKA_CONSUMER__RETRY__FACTOR,
      multiplier: KAFKA_CONSUMER__RETRY__MULTIPLIER,
      retries: KAFKA_CONSUMER__RETRY__RETRIES,
    },
    readUncommitted: KAFKA_CONSUMER__READ_UNCOMMITTED,
  },
};
// #endregion
