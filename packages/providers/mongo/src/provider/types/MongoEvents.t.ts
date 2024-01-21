/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export const MONGO_CLIENT_EVENTS = [
  'connectionPoolCreated',
  'connectionPoolReady',
  'connectionPoolCleared',
  'connectionPoolClosed',
  'connectionCreated',
  'connectionReady',
  'connectionClosed',
  'connectionCheckOutStarted',
  'connectionCheckOutFailed',
  'connectionCheckedOut',
  'connectionCheckedIn',
  'commandStarted',
  'commandSucceeded',
  'commandFailed',
  'serverOpening',
  'serverClosed',
  'serverDescriptionChanged',
  'topologyOpening',
  'topologyClosed',
  'topologyDescriptionChanged',
  'error',
  'timeout',
  'close',
  'serverHeartbeatStarted',
  'serverHeartbeatSucceeded',
  'serverHeartbeatFailed',
];
