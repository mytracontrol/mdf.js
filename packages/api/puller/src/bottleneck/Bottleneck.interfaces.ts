import { BatcherOptions } from '../batcher/Batcher.interfaces';
import {
  LocalStoreOptions,
  RedisStoreOptions,
  StoreOptions,
} from '../datastores/DataStores.interfaces';
import { GroupOptions } from '../group/Group.interfaces';
import { IORedisConnection } from '../ioRedisConnection/IORedisConnection';
import { Job } from '../job/Job';

export interface BottleneckOptions
  extends StoreOptions,
    InstanceOptions,
    LocalStoreOptions,
    RedisStoreOptions,
    GroupOptions,
    BatcherOptions {}

export interface BottleneckOptionsComplete {
  // Instance options
  datastore: string;
  connection: IORedisConnection | null;
  id: string;
  rejectOnDrop: boolean;
  trackDoneStatus: boolean;
}

export interface InstanceOptions {
  datastore?: string;
  connection?: any | null;
  id?: string;
  rejectOnDrop?: boolean;
  trackDoneStatus?: boolean;
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
