/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { CrashObject, MultiObject } from '@mdf.js/crash';

interface ExtendedCrashObject extends CrashObject {
  workerId?: number;
  workerPid?: number;
  stack?: string;
}
interface ExtendedMultiObject extends MultiObject {
  workerId?: number;
  workerPid?: number;
  stack?: string;
}

export type ErrorRecord = ExtendedCrashObject | ExtendedMultiObject;
