/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Default health check interval */
export const DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL = 10000;
/** Maximum number of notes to be included in the health status */
export const DEFAULT_MAX_NUMBER_OF_NOTES = 20;
/** App health metadata properties */
export const METADATA_PROPERTIES = [
  'name',
  'description',
  'version',
  'release',
  'instanceId',
  'serviceId',
  'serviceGroupId',
  'tags',
  'links',
];
/** Health message types */
export const SYSTEM_WORKER = 'system:workers';
/** Health message types */
export const SYSTEM_WORKER_HEALTH = 'system:workersHealth';
/** Health service name */
export const HEALTH_SERVICE_NAME = 'health';
/** Default cluster mode */
export const DEFAULT_CONFIG_MMS_CLUSTER_MODE = false;
