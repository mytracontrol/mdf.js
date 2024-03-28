/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export * from './Config.i';
export * from './InstancesObject.t';
export * from './Registry.i';
export * from './Response.i';
export * from './Type.t';

export {
  Counter,
  Gauge,
  Histogram,
  Metric,
  MetricObjectWithValues,
  MetricValue,
  Summary,
} from 'prom-client';
