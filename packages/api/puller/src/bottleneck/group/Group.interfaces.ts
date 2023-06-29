/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Bottleneck } from '../bottleneck';

/** Limiter representation used by Group */
export interface Limiter {
  key: string;
  limiter: Bottleneck;
}

/** Group options */
export interface GroupOptions {
  timeout?: number;
  connection?: any | null;
  id?: string;
}

/** Group options complete */
export interface GroupOptionsComplete {
  timeout: number;
  connection: any | null;
  id: string;
}
