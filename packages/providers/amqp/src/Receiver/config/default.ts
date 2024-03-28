/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { CONFIG_ARTIFACT_ID, defaultConfig as commonDefaultConfig } from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Default values

const AMQP_RECEIVER_SETTLE_MODE = 0;
const AMQP_RECEIVER_CREDIT_WINDOW = 0;
const AMQP_RECEIVER_AUTO_ACCEPT = false;
const AMQP_RECEIVER_AUTO_SETTLE = true;

export const defaultConfig: Config = {
  ...commonDefaultConfig,
  receiver_options: {
    name: CONFIG_ARTIFACT_ID,
    rcv_settle_mode: AMQP_RECEIVER_SETTLE_MODE,
    credit_window: AMQP_RECEIVER_CREDIT_WINDOW,
    autoaccept: AMQP_RECEIVER_AUTO_ACCEPT,
    autosettle: AMQP_RECEIVER_AUTO_SETTLE,
  },
};
// #endregion
