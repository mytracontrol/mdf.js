/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js
var SimpleResponsePdu = function () {};

SimpleResponsePdu.prototype.toBuffer = function (writer) {
writer.startSequence(this.type);

writeInt32(writer, ObjectType.Integer, this.id);
writeInt32(writer, ObjectType.Integer, this.errorStatus || 0);
writeInt32(writer, ObjectType.Integer, this.errorIndex || 0);
writeVarbinds(writer, this.varbinds);
writer.endSequence();
};

SimpleResponsePdu.prototype.initializeFromBuffer = function (reader) {
reader.readSequence(this.type);

this.id = readInt32(reader);
this.errorStatus = readInt32(reader);
this.errorIndex = readInt32(reader);

this.varbinds = [];
readVarbinds(reader, this.varbinds);
};

SimpleResponsePdu.prototype.initializeFromVariables = function (
id,
varbinds,
options
) {
this.id = id;
this.varbinds = varbinds;
this.options = options || {};
};
```	
*/

import { BerReader, BerWriter } from 'asn1-ber';
import { ObjectType } from '../../constants';
import { readInt32, readVarbinds, writeInt32, writeVarbinds } from '../../helpers';
import { ResponseVarbind } from '../../varbind.interfaces';

export class SimpleResponsePdu {
  public type: number;
  public id: number;
  public errorStatus: number;
  public errorIndex: number;
  // TODO: Changed type to ResponseVarbind[] due to Agent.request response
  public varbinds: ResponseVarbind[];
  public options: any;
  // TODO: Check. String due to assignment done in Listener class
  public contextEngineID: Buffer | string | null;
  public contextName: string | null;
  public scoped: boolean;
  public nonRepeaters: number;
  public maxRepetitions: number;

  public community: string;
  public user: string;

  constructor() {
    // Empty constructor
  }

  public toBuffer(writer: BerWriter): void {
    writer.startSequence(this.type);

    writeInt32(writer, ObjectType.Integer, this.id);
    writeInt32(writer, ObjectType.Integer, this.errorStatus || 0);
    writeInt32(writer, ObjectType.Integer, this.errorIndex || 0);
    writeVarbinds(writer, this.varbinds);

    writer.endSequence();
  }

  public initializeFromBuffer(reader: BerReader): void {
    reader.readSequence(this.type);

    this.id = readInt32(reader);
    this.errorStatus = readInt32(reader);
    this.errorIndex = readInt32(reader);

    this.varbinds = [];
    readVarbinds(reader, this.varbinds);
  }

  public initializeFromVariables(id: number, varbinds: ResponseVarbind[], options?: any): void {
    this.id = id;
    this.varbinds = varbinds;
    this.options = options || {};
  }
}
