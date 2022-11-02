/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface BaseObject {
  /** Name of the error */
  name: string;
  /** Human friendly error message */
  message: string;
  /** Identification of the process, request or transaction where the error appears */
  uuid: string;
  /** Timestamp of the error */
  timestamp: string;
  /** Error subject */
  subject: string;
  /** Extra error information */
  info?: Record<string, unknown>;
}
