import { SocketType } from 'dgram';
import { Varbind } from '../varbind.interfaces';

export interface SessionOptions {
  port?: number;
  retries?: number;
  sourceAddress?: string;
  sourcePort?: string;
  timeout?: number;
  backoff?: number;
  transport?: SocketType;
  trapPort?: number;
  version?: number;
  backwardsGetNexts?: boolean;
  reportOidMismatchErrors?: boolean;
  idBitsSize?: number;
}

export interface SessionV3Options extends SessionOptions {
  context?: string; // v3
  engineID?: string; // TODO: Check doc
}

export interface MsgSecurityParameters {
  msgAuthoritativeEngineID: string;
  msgAuthoritativeEngineBoots: number;
  msgAuthoritativeEngineTime: number;
  msgUserName?: string;
  msgAuthenticationParameters?: string;
  msgPrivacyParameters?: string;
}

export type InformCallback = (error: Error | null, varbinds?: (Varbind | Varbind[])[]) => void;
export type DoneCallback = (error: Error | null) => void;
export type TableResponseCallback = (error: Error | null, table?: string[]) => void;
export type TrapResponseCallback = (error: Error | null) => void;
export type WalkFeedCallback = (varbinds: Varbind[]) => void | boolean;
export type WalkDoneCallback = (error: Error | null) => void;
