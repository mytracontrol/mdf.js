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

/**
 * Consumer group id
 * @defaultValue 'hostname()'
 */
const CONFIG_KAFKA_CONSUMER__GROUP_ID = process.env['CONFIG_KAFKA_CONSUMER__GROUP_ID'];
/**
 * The timeout used to detect consumer failures when using Kafka's group management facility.
 * The consumer sends periodic heartbeats to indicate its liveness to the broker.
 * If no heartbeats are received by the broker before the expiration of this session timeout,
 * then the broker will remove this consumer from the group and initiate a rebalance.
 * @defaultValue 30000
 */
const CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT']
);
/**
 * The maximum time that the coordinator will wait for each member to rejoin when rebalancing the group.
 * @defaultValue 60000
 */
const CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT']
);
/**
 * The expected time between heartbeats to the consumer coordinator when using Kafka's group management facility.
 * Heartbeats are used to ensure that the consumer's session stays active and to facilitate rebalancing when new consumers join or leave the group.
 * The value must be set lower than `sessionTimeout`, but typically should be set no higher than 1/3 of that value.
 * It can be adjusted even lower to control the expected time for normal rebalances.
 * @defaultValue 3000
 */
const CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL']
);
/**
 * The period of time in milliseconds after which we force a refresh of metadata even if we haven't seen any partition leadership changes to proactively discover any new brokers or partitions.
 * @defaultValue 300000
 */
const CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE']
);
/**
 * Allow automatic topic creation on the broker when subscribing to or assigning non-existing topics.
 * @defaultValue true
 */
const CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION = coerce<boolean>(
  process.env['CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION']
);
/**
 * The maximum amount of data per-partition the server will return.
 * @defaultValue 1048576
 */
const CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION']
);
/**
 * Minimum amount of data the server should return for a fetch request.
 * If insufficient data is available the request will wait until some is available.
 * @defaultValue 1
 */
const CONFIG_KAFKA_CONSUMER__MIN_BYTES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MIN_BYTES']
);
/**
 * The maximum amount of data the server should return for a fetch request.
 * @defaultValue 10485760
 */
const CONFIG_KAFKA_CONSUMER__MAX_BYTES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_BYTES']
);
/**
 * The maximum amount of time the server will block before answering the fetch request if there isn't sufficient data to immediately satisfy `minBytes`.
 * @defaultValue 5000
 */
const CONFIG_KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER_MAX_WAIT_TIME_IN_MS']
);
/**
 * Maximum time in milliseconds to wait for a successful retry
 * @defaultValue 30000
 */
const CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME']
);
/**
 * Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
 * @defaultValue 300
 */
const CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME']
);
/**
 * A multiplier to apply to the retry time
 * @defaultValue 0.2
 */
const CONFIG_KAFKA_CONSUMER__RETRY__FACTOR = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__FACTOR']
);
/**
 * A multiplier to apply to the retry time
 * @defaultValue 2
 */
const CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER']
);
/**
 * Maximum number of retries per call
 * @defaultValue 5
 */
const CONFIG_KAFKA_CONSUMER__RETRY__RETRIES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__RETRIES']
);
/**
 * Whether to read uncommitted messages
 * @defaultValue false
 */
const CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED = coerce<boolean>(
  process.env['CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED']
);
/**
 * Maximum number of in-flight requests
 * @defaultValue undefined
 */
const CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST']
);
/**
 * The consumer will only be assigned partitions from the leader of the partition to which it is assigned.
 * @defaultValue undefined
 */
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
