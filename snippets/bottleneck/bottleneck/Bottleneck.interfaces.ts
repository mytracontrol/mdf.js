/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { LocalStoreOptions, RedisStoreOptions, StoreOptions } from '../datastores';
import { GroupOptions } from '../group';
import { IORedisConnection } from '../ioRedisConnection';
import { Job } from './Job';
import { BatcherOptions } from './types';

/** Bottleneck options */
export interface BottleneckOptions
  extends StoreOptions,
    InstanceOptions,
    LocalStoreOptions,
    RedisStoreOptions,
    GroupOptions,
    BatcherOptions {}

/** Bottleneck instance basic options complete*/
export interface InstanceOptionsComplete {
  datastore: string;
  connection: IORedisConnection | null;
  id: string;
  rejectOnDrop: boolean;
  trackDoneStatus: boolean;
}

/** Bottleneck instance basic options */
export interface InstanceOptions {
  datastore?: string;
  connection?: any | null;
  id?: string;
  rejectOnDrop?: boolean;
  trackDoneStatus?: boolean;
}

/** Bottleneck scheduled item */
export interface ScheduledItem {
  timeout: any;
  expiration: any;
  job: Job;
}
