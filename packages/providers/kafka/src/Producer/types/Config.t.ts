/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { KafkaConfig, ProducerConfig } from 'kafkajs';
export interface Config {
  /** Kafka client configuration options */
  client: KafkaConfig;
  /** Kafka producer configuration options */
  producer?: ProducerConfig;
  /** Period of health check interval */
  interval?: number;
}
