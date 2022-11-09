/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ConnectionOptions } from 'rhea-promise';
/** Artemis monitor interface */
export interface ArtemisMonitor {
  /** Artermis check interval in milliseconds. Default: `10000` */
  interval?: number;
  /** Artermis Broker URL. Default: http://127.0.0.1:8161/console/jolokia */
  url?: string;
  /**
   * Specific bean configuration to perform the request. Default: if its not configured, the beam
   * is created by the combination of `brokerName`, `address`, `routing-type` and "queue"
   */
  mbean?: string;
  /** Broker name. Default: `*` */
  brokerName?: string;
  /**
   * Address to check. Default: if its not configured, the address is extracted from the receiver
   * address configuration.
   */
  address?: string;
  /** Routing type. Default: `*` */
  routingType?: string;
  /**
   * Queue to check. Default: if its not configured, the address is extracted from the receiver
   * address configuration.
   */
  queueName?: string;
  /** User name to use for the request */
  username?: string;
  /** Password to use for the check request */
  password?: string;
  /** Request timeout in milliseconds. Default: `1000` */
  timeout?: number;
}
export interface Config extends ConnectionOptions {
  /** Artermis check configuration */
  monitor?: ArtemisMonitor;
}
