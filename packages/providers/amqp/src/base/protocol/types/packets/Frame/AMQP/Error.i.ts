/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ErrorCondition } from '../../../ErrorConditions.t';

/**
 * Error field for AMQP.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-types-v1.0-os.html#type-error
 */
export interface Error {
  /** A symbolic value indicating the error condition. */
  condition: ErrorCondition;
  /**
   * This text supplies any supplementary details not indicated by the condition field.
   * This text can be logged as an aid to resolving issues.
   */
  description?: string;
  /** A map containing additional error information. */
  info?: Record<string, any>;
}
