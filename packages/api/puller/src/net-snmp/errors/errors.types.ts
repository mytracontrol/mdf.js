import { ProcessingError } from './ProcessingError';
import { RequestFailedError } from './RequestFailedError';
import { RequestInvalidError } from './RequestInvalidError';
import { RequestTimedOutError } from './RequestTimedOutError';
import { ResponseInvalidError } from './ResponseInvalidError';

export type NetSnmpError =
  | ProcessingError
  | RequestFailedError
  | RequestInvalidError
  | RequestTimedOutError
  | ResponseInvalidError;
