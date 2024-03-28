/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Type } from './Type.t';

/** Metric configuration options */
export interface Config {
  /** Metric type */
  type: Type;
  /** Name of metric, check this: https://prometheus.io/docs/practices/naming/  */
  name: string;
  /** Metric description  */
  help: string;
  /** Labels */
  labelNames?: string[];
  /** Buckets */
  buckets?: number[];
}
