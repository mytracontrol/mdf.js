/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js
var TrapV2Pdu = function () {
this.type = PduType.TrapV2;
TrapV2Pdu.super_.apply(this, arguments);
};

util.inherits(TrapV2Pdu, SimplePdu);

TrapV2Pdu.createFromBuffer = function (reader) {
var pdu = new TrapV2Pdu();
pdu.initializeFromBuffer(reader);
return pdu;
};

TrapV2Pdu.createFromVariables = function (id, varbinds, options) {
var pdu = new TrapV2Pdu();
pdu.initializeFromVariables(id, varbinds, options);
return pdu;
};
```	
*/

import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { Varbind } from '../../varbind.interfaces';
import { SimplePdu } from './SimplePdu';

export class TrapV2Pdu extends SimplePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.TrapV2;
  }

  public static createFromBuffer(reader: BerReader): TrapV2Pdu {
    const pdu = new TrapV2Pdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }

  static createFromVariables(
    pduClass: any,
    id: number,
    varbinds: Varbind[],
    options?: any
  ): TrapV2Pdu {
    const pdu = new TrapV2Pdu();
    pdu.initializeFromVariables(id, varbinds, options);
    return pdu;
  }
}
