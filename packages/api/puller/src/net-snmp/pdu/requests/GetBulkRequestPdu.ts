import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { SimplePdu } from './SimplePdu';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var GetBulkRequestPdu = function () {
this.type = PduType.GetBulkRequest;
GetBulkRequestPdu.super_.apply(this, arguments);
};

util.inherits(GetBulkRequestPdu, SimplePdu);

GetBulkRequestPdu.createFromBuffer = function (reader) {
var pdu = new GetBulkRequestPdu();
pdu.initializeFromBuffer(reader);
return pdu;
};
```
*/

export class GetBulkRequestPdu extends SimplePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.GetBulkRequest;
  }

  public static createFromBuffer(reader: BerReader): GetBulkRequestPdu {
    const pdu = new GetBulkRequestPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }
}
