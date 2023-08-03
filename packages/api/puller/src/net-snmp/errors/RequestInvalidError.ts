/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function RequestInvalidError (message) {
	this.name = "RequestInvalidError";
	this.message = message;
	Error.captureStackTrace(this, RequestInvalidError);
}
util.inherits (RequestInvalidError, Error);
```
*/

export class RequestInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestInvalidError';
  }
}
