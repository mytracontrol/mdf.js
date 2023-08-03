import { BerReader } from 'asn1-ber';
import { PduType } from '../constants';
import { Varbind } from '../varbind.interface';
import { SimplePdu } from './SimplePdu';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var GetRequestPdu = function () {
this.type = PduType.GetRequest;
GetRequestPdu.super_.apply(this, arguments);
};

util.inherits(GetRequestPdu, SimplePdu);

GetRequestPdu.createFromBuffer = function (reader) {
var pdu = new GetRequestPdu();
pdu.initializeFromBuffer(reader);
return pdu;
};

GetRequestPdu.createFromVariables = function (id, varbinds, options) {
var pdu = new GetRequestPdu();
pdu.initializeFromVariables(id, varbinds, options);
return pdu;
};
```
*/
export class GetRequestPdu extends SimplePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.GetRequest;
  }

  public static createFromBuffer(reader: BerReader): GetRequestPdu {
    const pdu = new GetRequestPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }

  public static createFromVariables(
    pduClass: any,
    id: number,
    varbinds: Varbind[],
    options?: any
  ): GetRequestPdu {
    const pdu = new GetRequestPdu();
    pdu.initializeFromVariables(id, varbinds, options);
    return pdu;
  }
}
