import { SocketType } from 'dgram';
import { AccessControlModelType, MibProviderType } from '../constants';
import { ListenerFormattedCallbackData } from '../listener/Listener.interfaces';
import { MibNode } from '../mibNode';
import { GetBulkRequestPdu, GetNextRequestPdu, GetRequestPdu, SetRequestPdu } from '../pdu';

export interface AgentOptions {
  port?: number;
  disableAuthorization?: boolean;
  accessControlModelType?: AccessControlModelType;
  engineID: string;
  transport?: SocketType;
  address?: string;
}

export type AgentCallback =
  | ((error: Error | null, data?: ListenerFormattedCallbackData) => void)
  | (() => void);

export type AgentRequestPdu = SetRequestPdu | GetRequestPdu | GetNextRequestPdu | GetBulkRequestPdu;

// TODO: Here? Only used in Agent
export interface CreateScalarInstanceResult {
  instanceNode: MibNode | null;
  providerType: MibProviderType;
}

export interface CreateTableInstanceResult {
  instanceNode: MibNode | null;
  providerType: MibProviderType;
  action: string; // TODO: 'createAndGo' | 'createAndWait', double entry enum
  rowIndex: any[];
  row: any[];
}
