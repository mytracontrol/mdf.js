/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { MetricObjectWithValues, MetricValue } from 'prom-client';

export interface Response {
  /** Grouped metrics */
  metrics: string | MetricObjectWithValues<MetricValue<string>>[];
  /** Content type for HTTP headers */
  contentType: string;
}
