import { SmartBuffer } from 'smart-buffer';
import {
  BASE_OID_ADDRESS,
  BASE_OID_ADDRESS_ARRAY,
} from '../../../../../../packages/api/puller/src/net-snmp/oids.constants';
import { AgentXPduType, ObjectType } from '../constants';
import { RequestInvalidError } from '../errors';
import { Varbind } from '../varbind.interface';
import {
  DEFAULT_AGENTXPDU_ERROR,
  DEFAULT_AGENTXPDU_INDEX,
  DEFAULT_AGENTXPDU_NETWORK_BYTE_ORDER,
  DEFAULT_AGENTXPDU_OID_ADDRESS_PREFIX,
  DEFAULT_AGENTXPDU_PRIORITY,
  DEFAULT_AGENTXPDU_RANGE_SUBID,
  DEFAULT_AGENTXPDU_SESSION_ID,
  DEFAULT_AGENTXPDU_SYS_UP_TIME,
  DEFAULT_AGENTXPDU_TIMEOUT,
  DEFAULT_AGENTXPDU_TRANSACTION_ID,
} from './AgentXPdu.constants';
import {
  AgentXPduCreateVars,
  AgentXPduSearchRange,
  AgentXPduSendCallback,
} from './AgentXPdu.interfaces';

export class AgentXPdu {
  public static packetID = 1;

  public flags: number;
  public pduType: number;
  public sessionID: number;
  public transactionID: number;
  public packetID: number;
  public timeout: number;
  public oid: string | null | undefined;
  public description: string | null | undefined;
  public priority: number;
  public rangeSubid: number;
  public sysUpTime: number;
  public varbinds: Varbind[] | null | undefined;
  public error: number;
  public index: number;
  public version: number;
  public payloadLength: number;
  public searchRangeList: AgentXPduSearchRange[];
  public nonRepeaters: number;
  public maxRepetitions: number;

  public callback: AgentXPduSendCallback | null; // TODO: Set from Subagent

  constructor() {
    // Empty constructor
  }

  public toBuffer(): Buffer {
    // TODO: Check added
    if (!this.oid || !this.description || !this.varbinds) {
      throw new Error(
        'Error at AgentXPdu.toBuffer(): oid, description and varbinds cannot be missing'
      );
    }

    const buffer = new SmartBuffer();
    this.writeHeader(buffer);

    switch (this.pduType) {
      case this.pduType:
        buffer.writeUInt32BE(this.timeout);
        AgentXPdu.writeOid(buffer, this.oid);
        AgentXPdu.writeOctetString(buffer, this.description);
        break;
      case AgentXPduType.Close:
        buffer.writeUInt8(5); // reasonShutdown == 5
        buffer.writeUInt8(0); // 3 x reserved bytes
        buffer.writeUInt8(0);
        buffer.writeUInt8(0);
        break;
      case AgentXPduType.Register:
        buffer.writeUInt8(this.timeout);
        buffer.writeUInt8(this.priority);
        buffer.writeUInt8(this.rangeSubid);
        buffer.writeUInt8(0);
        AgentXPdu.writeOid(buffer, this.oid);
        break;
      case AgentXPduType.Unregister:
        buffer.writeUInt8(0); // reserved
        buffer.writeUInt8(this.priority);
        buffer.writeUInt8(this.rangeSubid);
        buffer.writeUInt8(0); // reserved
        AgentXPdu.writeOid(buffer, this.oid);
        break;
      case AgentXPduType.AddAgentCaps:
        AgentXPdu.writeOid(buffer, this.oid);
        AgentXPdu.writeOctetString(buffer, this.description);
        break;
      case AgentXPduType.RemoveAgentCaps:
        AgentXPdu.writeOid(buffer, this.oid);
        break;
      case AgentXPduType.Notify:
        AgentXPdu.writeVarbinds(buffer, this.varbinds);
        break;
      case AgentXPduType.Ping:
        break;
      case AgentXPduType.Response:
        buffer.writeUInt32BE(this.sysUpTime);
        buffer.writeUInt16BE(this.error);
        buffer.writeUInt16BE(this.index);
        AgentXPdu.writeVarbinds(buffer, this.varbinds);
        break;
      default:
      // unknown PDU type - should never happen as we control these
    }

    buffer.writeUInt32BE(buffer.length - 20, 16);
    return buffer.toBuffer();
  }

