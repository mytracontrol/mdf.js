import { SocketType } from 'dgram';
import { AccessControlModelType } from '../constants';
import { ListenerFormattedCallbackData } from '../listener';

export interface ReceiverOptions {
  port?: number;
  disableAuthorization?: boolean;
  includeAuthentication?: boolean;
  accessControlModelType?: AccessControlModelType;
  engineID?: string;
  address?: string;
  transport?: SocketType;
  context?: string; // TODO: Check, not in doc
}

export type ReceiverCallback = (error: Error | null, data?: ListenerFormattedCallbackData) => void;
