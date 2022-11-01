/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
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
