/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import {
  CONFIG_ARTIFACT_ID,
  NODE_APP_INSTANCE,
  defaultConfig as commonDefaultConfig,
} from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Default values

const DEFAULT_CONFIG_AMQP_RECEIVER_SETTLE_MODE = 0;
const DEFAULT_CONFIG_AMQP_RECEIVER_CREDIT_WINDOW = 0;
const DEFAULT_CONFIG_AMQP_RECEIVER_AUTO_ACCEPT = false;
const DEFAULT_CONFIG_AMQP_RECEIVER_AUTO_SETTLE = true;

export const defaultConfig: Config = {
  ...commonDefaultConfig,
  receiver_options: {
    name: NODE_APP_INSTANCE || CONFIG_ARTIFACT_ID,
    rcv_settle_mode: DEFAULT_CONFIG_AMQP_RECEIVER_SETTLE_MODE,
    credit_window: DEFAULT_CONFIG_AMQP_RECEIVER_CREDIT_WINDOW,
    autoaccept: DEFAULT_CONFIG_AMQP_RECEIVER_AUTO_ACCEPT,
    autosettle: DEFAULT_CONFIG_AMQP_RECEIVER_AUTO_SETTLE,
  },
};
// #endregion

