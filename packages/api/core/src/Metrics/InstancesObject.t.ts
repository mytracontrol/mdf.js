/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Metric } from 'prom-client';

export type InstancesObject<T, K> = T extends void
  ? Record<keyof K, Metric>
  : T extends Record<string, Metric>
    ? T
    : never;
