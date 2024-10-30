/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { CrashObject, MultiObject } from '@mdf.js/crash';

/** Extended Crash object including workerId, workerPid and stack */
export interface ExtendedCrashObject extends CrashObject {
  workerId?: number;
  workerPid?: number;
  stack?: string;
}
/** Extended Multi object including workerId, workerPid and stack */
export interface ExtendedMultiObject extends MultiObject {
  workerId?: number;
  workerPid?: number;
  stack?: string;
}

/** Error record */
export type ErrorRecord = ExtendedCrashObject | ExtendedMultiObject;
