import { Redis } from 'ioredis';
import { Events } from '../events/Events';

export interface IORedisConnectionOptionsComplete {
  client: Redis | null;
  events: Events | null;
}

export interface IORedisConnectionOptions {
  client: Redis;
  events?: Events;
}

export interface IORedisClients {
  client: Redis;
  subscriber: Redis;
}
