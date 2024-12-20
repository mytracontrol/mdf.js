/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { LoggerInstance } from '@mdf.js/logger';
import { Receiver } from '../Client';
import { BasePort } from '../Common';
import { Config, Receiver as RheaReceiver } from './types';

/** Implementation of an AMQP Receiver port instance */
export class Port extends BasePort<RheaReceiver> {
  /**
   * Implementation of functionalities of an AMQP Receiver port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, new Receiver(config));
  }
}

