/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { InMemoryStore, RedisStore } from '@socket.io/admin-ui';

/** The basic authentication method */
export interface BasicAuthentication {
  type: 'basic';
  username: string;
  password: string;
}

/** The instrument options */
export interface InstrumentOptions {
  /**
   * The name of the admin namespace
   * @defaultValue "/admin"
   */
  namespaceName: string;
  /** The authentication method */
  auth?: false | BasicAuthentication;
  /**
   * Whether updates are allowed
   * @defaultValue false
   */
  readonly: boolean;
  /**
   * The unique ID of the server
   * @defaultValue `require("os").hostname()`
   */
  serverId?: string;
  /** The store */
  store: InMemoryStore | RedisStore;
  /** Whether to send all events or only aggregated events to the UI, for performance purposes. */
  mode: 'development' | 'production';
}
