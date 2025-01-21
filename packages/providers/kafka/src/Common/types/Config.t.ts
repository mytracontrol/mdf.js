/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { KafkaJS } from '@confluentinc/kafka-javascript';
export interface BaseConfig {
  /** Kafka client configuration options */
  client: KafkaJS.CommonConstructorConfig & { kafkaJS: KafkaJS.KafkaConfig };
  /** Period of health check interval */
  interval?: number;
}
