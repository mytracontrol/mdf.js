/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Adapters } from '@mdf.js/openc2';

/**
 * Consumer adapter options: Redis or SocketIO. In order to configure the consumer instance,
 * `consumer` and `adapter` options must be provided, in other case the consumer will not be
 * started.
 */
export type ConsumerAdapterOptions =
  | {
      /** Adapter type: Redis */
      type: 'redis';
      /** Redis adapter configuration */
      config?: Adapters.Redis.Config;
    }
  | {
      /** Adapter type: SocketIO */
      type: 'socketIO';
      /** SocketIO adapter configuration */
      config?: Adapters.SocketIO.Config;
    };
