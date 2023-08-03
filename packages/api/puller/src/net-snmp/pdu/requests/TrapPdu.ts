import { BerReader, BerWriter } from 'asn1-ber';
import { ObjectType, PduType, TrapType } from '../../constants';
import {
  readInt32,
  readIpAddress,
  readUint32,
  readVarbinds,
  writeInt32,
  writeUint32,
  writeVarbinds,
} from '../../helpers';
import { Varbind } from '../../varbind.interfaces';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js
var TrapPdu = function () {
this.type = PduType.Trap;
};

TrapPdu.prototype.toBuffer = function (buffer) {
buffer.startSequence(this.type);

buffer.writeOID(this.enterprise);
buffer.writeBuffer(
    Buffer.from(this.agentAddr.split(".")),
    ObjectType.IpAddress
);
writeInt32(buffer, ObjectType.Integer, this.generic);
writeInt32(buffer, ObjectType.Integer, this.specific);
writeUint32(
    buffer,
    ObjectType.TimeTicks,
    this.upTime || Math.floor(process.uptime() * 100)
);

writeVarbinds(buffer, this.varbinds);

buffer.endSequence();
};

TrapPdu.createFromBuffer = function (reader) {
var pdu = new TrapPdu();
reader.readSequence();

pdu.enterprise = reader.readOID();
pdu.agentAddr = readIpAddress(reader);
pdu.generic = readInt32(reader);
pdu.specific = readInt32(reader);
pdu.upTime = readUint32(reader);

pdu.varbinds = [];
readVarbinds(reader, pdu.varbinds);

return pdu;
};

TrapPdu.createFromVariables = function (typeOrOid, varbinds, options) {
var pdu = new TrapPdu();
pdu.agentAddr = options.agentAddr || "127.0.0.1";
pdu.upTime = options.upTime;

if (typeof typeOrOid == "string") {
    pdu.generic = TrapType.EnterpriseSpecific;
    pdu.specific = parseInt(typeOrOid.match(/\.(\d+)$/)[1]);
    pdu.enterprise = typeOrOid.replace(/\.(\d+)$/, "");
} else {
    pdu.generic = typeOrOid;
    pdu.specific = 0;
    pdu.enterprise = "1.3.6.1.4.1";
}

pdu.varbinds = varbinds;

return pdu;
};
```
*/
export class TrapPdu {
  public type: number;
  public id: number;
  public enterprise: string;
  public agentAddr: string;
  public generic: number;
  public specific: number;
  public upTime: number;
  public varbinds: Varbind[];
  // TODO: Check. String due to assignment done in Listener class
  public contextEngineID: Buffer | string | null;
  public contextName: string | null;
  public scoped: boolean;
  // public errorStatus: number;
  // TODO: Check. Undefined bc deleted in Listener class
  public nonRepeaters: number | undefined;
  public maxRepetitions: number | undefined;

  public community: string;
  public user: string;

  constructor() {
    this.type = PduType.Trap;
  }

  public toBuffer(buffer: BerWriter) {
    buffer.startSequence(this.type);

    buffer.writeOID(this.enterprise);
    // TODO: DONE: Parsed to numbers because Buffer.from only works with integers array
    const ipNumbers: number[] = this.agentAddr.split('.').map(x => parseInt(x, 10));
    buffer.writeBuffer(Buffer.from(ipNumbers), ObjectType.IpAddress);
    writeInt32(buffer, ObjectType.Integer, this.generic);
    writeInt32(buffer, ObjectType.Integer, this.specific);
    writeUint32(buffer, ObjectType.TimeTicks, this.upTime || Math.floor(process.uptime() * 100));

    writeVarbinds(buffer, this.varbinds);

    buffer.endSequence();
  }

  public static createFromBuffer(reader: BerReader): TrapPdu {
    const pdu = new TrapPdu();
    reader.readSequence();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pdu.enterprise = reader.readOID()!;
    pdu.agentAddr = readIpAddress(reader);
    pdu.generic = readInt32(reader);
    pdu.specific = readInt32(reader);
    pdu.upTime = readUint32(reader);

    pdu.varbinds = [];
    readVarbinds(reader, pdu.varbinds);

    return pdu;
  }

  public static createFromVariables(
    typeOrOid: number | string,
    varbinds: Varbind[],
    options: any
  ): TrapPdu {
    const pdu = new TrapPdu();
    pdu.agentAddr = options.agentAddr || '127.0.0.1';
    pdu.upTime = options.upTime;

    if (typeof typeOrOid == 'string') {
      pdu.generic = TrapType.EnterpriseSpecific;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      pdu.specific = parseInt(typeOrOid.match(/\.(\d+)$/)![1]);
      pdu.enterprise = typeOrOid.replace(/\.(\d+)$/, '');
    } else {
      pdu.generic = typeOrOid;
      pdu.specific = 0;
      pdu.enterprise = '1.3.6.1.4.1';
    }

    pdu.varbinds = varbinds;

    return pdu;
  }
}
