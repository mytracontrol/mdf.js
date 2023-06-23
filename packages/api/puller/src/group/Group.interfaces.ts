import { Bottleneck } from '../bottleneck/Bottleneck';

export interface Limiter {
  key: string;
  limiter: Bottleneck;
}

export interface GroupOptions {
  timeout?: number;
  connection?: any | null;
  id?: string;
}

export interface GroupOptionsComplete {
  timeout: number;
  connection: any | null;
  id: string;
}
