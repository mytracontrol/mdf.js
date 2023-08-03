import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { SimplePdu } from './SimplePdu';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js
var InformRequestPdu = function () {
this.type = PduType.InformRequest;
InformRequestPdu.super_.apply(this, arguments);
};

util.inherits(InformRequestPdu, SimplePdu);

InformRequestPdu.createFromBuffer = function (reader) {
var pdu = new InformRequestPdu();
pdu.initializeFromBuffer(reader);
return pdu;
};
```	
*/
export class InformRequestPdu extends SimplePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.InformRequest;
  }

  public static createFromBuffer(reader: BerReader): InformRequestPdu {
    const pdu = new InformRequestPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }
}
