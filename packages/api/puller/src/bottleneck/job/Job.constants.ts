/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { JobOptionsComplete } from '.';
import { DEFAULT_PRIORITY } from '../bottleneck';

/** Default values for Job */
export const JOB_DEFAULTS: JobOptionsComplete = {
  priority: DEFAULT_PRIORITY,
  weight: 1,
  expiration: null,
  id: '<no-id>',
};
