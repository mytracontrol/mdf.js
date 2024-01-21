/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health } from '../';

/** Overall component status */
export function overallStatus(checks: Health.Checks): Health.Status {
  if (Object.values(checks).every(check => check.every(entry => entry.status === 'pass'))) {
    return 'pass';
  } else if (Object.values(checks).some(check => check.some(entry => entry.status === 'fail'))) {
    return 'fail';
  } else {
    return 'warn';
  }
}
