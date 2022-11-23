/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { LoggerInstance } from '@mdf.js/provider';
import { Sender } from '../Client';
import { BasePort } from '../Common';
import { AwaitableSender as RheaSender, Config } from './types';

export class Port extends BasePort<RheaSender> {
  /**
   * Implementation of functionalities of an AMQP Sender port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, new Sender(config));
  }
}
