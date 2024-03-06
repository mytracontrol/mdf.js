/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { InstanceOptions } from '.';
import { StopOptions } from './types';

/** Default version of the bottleneck library */
export const BOTTLENECK_VERSION = '2.19.5';

/** Strategies to execute when high-water mark is reached */
export const enum STRATEGY {
  LEAK = 1,
  OVERFLOW = 2,
  BLOCK = 3,
  OVERFLOW_PRIORITY = 4,
}

/** Default values for the Bottleneck Instance options */
export const INSTANCE_DEFAULTS: InstanceOptions = {
  datastore: 'local',
  connection: null,
  id: '<no-id>',
  rejectOnDrop: true,
  trackDoneStatus: false,
};

/** Default values for the Bottleneck Stop options */
export const STOP_DEFAULTS: StopOptions = {
  enqueueErrorMessage: 'This limiter has been stopped and cannot accept new jobs.',
  dropWaitingJobs: true,
  dropErrorMessage: 'This limiter has been stopped.',
};
