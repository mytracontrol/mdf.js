/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { KafkaConfig } from 'kafkajs';
export interface BaseConfig {
  /** Kafka client configuration options */
  client: KafkaConfig;
  /** Period of health check interval */
  interval?: number;
}
