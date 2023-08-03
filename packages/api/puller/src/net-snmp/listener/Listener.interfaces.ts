import { RemoteInfo, SocketType } from 'dgram';
import { Pdu } from '../pdu/pduUtils';

export interface ListenerOptions {
  transport: SocketType;
  port: number;
  address: string | null;
  disableAuthorization: boolean;
}

export interface ListenerFormattedCallbackData {
  pdu: Pdu;
  rinfo: RemoteInfo;
}
