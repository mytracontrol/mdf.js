/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export const METRIC_TYPES = ['Counter', 'Gauge', 'Histogram', 'Summary'] as const;
export type MetricType = typeof METRIC_TYPES[number];
