/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var GetResponsePdu = function () {
this.type = PduType.GetResponse;
GetResponsePdu.super_.apply(this, arguments);
};

util.inherits(GetResponsePdu, SimpleResponsePdu);

GetResponsePdu.createFromBuffer = function (reader) {
var pdu = new GetResponsePdu();
pdu.initializeFromBuffer(reader);
return pdu;
};

GetResponsePdu.createFromVariables = function (id, varbinds, options) {
var pdu = new GetResponsePdu();
pdu.initializeFromVariables(id, varbinds, options);
return pdu;
};
```
*/

import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { ResponseVarbind } from '../../varbind.interfaces';
import { SimpleResponsePdu } from './SimpleResponsePdu';

export class GetResponsePdu extends SimpleResponsePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.GetResponse;
  }

  public static createFromBuffer(reader: BerReader): GetResponsePdu {
    const pdu = new GetResponsePdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }

  static createFromVariables(
    id: number,
    varbinds: ResponseVarbind[],
    options?: any
  ): GetResponsePdu {
    const pdu = new GetResponsePdu();
    pdu.initializeFromVariables(id, varbinds, options);
    return pdu;
  }
}
