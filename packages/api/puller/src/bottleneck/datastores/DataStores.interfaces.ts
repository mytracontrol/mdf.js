/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Redis } from 'ioredis';
import { IORedisConnection } from '../ioRedisConnection';

/** Result of register operation */
export interface RegistrationResult {
  success: boolean;
  wait?: number;
  reservoir?: any;
}

/** Result of submit operation */
export interface SubmissionResult {
  reachedHWM: boolean;
  blocked: boolean;
  strategy: number;
}

/** Result of free operation */
export interface FreeResult {
  running: number;
}

/** Store options complete */
export interface StoreOptionsComplete {
  maxConcurrent: number | null;
  minTime: number;
  highWater: number | null;
  strategy: number;
  penalty: number | null;
  reservoir: number | null;
  reservoirRefreshAmount: number | null;
  reservoirRefreshInterval: number | null;
  reservoirIncreaseInterval: number | null;
  reservoirIncreaseAmount: number | null;
  reservoirIncreaseMaximum: number | null;
}

/** Store options */
export interface StoreOptions {
  maxConcurrent?: number;
  minTime?: number;
  highWater?: number;
  strategy?: number;
  penalty?: number;
  reservoir?: number;
  reservoirRefreshAmount?: number;
  reservoirRefreshInterval?: number;
  reservoirIncreaseInterval?: number;
  reservoirIncreaseAmount?: number;
  reservoirIncreaseMaximum?: number;
}

/** Redis store options complete */
export interface RedisStoreOptionsComplete {
  timeout: number | null;
  heartbeatInterval: number;
  clientTimeout: number;
  client: Redis | null;
  clearDatastore: boolean;
  connection: IORedisConnection | null;
}

/** Redis store options */
export interface RedisStoreOptions {
  timeout?: number;
  heartbeatInterval?: number;
  clientTimeout?: number;
  client?: Redis;
  clearDatastore?: boolean;
  connection?: any;
}

/** Local store options complete */
export interface LocalStoreOptionsComplete {
  timeout: number | null;
  heartbeatInterval: number;
}

/** Local store options */
export interface LocalStoreOptions {
  timeout?: number;
  heartbeatInterval?: number;
}
