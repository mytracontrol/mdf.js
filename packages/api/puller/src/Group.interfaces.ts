import { Bottleneck } from './Bottleneck';

export interface Limiter {
  key: string;
  limiter: Bottleneck;
}

export interface GroupOptions {
  timeout?: number | null;
  connection?: any | null;
  id?: string;
}
