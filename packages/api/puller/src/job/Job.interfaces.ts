/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BottleneckError } from '../bottleneckError/BottleneckError';

/** Drop options */
export interface DropOptions {
  error?: Error | BottleneckError;
  message?: string;
}

/** Job options */
export interface JobOptions {
  priority?: number;
  weight?: number;
  expiration?: number | null;
  id?: string;
}

/** Job options complete */
export interface JobOptionsComplete {
  priority: number;
  weight: number;
  expiration: number | null;
  id: string;
}

/** Job event info */
export interface JobEventInfo {
  args: any[];
  options: JobOptionsComplete;
  retryCount: number;
}
