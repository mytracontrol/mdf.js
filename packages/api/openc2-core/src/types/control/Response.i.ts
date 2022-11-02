/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Results, StatusCode } from './common';

/** Response object */
export interface Response {
  /** Map of key:value pairs that contain additional results based on the invoking Command */
  results?: Results;
  /** An integer status code */
  status: StatusCode;
  /** A free-form human-readable description of the Response status */
  status_text?: string;
}
