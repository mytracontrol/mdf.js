import { ErrorStatus } from '../constants';

export interface MibRequestDoneError {
  errorStatus: ErrorStatus;
  errorIndex?: number;
  type: number;
  value: any;
}
