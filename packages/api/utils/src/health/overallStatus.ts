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
import { Health } from '@mdf/core';

/** Overall component status */
export function overallStatus(checks: Health.API.Checks): Health.API.Status {
  if (Object.values(checks).every(check => check.every(entry => entry.status === 'pass'))) {
    return 'pass';
  } else if (Object.values(checks).some(check => check.some(entry => entry.status === 'fail'))) {
    return 'fail';
  } else {
    return 'warn';
  }
}