  public writeHeader(buffer: SmartBuffer): SmartBuffer {
    this.flags = this.flags || DEFAULT_AGENTXPDU_NETWORK_BYTE_ORDER; // set NETWORK_BYTE_ORDER

    buffer.writeUInt8(1); // h.version = 1
    buffer.writeUInt8(this.pduType);
    buffer.writeUInt8(this.flags);
    buffer.writeUInt8(0); // reserved byte
    buffer.writeUInt32BE(this.sessionID);
    buffer.writeUInt32BE(this.transactionID);
    buffer.writeUInt32BE(this.packetID);
    buffer.writeUInt32BE(0);
    return buffer;
  }

  public readHeader(buffer: SmartBuffer): void {
    this.version = buffer.readUInt8();
    this.pduType = buffer.readUInt8();
    this.flags = buffer.readUInt8();
    buffer.readUInt8(); // reserved byte
    this.sessionID = buffer.readUInt32BE();
    this.transactionID = buffer.readUInt32BE();
    this.packetID = buffer.readUInt32BE();
    this.payloadLength = buffer.readUInt32BE();
  }

  public static createFromVariables(vars: AgentXPduCreateVars): AgentXPdu {
    const pdu = new AgentXPdu();
    pdu.flags = vars.flags
      ? vars.flags | DEFAULT_AGENTXPDU_NETWORK_BYTE_ORDER
      : DEFAULT_AGENTXPDU_NETWORK_BYTE_ORDER; // set NETWORK_BYTE_ORDER to big endian
    pdu.pduType = vars.pduType || AgentXPduType.Open;
    pdu.sessionID = vars.sessionID || DEFAULT_AGENTXPDU_SESSION_ID;
    pdu.transactionID = vars.transactionID || DEFAULT_AGENTXPDU_TRANSACTION_ID;
    pdu.packetID = vars.packetID || ++AgentXPdu.packetID;

    switch (pdu.pduType) {
      case AgentXPduType.Open:
        pdu.timeout = vars.timeout || DEFAULT_AGENTXPDU_TIMEOUT;
        pdu.oid = vars.oid || null;
        pdu.description = vars.descr || null;
        break;
      case AgentXPduType.Close:
        break;
      case AgentXPduType.Register:
        pdu.timeout = vars.timeout || DEFAULT_AGENTXPDU_TIMEOUT;
        pdu.oid = vars.oid || null;
        pdu.priority = vars.priority || DEFAULT_AGENTXPDU_PRIORITY;
        pdu.rangeSubid = vars.rangeSubid || DEFAULT_AGENTXPDU_RANGE_SUBID;
        break;
      case AgentXPduType.Unregister:
        pdu.oid = vars.oid || null;
        pdu.priority = vars.priority || DEFAULT_AGENTXPDU_PRIORITY;
        pdu.rangeSubid = vars.rangeSubid || DEFAULT_AGENTXPDU_RANGE_SUBID;
        break;
      case AgentXPduType.AddAgentCaps:
        // TODO: Check, added undefined type to oid, desc... bc of this, could do || null as above?
        pdu.oid = vars.oid;
        pdu.description = vars.descr;
        break;
      case AgentXPduType.RemoveAgentCaps:
        pdu.oid = vars.oid;
        break;
      case AgentXPduType.Notify:
        pdu.varbinds = vars.varbinds;
        break;
      case AgentXPduType.Ping:
        break;
      case AgentXPduType.Response:
        pdu.sysUpTime = vars.sysUpTime || DEFAULT_AGENTXPDU_SYS_UP_TIME;
        pdu.error = vars.error || DEFAULT_AGENTXPDU_ERROR;
        pdu.index = vars.index || DEFAULT_AGENTXPDU_INDEX;
        pdu.varbinds = vars.varbinds || null;
        break;
      default:
        // unknown PDU type - should never happen as we control these
        throw new RequestInvalidError(`Unknown PDU type '${pdu.pduType}' in created PDU`);
    }

    return pdu;
  }

