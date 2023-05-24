/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SocketIOClient } from '@mdf.js/socket-client-provider';
export * from './SocketIOConsumerAdapter';
export * from './SocketIOProducerAdapter';
export type Config = SocketIOClient.Config;
