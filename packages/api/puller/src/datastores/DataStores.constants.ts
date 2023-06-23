import { STRATEGY } from '../bottleneck/Bottleneck.constants';
import {
  LocalStoreOptionsComplete,
  RedisStoreOptionsComplete,
  StoreOptionsComplete,
} from './DataStores.interfaces';

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

export const REDIS_STORE_DEFAULTS: RedisStoreOptionsComplete = {
  timeout: null,
  heartbeatInterval: 5000,
  clientTimeout: 10000,
  client: null,
  clearDatastore: false,
  connection: null,
};

export const LOCAL_STORE_DEFAULTS: LocalStoreOptionsComplete = {
  timeout: null,
  heartbeatInterval: 250,
};