  public static createFromBuffer(socketBuffer: Buffer): AgentXPdu {
    const pdu = new AgentXPdu();
    const buffer = SmartBuffer.fromBuffer(socketBuffer);
    pdu.readHeader(buffer);

    switch (pdu.pduType) {
      case AgentXPduType.Response:
        pdu.sysUpTime = buffer.readUInt32BE();
        pdu.error = buffer.readUInt16BE();
        pdu.index = buffer.readUInt16BE();
        break;
      case AgentXPduType.Get:
      case AgentXPduType.GetNext:
        pdu.searchRangeList = AgentXPdu.readSearchRangeList(buffer, pdu.payloadLength);
        break;
      case AgentXPduType.GetBulk:
        pdu.nonRepeaters = buffer.readUInt16BE();
        pdu.maxRepetitions = buffer.readUInt16BE();
        pdu.searchRangeList = AgentXPdu.readSearchRangeList(buffer, pdu.payloadLength - 4);
        break;
      case AgentXPduType.TestSet:
        pdu.varbinds = AgentXPdu.readVarbinds(buffer, pdu.payloadLength);
        break;
      case AgentXPduType.CommitSet:
      case AgentXPduType.UndoSet:
      case AgentXPduType.CleanupSet:
        break;
      default:
        // unknown PDU type - shouldn't happen as master agents shouldn't send administrative PDUs
        throw new RequestInvalidError(`Unknown PDU type '${pdu.pduType}' in request`);
    }

    return pdu;
  }

  public static writeOid(buffer: SmartBuffer, oid: string, include = 0): void {
    let prefix: number;
    if (oid) {
      let address = oid.split('.').map(Number);
      if (address.length >= 5 && address.slice(0, 4).join('.') == BASE_OID_ADDRESS) {
        prefix = address[4];
        address = address.splice(5);
      } else {
        prefix = DEFAULT_AGENTXPDU_OID_ADDRESS_PREFIX;
      }

      buffer.writeUInt8(address.length);
      buffer.writeUInt8(prefix);
      buffer.writeUInt8(include);
      buffer.writeUInt8(0); // reserved

      for (const addressPart of address) {
        buffer.writeUInt32BE(addressPart);
      }
    } else {
      buffer.writeUInt32BE(0); // row of zeros for null OID
    }
  }

  public static writeOctetString(buffer: SmartBuffer, octetString: string): void {
    buffer.writeUInt32BE(octetString.length);
    buffer.writeString(octetString);

    const paddingOctets = (4 - (octetString.length % 4)) % 4;
    for (let i = 0; i < paddingOctets; i++) {
      buffer.writeUInt8(0);
    }
  }

  public static writeVarbind(buffer: SmartBuffer, varbind: Varbind): void {
    if (varbind.type && varbind.oid) {
      // TODO: Moved this 3 lines inside if bc outside varbind.type could be null
      buffer.writeUInt16BE(varbind.type);
      buffer.writeUInt16BE(0); // reserved
      AgentXPdu.writeOid(buffer, varbind.oid);

      switch (varbind.type) {
        case ObjectType.Integer: // also Integer32
        case ObjectType.Counter: // also Counter32
        case ObjectType.Gauge: // also Gauge32 & Unsigned32
        case ObjectType.TimeTicks:
          buffer.writeUInt32BE(varbind.value);
          break;
        case ObjectType.OctetString:
        case ObjectType.Opaque:
          AgentXPdu.writeOctetString(buffer, varbind.value);
          break;
        case ObjectType.OID:
          AgentXPdu.writeOid(buffer, varbind.value);
          break;
        case ObjectType.IpAddress:
          const bytes = varbind.value.split('.');
          if (bytes.length != 4)
            throw new RequestInvalidError(`Invalid IP address '${varbind.value}'`);
          // TODO: Check, error in original bc writeOctetString is a method of AgentXPdu, not buffer
          // TODO: Check, also error when calling with AgentXPdu
          // buffer.writeOctetString(buffer, Buffer.from(bytes));
          AgentXPdu.writeOctetString(buffer, Buffer.from(bytes));
          break;
        case ObjectType.Counter64:
          // TODO: Check. Use writeBigUInt64BE?
          buffer.writeUint64(varbind.value);
          break;
        case ObjectType.Null:
        case ObjectType.EndOfMibView:
        case ObjectType.NoSuchObject:
        case ObjectType.NoSuchInstance:
          break;
        default:
          // Unknown data type - should never happen as the above covers all types in
          // RFC 2741 Section 5.4
          throw new RequestInvalidError(`Unknown type '${varbind.type}' in request`);
      }
    }
  }

