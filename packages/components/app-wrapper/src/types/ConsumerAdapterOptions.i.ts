/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Adapters } from '@mdf.js/openc2';

export type ConsumerAdapterOptions =
  | {
      type: 'redis';
      config: Adapters.Redis.Config;
    }
  | {
      type: 'socketIO';
      config: Adapters.SocketIO.Config;
    };
