import { SocketType } from 'dgram';
import { Session } from '../session';
import { User } from '../user.interface';

export interface ForwarderProxy {
  context: string;
  transport?: SocketType;
  target: string;
  port?: number;
  user: User;
}

export interface ForwarderProxyComplete {
  context: string;
  transport: SocketType;
  target: string;
  port: number;
  user: User;
  session: Session; // TODO: Not in doc
}
