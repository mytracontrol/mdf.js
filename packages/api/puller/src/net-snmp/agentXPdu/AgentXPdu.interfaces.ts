import { Varbind } from '../varbind.interface';
import { AgentXPdu } from './AgentXPdu';

export interface AgentXPduCreateVars {
  flags?: number;
  oid?: string;
  pduType?: number;
  sessionID?: number;
  transactionID?: number;
  packetID?: number;
  timeout?: number;
  descr?: string;
  priority?: number;
  rangeSubid?: number;
  sysUpTime?: number;
  index?: number;
  error?: number;
  varbinds?: Varbind[];
}

export interface AgentXPduSearchRange {
  start: string;
  end: string;
  // oid?: string;
}

export type AgentXPduSendCallback = (error: Error | null, response?: AgentXPdu) => void;
