/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
  var ReportPdu = function () {
    this.type = PduType.Report;
    ReportPdu.super_.apply(this, arguments);
  };

  util.inherits(ReportPdu, SimpleResponsePdu);

  ReportPdu.createFromBuffer = function (reader) {
    var pdu = new ReportPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  };

  ReportPdu.createFromVariables = function (id, varbinds, options) {
    var pdu = new ReportPdu();
    pdu.initializeFromVariables(id, varbinds, options);
    return pdu;
  };
```
*/

import { BerReader } from 'asn1-ber';
import { PduType } from '../../constants';
import { Varbind } from '../../varbind.interfaces';
import { SimpleResponsePdu } from './SimpleResponsePdu';

export class ReportPdu extends SimpleResponsePdu {
  public type: number;

  constructor() {
    super();
    this.type = PduType.Report;
  }

  public static createFromBuffer(reader: BerReader): ReportPdu {
    const pdu = new ReportPdu();
    pdu.initializeFromBuffer(reader);
    return pdu;
  }

  public static createFromVariables(id: number, varbinds: Varbind[], options?: any): ReportPdu {
    const pdu = new ReportPdu();
    pdu.initializeFromVariables(id, varbinds, options);
    return pdu;
  }
}
