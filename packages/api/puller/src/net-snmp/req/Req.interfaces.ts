import { Message } from '../message';
import { ResponseVarbind } from '../varbind.interfaces';
import { Req } from './Req';

export interface ReqOptions {
  port?: number;
  nonRepeaters?: number;
  maxRepetitions?: number;
}

export type ResponseCallback = (
  error: Error | null,
  varbinds?: (ResponseVarbind | ResponseVarbind[])[]
) => void;
// export type FeedCallback = ((req: Req, message: Message) => void) & ((varbinds: Varbind[]) => void);
export type FeedCallback = (req: Req, message: Message) => void;
