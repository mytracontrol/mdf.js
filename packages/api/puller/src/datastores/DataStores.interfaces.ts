import { Redis } from 'ioredis';
import { IORedisConnection } from '../ioRedisConnection/IORedisConnection';

export interface RegistrationResult {
  success: boolean;
  wait?: number;
  reservoir?: any;
}

export interface SubmissionResult {
  reachedHWM: boolean;
  blocked: boolean;
  strategy: number;
}

export interface FreeResult {
  running: number;
}

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

export interface RedisStoreOptionsComplete {
  timeout: number | null;
  heartbeatInterval: number;
  clientTimeout: number;
  client: Redis | null;
  clearDatastore: boolean;
  connection: IORedisConnection | null;
}

export interface RedisStoreOptions {
  timeout?: number;
  heartbeatInterval?: number;
  clientTimeout?: number;
  client?: Redis;
  clearDatastore?: boolean;
  connection?: any;
}

export interface LocalStoreOptionsComplete {
  timeout: number | null;
  heartbeatInterval: number;
}

export interface LocalStoreOptions {
  timeout?: number;
  heartbeatInterval?: number;
}
