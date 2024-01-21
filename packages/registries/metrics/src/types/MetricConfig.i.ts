/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { MetricType } from './MetricType.t';

/** Metric configuration options */
export interface MetricConfig {
  /** Metric type */
  type: MetricType;
  /** Name of metric, check this: https://prometheus.io/docs/practices/naming/  */
  name: string;
  /** Metric description  */
  help: string;
  /** Labels */
  labelNames?: string[];
  /** Buckets */
  buckets?: number[];
}
