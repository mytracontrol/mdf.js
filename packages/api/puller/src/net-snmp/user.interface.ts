import { AuthProtocols, PrivProtocols, SecurityLevel } from './constants';

export interface User {
  name: string;
  level: SecurityLevel;
  authProtocol: AuthProtocols;
  authKey: string;
  privProtocol: PrivProtocols;
  privKey: string;
}
