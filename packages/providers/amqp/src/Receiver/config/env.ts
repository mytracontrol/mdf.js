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
const CONFIG_AMQP_RECEIVER_NAME = process.env['CONFIG_AMQP_RECEIVER_NAME'];
/**
 * It specifies the receiver settle mode with following possible values:
 * - 0 - "first" - The receiver will spontaneously settle all incoming transfers.
 * - 1 - "second" - The receiver will only settle after sending the disposition to the sender and
 * receiving a disposition indicating settlement of the delivery from the sender.
 * @defaultValue 0
 */
const CONFIG_AMQP_RECEIVER_SETTLE_MODE = coerce<0 | 1>(
  process.env['CONFIG_AMQP_RECEIVER_SETTLE_MODE']
);
/**
 * A "prefetch" window controlling the flow of messages over this receiver. Defaults to `1000` if
 * not specified. A value of `0` can be used to turn off automatic flow control and manage it
 * directly.
 * @defaultValue 0
 */
const CONFIG_AMQP_RECEIVER_CREDIT_WINDOW = coerce<number>(
  process.env['CONFIG_AMQP_RECEIVER_CREDIT_WINDOW']
);
/**
 * Whether received messages should be automatically accepted.
 * @defaultValue false
 */
const CONFIG_AMQP_RECEIVER_AUTO_ACCEPT = coerce<boolean>(
  process.env['CONFIG_AMQP_RECEIVER_AUTO_ACCEPT']
);
/**
 * Whether received messages should be automatically settled once the remote settles them.
 * @defaultValue true
 */
const CONFIG_AMQP_RECEIVER_AUTO_SETTLE = coerce<boolean>(
  process.env['CONFIG_AMQP_RECEIVER_AUTO_SETTLE']
);

export const envBasedConfig: Config = {
  ...commonEnvBasedConfig,
  receiver_options: {
    name: CONFIG_AMQP_RECEIVER_NAME,
    rcv_settle_mode: CONFIG_AMQP_RECEIVER_SETTLE_MODE,
    credit_window: CONFIG_AMQP_RECEIVER_CREDIT_WINDOW,
    autoaccept: CONFIG_AMQP_RECEIVER_AUTO_ACCEPT,
    autosettle: CONFIG_AMQP_RECEIVER_AUTO_SETTLE,
  },
};
// #endregion
