/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function ResponseInvalidError (message, code, info) {
	this.name = "ResponseInvalidError";
	this.message = message;
	this.code = code;
	this.info = info;
	Error.captureStackTrace(this, ResponseInvalidError);
}
util.inherits (ResponseInvalidError, Error);
```
*/

export class ResponseInvalidError extends Error {
  code: number;
  info: string | object | undefined;
  constructor(message: string, code: number, info?: string | object) {
    super(message);
    this.name = 'ResponseInvalidError';
    this.code = code;
    this.info = info;
  }
}
