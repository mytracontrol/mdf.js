/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ConsumerConfig } from 'kafkajs';
import { BaseConfig } from '../../Common';
export interface Config extends BaseConfig {
  /** Kafka consumer configuration options */
  consumer: ConsumerConfig;
}

