/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Redis } from '@mdf.js/redis-provider';
import { SocketIOClient } from '@mdf.js/socket-client-provider';
import { SocketIOServer } from '@mdf.js/socket-server-provider';

export type RedisClientOptions = Redis.Config;
export type SocketIOClientOptions = SocketIOClient.Config;
export type SocketIOServerOptions = SocketIOServer.Config;
