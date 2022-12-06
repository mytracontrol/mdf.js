/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export { Counter, Gauge, Histogram, Metric, metric, Summary } from 'prom-client';
export { MetricsFacade as MetricsRegistry } from './MetricsFacade';
export {
  MetricConfig,
  MetricInstancesObject,
  MetricsResponse,
  MetricType,
  METRIC_TYPES,
} from './types';
