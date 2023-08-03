/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function ProcessingError (message, error, rinfo, buffer) {
	this.name = "ProcessingError";
	this.message = message;
	this.error = error;
	this.rinfo = rinfo;
	this.buffer = buffer;
	Error.captureStackTrace(this, ProcessingError);
}
util.inherits (ProcessingError, Error);
```
*/
import { RemoteInfo } from 'dgram';

export class ProcessingError extends Error {
  error: Error;
  rinfo: RemoteInfo;
  buffer: Buffer;
  constructor(message: string, error: Error, rinfo: RemoteInfo, buffer: Buffer) {
    super(message);
    this.name = 'ProcessingError';
    this.error = error;
    this.rinfo = rinfo;
    this.buffer = buffer;
  }
}
