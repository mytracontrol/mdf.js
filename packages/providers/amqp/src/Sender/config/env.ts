/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { envBasedConfig as commonEnvBasedConfig } from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Environment variables
/**
 * The name of the link.
 * This should be unique for the container.
 * If not specified a unique name is generated.
 * @defaultValue NODE_APP_INSTANCE || `mdf-amqp`
 */
const CONFIG_AMQP_SENDER_NAME = process.env['CONFIG_AMQP_SENDER_NAME'];
/**
 * It specifies the sender settle mode with following possible values:
 * - 0 - "unsettled" - The sender will send all deliveries initially unsettled to the receiver.
 * - 1 - "settled" - The sender will send all deliveries settled to the receiver.
 * - 2 - "mixed" - (default) The sender MAY send a mixture of settled and unsettled deliveries to the receiver.
 * @defaultValue 2
 */
const CONFIG_AMQP_SENDER_SETTLE_MODE = coerce<0 | 1 | 2>(
  process.env['CONFIG_AMQP_SENDER_SETTLE_MODE']
);
/**
 * Whether sent messages should be automatically settled once the peer settles them.
 * @defaultValue true
 */
const CONFIG_AMQP_SENDER_AUTO_SETTLE = coerce<boolean>(
  process.env['CONFIG_AMQP_SENDER_AUTO_SETTLE']
);

export const envBasedConfig: Config = {
  ...commonEnvBasedConfig,
  sender_options: {
    name: CONFIG_AMQP_SENDER_NAME,
    snd_settle_mode: CONFIG_AMQP_SENDER_SETTLE_MODE,
    autosettle: CONFIG_AMQP_SENDER_AUTO_SETTLE,
  },
};
// #endregion
