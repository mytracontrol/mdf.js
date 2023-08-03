import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { SimplePdu } from './SimplePdu';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var GetNextRequestPdu = function () {
this.type = PduType.GetNextRequest;
GetNextRequestPdu.super_.apply(this, arguments);
};

util.inherits(GetNextRequestPdu, SimplePdu);

GetNextRequestPdu.createFromBuffer = function (reader) {
var pdu = new GetNextRequestPdu();
pdu.initializeFromBuffer(reader);
return pdu;
};
```	
*/
export class GetNextRequestPdu extends SimplePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.GetNextRequest;
  }

  public static createFromBuffer(reader: BerReader): GetNextRequestPdu {
    const pdu = new GetNextRequestPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }
}
