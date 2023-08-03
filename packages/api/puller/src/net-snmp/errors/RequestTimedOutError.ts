/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function RequestTimedOutError (message) {
	this.name = "RequestTimedOutError";
	this.message = message;
	Error.captureStackTrace(this, RequestTimedOutError);
}
util.inherits (RequestTimedOutError, Error);
```
*/

export class RequestTimedOutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestTimedOutError';
  }
}
