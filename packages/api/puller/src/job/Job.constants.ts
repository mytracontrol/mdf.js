import { JobOptionsComplete } from './Job.interfaces';

export const NUM_PRIORITIES = 10;
export const DEFAULT_PRIORITY = 5;

export const JOB_DEFAULTS: JobOptionsComplete = {
  priority: DEFAULT_PRIORITY,
  weight: 1,
  expiration: null,
  id: '<no-id>',
};
