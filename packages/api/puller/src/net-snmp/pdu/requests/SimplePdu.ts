/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var SimplePdu = function () {};

  SimplePdu.prototype.toBuffer = function (buffer) {
    buffer.startSequence(this.type);

    writeInt32(buffer, ObjectType.Integer, this.id);
    writeInt32(
      buffer,
      ObjectType.Integer,
      this.type == PduType.GetBulkRequest ? this.options.nonRepeaters || 0 : 0
    );
    writeInt32(
      buffer,
      ObjectType.Integer,
      this.type == PduType.GetBulkRequest ? this.options.maxRepetitions || 0 : 0
    );

    writeVarbinds(buffer, this.varbinds);

    buffer.endSequence();
  };

  SimplePdu.prototype.initializeFromVariables = function (
    id,
    varbinds,
    options
  ) {
    this.id = id;
    this.varbinds = varbinds;
    this.options = options || {};
    this.contextName = options && options.context ? options.context : "";
  };

  SimplePdu.prototype.initializeFromBuffer = function (reader) {
    this.type = reader.peek();
    reader.readSequence();

    this.id = readInt32(reader);
    this.nonRepeaters = readInt32(reader);
    this.maxRepetitions = readInt32(reader);

    this.varbinds = [];
    readVarbinds(reader, this.varbinds);
  };

  SimplePdu.prototype.getResponsePduForRequest = function () {
    var responsePdu = GetResponsePdu.createFromVariables(this.id, [], {});
    if (this.contextEngineID) {
      responsePdu.contextEngineID = this.contextEngineID;
      responsePdu.contextName = this.contextName;
    }
    return responsePdu;
  };

  SimplePdu.createFromVariables = function (pduClass, id, varbinds, options) {
    var pdu = new pduClass(id, varbinds, options);
    pdu.id = id;
    pdu.varbinds = varbinds;
    pdu.options = options || {};
    pdu.contextName = options && options.context ? options.context : "";
    return pdu;
  };
  ```
  */

import { BerReader, BerWriter } from 'asn1-ber';
import { ObjectType, PduType } from '../../constants';
import { readInt32, readVarbinds, writeInt32, writeVarbinds } from '../../helpers';
import { Varbind } from '../../varbind.interfaces';
import { GetResponsePdu } from '../responses/GetResponsePdu';

export class SimplePdu {
  public type: number;
  public id: number;
  public nonRepeaters: number;
  public maxRepetitions: number;
  public varbinds: Varbind[];
  // TODO: Check type
  public options: any;
  public contextName: string | null;
  // TODO: Check. String due to assignment done in Listener class
  public contextEngineID: Buffer | string | null;
  public scoped: boolean;
  // public errorStatus: number;
  public community: string;
  public user: string;

  constructor() {
    // Empty constructor
  }

  public toBuffer(buffer: BerWriter) {
    buffer.startSequence(this.type);

    writeInt32(buffer, ObjectType.Integer, this.id);
    writeInt32(
      buffer,
      ObjectType.Integer,
      this.type == PduType.GetBulkRequest ? this.options.nonRepeaters || 0 : 0
    );
    writeInt32(
      buffer,
      ObjectType.Integer,
      this.type == PduType.GetBulkRequest ? this.options.maxRepetitions || 0 : 0
    );

    writeVarbinds(buffer, this.varbinds);

    buffer.endSequence();
  }

  public initializeFromVariables(id: number, varbinds: Varbind[], options?: any) {
    this.id = id;
    this.varbinds = varbinds;
    this.options = options || {};
    this.contextName = options && options.context ? options.context : '';
  }

  public initializeFromBuffer(reader: BerReader) {
    this.type = reader.peek();
    reader.readSequence();

    this.id = readInt32(reader);
    this.nonRepeaters = readInt32(reader);
    this.maxRepetitions = readInt32(reader);

    this.varbinds = [];
    readVarbinds(reader, this.varbinds);
  }

  public getResponsePduForRequest() {
    const responsePdu = GetResponsePdu.createFromVariables(this.id, [], {});
    if (this.contextEngineID) {
      // TODO: DONE: Could use setters
      responsePdu.contextEngineID = this.contextEngineID;
      responsePdu.contextName = this.contextName;
    }
    return responsePdu;
  }

  // TODO: Check pduClass param when this function is used, should be a class
  // TODO: DONE: Added pduClass param in derived class GetRequestPdu function to make it compatible
  // with this one in  as it seems to be used internally only, not exposed by module.
  // Check this last thing.
  public static createFromVariables(
    pduClass: any,
    id: number,
    varbinds: Varbind[],
    options?: any
  ): any {
    // TODO: Check options needed in constructor of any pdu class?
    const pdu = new pduClass(id, varbinds, options);
    pdu.id = id;
    pdu.varbinds = varbinds;
    pdu.options = options || {};
    pdu.contextName = options && options.context ? options.context : '';
    return pdu;
  }
}
