/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Worker connection state */
export type WorkerConnectionState = 'connected' | 'disconnected';

/** Worker connection state */
export enum WORKER_CONNECTION_STATE {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}
