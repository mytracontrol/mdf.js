/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { HealthMessageType } from './HealthMessageType.t';

/** Interface for health message interchange service */
export interface HealthMessage {
  type: HealthMessageType;
  requestId: number;
  checks: Health.API.Checks;
}
