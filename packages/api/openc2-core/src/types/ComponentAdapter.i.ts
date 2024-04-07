/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';

export declare interface ComponentAdapter {
  /** Emitted when a adapter's operation has some error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
}
export interface ComponentAdapter extends Layer.App.Resource {
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  start(): Promise<void>;
  /** Disconnect the OpenC2 Adapter to the underlayer transport system */
  stop(): Promise<void>;
}
