/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function RequestFailedError (message, status) {
	this.name = "RequestFailedError";
	this.message = message;
	this.status = status;
	Error.captureStackTrace(this, RequestFailedError);
}
util.inherits (RequestFailedError, Error);
```
*/

export class RequestFailedError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RequestFailedError';
    this.status = status;
  }
}
