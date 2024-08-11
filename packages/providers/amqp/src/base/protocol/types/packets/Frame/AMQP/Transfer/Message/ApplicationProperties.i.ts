/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * Application Properties section for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-application-properties
 * The application-properties section is a part of the bare message used for structured application
 * data. Intermediaries can use the data within this structure for the purposes of filtering or
 * routing.
 * The keys of this map are restricted to be of type string (which excludes the possibility of a
 * null key) and the values are restricted to be of simple types only, that is, excluding map, list,
 * and array types.
 */
export interface ApplicationProperties extends Section {
  /** Application properties */
  value: Record<string, unknown>;
}