  public static writeVarbinds(buffer: SmartBuffer, varbinds: Varbind[]): void {
    if (varbinds) {
      for (const varbind of varbinds) {
        AgentXPdu.writeVarbind(buffer, varbind);
      }
    }
  }

  public static readOid(buffer: SmartBuffer): string | null {
    const subidLength = buffer.readUInt8();
    const prefix = buffer.readUInt8();
    const include = buffer.readUInt8();
    buffer.readUInt8(); // reserved

    // Null OID check
    if (subidLength == 0 && prefix == 0 && include == 0) {
      return null;
    }

    let address: number[] = [];
    if (prefix == 0) {
      address = [];
    } else {
      address = [...BASE_OID_ADDRESS_ARRAY, prefix];
    }

    for (let i = 0; i < subidLength; i++) {
      address.push(buffer.readUInt32BE());
    }

    const oid = address.join('.');
    return oid;
  }

  public static readSearchRange(buffer: SmartBuffer): AgentXPduSearchRange {
    // TODO: Check. Added '' to avoid null in type due to error on Subagent.getNextRequest
    const searchRange = {
      start: AgentXPdu.readOid(buffer) || '',
      end: AgentXPdu.readOid(buffer) || '',
    };
    return searchRange;
  }

  public static readSearchRangeList(
    buffer: SmartBuffer,
    payloadLength: number
  ): AgentXPduSearchRange[] {
    let bytesLeft = payloadLength;
    let bufferPosition = buffer.readOffset + 1;
    const searchRangeList: AgentXPduSearchRange[] = [];
    while (bytesLeft > 0) {
      searchRangeList.push(AgentXPdu.readSearchRange(buffer));
      bytesLeft -= buffer.readOffset + 1 - bufferPosition;
      bufferPosition = buffer.readOffset + 1;
    }

    return searchRangeList;
  }

  public static readOctetString(buffer: SmartBuffer): string {
    const octetStringLength = buffer.readUInt32BE();
    const paddingOctets = (4 - (octetStringLength % 4)) % 4;
    const octetString = buffer.readString(octetStringLength);
    buffer.readString(paddingOctets);

    return octetString;
  }

  public static readVarbind(buffer: SmartBuffer): Varbind {
    const valueType = buffer.readUInt16BE();
    buffer.readUInt16BE(); // reserved
    const oid = AgentXPdu.readOid(buffer);
    let value: any;

    switch (valueType) {
      case ObjectType.Integer:
      case ObjectType.Counter:
      case ObjectType.Gauge:
      case ObjectType.TimeTicks:
        value = buffer.readUInt32BE();
        break;
      case ObjectType.OctetString:
      case ObjectType.IpAddress:
      case ObjectType.Opaque:
        value = AgentXPdu.readOctetString(buffer);
        break;
      case ObjectType.OID:
        value = AgentXPdu.readOid(buffer);
        break;
      case ObjectType.Counter64:
        // TODO: Check. Use readBigUInt64BE?
        value = buffer.readUInt64BE();
        break;
      case ObjectType.Null:
      case ObjectType.NoSuchObject:
      case ObjectType.NoSuchInstance:
      case ObjectType.EndOfMibView:
        value = null;
        break;
      default:
        // Unknown data type - should never happen as the above covers all types in
        // RFC 2741 Section 5.4
        throw new RequestInvalidError(`Unknown type '${valueType}' in varbind`);
    }

    const varbind: Varbind = {
      type: valueType,
      oid: oid || '', // TODO: What to do when null? For now '' to avoid error
      value: value,
    };
    return varbind;
  }

  public static readVarbinds(buffer: SmartBuffer, payloadLength: number): Varbind[] {
    let bytesLeft = payloadLength;
    let bufferPosition = buffer.readOffset + 1;
    const varbindList: Varbind[] = [];
    while (bytesLeft > 0) {
      varbindList.push(AgentXPdu.readVarbind(buffer));
      bytesLeft -= buffer.readOffset + 1 - bufferPosition;
      bufferPosition = buffer.readOffset + 1;
    }

    return varbindList;
  }
}
