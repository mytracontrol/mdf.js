import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { SimplePdu } from './SimplePdu';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js
var SetRequestPdu = function () {
this.type = PduType.SetRequest;
SetRequestPdu.super_.apply(this, arguments);
};

util.inherits(SetRequestPdu, SimplePdu);

SetRequestPdu.createFromBuffer = function (reader) {
var pdu = new SetRequestPdu();
pdu.initializeFromBuffer(reader);
return pdu;
};
```
*/
export class SetRequestPdu extends SimplePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.SetRequest;
  }

  public static createFromBuffer(reader: BerReader): SetRequestPdu {
    const pdu = new SetRequestPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }
}
