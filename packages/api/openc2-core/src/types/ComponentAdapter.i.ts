/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';

export declare interface ComponentAdapter {
  /** Emitted when a adapter's operation has some error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
}
export interface ComponentAdapter extends Health.Component {
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  start(): Promise<void>;
  /** Disconnect the OpenC2 Adapter to the underlayer transport system */
  stop(): Promise<void>;
}
