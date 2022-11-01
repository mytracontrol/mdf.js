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
import { InMemoryStore, RedisStore } from '@socket.io/admin-ui';

interface BasicAuthentication {
  type: 'basic';
  username: string;
  password: string;
}

export interface InstrumentOptions {
  /**
   * The name of the admin namespace
   * @default "/admin"
   */
  namespaceName: string;
  /** The authentication method */
  auth?: false | BasicAuthentication;
  /**
   * Whether updates are allowed
   * @default false
   */
  readonly: boolean;
  /**
   * The unique ID of the server
   * @default `require("os").hostname()`
   */
  serverId?: string;
  /** The store */
  store: InMemoryStore | RedisStore;
  /** Whether to send all events or only aggregated events to the UI, for performance purposes. */
  mode: 'development' | 'production';
}
