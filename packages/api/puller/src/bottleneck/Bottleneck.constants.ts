import { InstanceOptions, StopOptions } from './Bottleneck.interfaces';

export const BOTTLENECK_VERSION = '2.19.5';

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

export const STOP_DEFAULTS: StopOptions = {
  enqueueErrorMessage: 'This limiter has been stopped and cannot accept new jobs.',
  dropWaitingJobs: true,
  dropErrorMessage: 'This limiter has been stopped.',
};
