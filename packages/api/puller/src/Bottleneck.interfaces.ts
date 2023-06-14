import { BatcherOptions } from './batcher/Batcher.interfaces';
import { GroupOptions } from './Group.interfaces';
import { Job } from './job/Job';

export interface BottleneckOptions
  extends StoreOptions,
    InstanceOptions,
    LocalStoreOptions,
    RedisStoreOptions,
    GroupOptions,
    BatcherOptions {}

export interface StoreOptions {
  maxConcurrent?: number | null;
  minTime?: number;
  highWater?: number | null;
  strategy?: number;
  penalty?: number | null;
  reservoir?: number | null;
  reservoirRefreshAmount?: number | null;
  reservoirRefreshInterval?: number | null;
  reservoirIncreaseInterval?: number | null;
  reservoirIncreaseAmount?: number | null;
  reservoirIncreaseMaximum?: number | null;
}

export interface InstanceOptions {
  datastore?: string;
  connection?: any | null;
  id?: string;
  rejectOnDrop?: boolean;
  trackDoneStatus?: boolean;
}

export interface LocalStoreOptions {
  timeout?: number | null;
  heartbeatInterval?: number;
}

export interface RedisStoreOptions {
  timeout?: number | null;
  heartbeatInterval?: number;
  clientTimeout?: number;
  client?: any;
  clearDatastore?: boolean;
  connection?: any | null;
}

export interface StopOptions {
  enqueueErrorMessage?: string;
  dropWaitingJobs?: boolean;
  dropErrorMessage?: string;
}

export interface ScheduledItem {
  timeout: any;
  expiration: any;
  job: Job;
}
