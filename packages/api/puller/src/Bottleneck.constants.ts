import {
  InstanceOptions,
  LocalStoreOptions,
  RedisStoreOptions,
  StopOptions,
  StoreOptions,
} from './Bottleneck.interfaces';

export const NUM_PRIORITIES = 10;
export const DEFAULT_PRIORITY = 5;
export const STATES_NAMES = ['RECEIVED', 'QUEUED', 'RUNNING', 'EXECUTING'];
export const enum STRATEGY {
  LEAK = 1,
  OVERFLOW = 2,
  BLOCK = 3,
  OVERFLOW_PRIORITY = 4,
}
export const INSTANCE_DEFAULTS: InstanceOptions = {
  datastore: 'local',
  connection: null,
  id: '<no-id>',
  rejectOnDrop: true,
  trackDoneStatus: false,
};

export const STORE_DEFAULTS: StoreOptions = {
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

export const LOCAL_STORE_DEFAULTS: LocalStoreOptions = {
  timeout: null,
  heartbeatInterval: 250,
};

export const REDIS_STORE_DEFAULTS: RedisStoreOptions = {
  timeout: null,
  heartbeatInterval: 5000,
  clientTimeout: 10000,
  client: null,
  clearDatastore: false,
  connection: null,
};

export const STOP_DEFAULTS: StopOptions = {
  enqueueErrorMessage: 'This limiter has been stopped and cannot accept new jobs.',
  dropWaitingJobs: true,
  dropErrorMessage: 'This limiter has been stopped.',
};
