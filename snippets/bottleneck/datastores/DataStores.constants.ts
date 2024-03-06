/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { LocalStoreOptionsComplete, RedisStoreOptionsComplete, StoreOptionsComplete } from '.';
import { STRATEGY } from '../bottleneck/Bottleneck.constants';

/** Default values for Bottleneck store */
export const STORE_DEFAULTS: StoreOptionsComplete = {
  maxConcurrent: null,
  minTime: 0,
  highWater: null,
  strategy: STRATEGY.LEAK,
  penalty: null,
  reservoir: null,
  reservoirRefreshInterval: null,
  reservoirRefreshAmount: null,
  reservoirIncreaseInterval: null,
  reservoirIncreaseAmount: null,
  reservoirIncreaseMaximum: null,
};

/** Default values for Redis Store */
export const REDIS_STORE_DEFAULTS: RedisStoreOptionsComplete = {
  timeout: null,
  heartbeatInterval: 5000,
  clientTimeout: 10000,
  client: null,
  clearDatastore: false,
  connection: null,
};

/** Default values for Local Store */
export const LOCAL_STORE_DEFAULTS: LocalStoreOptionsComplete = {
  timeout: null,
  heartbeatInterval: 250,
};
