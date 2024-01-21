/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { CONFIG_PROVIDER_BASE_NAME } from '.';
import { defaultConfig } from './default';
// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()} Receiver`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        container_id: 'mdf-amqp',
        host: '127.0.0.1',
        initial_reconnect_delay: 30000,
        max_reconnect_delay: 10000,
        non_fatal_errors: ['amqp:connection:forced'],
        port: 5672,
        receiver_options: {
          autoaccept: false,
          autosettle: true,
          credit_window: 0,
          rcv_settle_mode: 0,
        },
        reconnect: 5000,
        transport: 'tcp',
        username: 'consumer',
      });
    }, 300);
  });
});

// #endregion
