/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function isVarbindError(varbind) {
  return !!(
    varbind.type == ObjectType.NoSuchObject ||
    varbind.type == ObjectType.NoSuchInstance ||
    varbind.type == ObjectType.EndOfMibView
  );
}

function varbindError(varbind) {
  return (ObjectType[varbind.type] || 'NotAnError') + ': ' + varbind.oid;
}

function oidFollowsOid(oidString, nextString) {
  const oid = { str: oidString, len: oidString.length, idx: 0 };
  const next = { str: nextString, len: nextString.length, idx: 0 };
  const dotCharCode = '.'.charCodeAt(0);

  function getNumber(item) {
    let n = 0;
    if (item.idx >= item.len) return null;
    while (item.idx < item.len) {
      const charCode = item.str.charCodeAt(item.idx++);
      if (charCode == dotCharCode) return n;
      n = (n ? n * 10 : n) + (charCode - 48);
    }
    return n;
  }

  while (1) {
    const oidNumber = getNumber(oid);
    const nextNumber = getNumber(next);

    if (oidNumber !== null) {
      if (nextNumber !== null) {
        if (nextNumber > oidNumber) {
          return true;
        } else if (nextNumber < oidNumber) {
          return false;
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
}

function oidInSubtree(oidString, nextString) {
  const oid = oidString.split('.');
  const next = nextString.split('.');

  if (oid.length > next.length) return false;

  for (let i = 0; i < oid.length; i++) {
    if (next[i] != oid[i]) return false;
  }

  return true;
}

function readInt32(buffer) {
  const parsedInt = buffer.readInt();
  if (!Number.isInteger(parsedInt)) {
    throw new TypeError('Value read as integer ' + parsedInt + ' is not an integer');
  }
  if (parsedInt < MIN_SIGNED_INT32 || parsedInt > MAX_SIGNED_INT32) {
    throw new RangeError('Read integer ' + parsedInt + ' is outside the signed 32-bit range');
  }
  return parsedInt;
}

function readUint32(buffer) {
  const parsedInt = buffer.readInt();
  if (!Number.isInteger(parsedInt)) {
    throw new TypeError('Value read as integer ' + parsedInt + ' is not an integer');
  }
  if (parsedInt < MIN_UNSIGNED_INT32 || parsedInt > MAX_UNSIGNED_INT32) {
    throw new RangeError('Read integer ' + parsedInt + ' is outside the unsigned 32-bit range');
  }
  return parsedInt;
}

function readUint64(buffer) {
  const value = buffer.readString(ObjectType.Counter64, true);

  return value;
}

function readIpAddress(buffer) {
  const bytes = buffer.readString(ObjectType.IpAddress, true);
  if (bytes.length != 4)
    throw new ResponseInvalidError(
      "Length '" + bytes.length + "' of IP address '" + bytes.toString('hex') + "' is not 4",
      ResponseInvalidCode.EIp4AddressSize
    );
  const value = bytes[0] + '.' + bytes[1] + '.' + bytes[2] + '.' + bytes[3];
  return value;
}

function readVarbindValue(buffer, type) {
  let value;
  if (type == ObjectType.Boolean) {
    value = buffer.readBoolean();
  } else if (type == ObjectType.Integer) {
    value = readInt32(buffer);
  } else if (type == ObjectType.BitString) {
    value = buffer.readBitString();
  } else if (type == ObjectType.OctetString) {
    value = buffer.readString(null, true);
  } else if (type == ObjectType.Null) {
    buffer.readByte();
    buffer.readByte();
    value = null;
  } else if (type == ObjectType.OID) {
    value = buffer.readOID();
  } else if (type == ObjectType.IpAddress) {
    value = readIpAddress(buffer);
  } else if (type == ObjectType.Counter) {
    value = readUint32(buffer);
  } else if (type == ObjectType.Gauge) {
    value = readUint32(buffer);
  } else if (type == ObjectType.TimeTicks) {
    value = readUint32(buffer);
  } else if (type == ObjectType.Opaque) {
    value = buffer.readString(ObjectType.Opaque, true);
  } else if (type == ObjectType.Counter64) {
    value = readUint64(buffer);
  } else if (type == ObjectType.NoSuchObject) {
    buffer.readByte();
    buffer.readByte();
    value = null;
  } else if (type == ObjectType.NoSuchInstance) {
    buffer.readByte();
    buffer.readByte();
    value = null;
  } else if (type == ObjectType.EndOfMibView) {
    buffer.readByte();
    buffer.readByte();
    value = null;
  } else {
    throw new ResponseInvalidError(
      "Unknown type '" + type + "' in response",
      ResponseInvalidCode.EUnknownObjectType
    );
  }
  return value;
}

function readVarbinds(buffer, varbinds) {
  buffer.readSequence();

  while (1) {
    buffer.readSequence();
    if (buffer.peek() != ObjectType.OID) break;
    const oid = buffer.readOID();
    const type = buffer.peek();

    if (type == null) break;

    const value = readVarbindValue(buffer, type);

    varbinds.push({
      oid: oid,
      type: type,
      value: value,
    });
  }
}

function writeInt32(buffer, type, value) {
  if (!Number.isInteger(value)) {
    throw new TypeError('Value to write as integer ' + value + ' is not an integer');
  }
  if (value < MIN_SIGNED_INT32 || value > MAX_SIGNED_INT32) {
    throw new RangeError('Integer to write ' + value + ' is outside the signed 32-bit range');
  }
  buffer.writeInt(value, type);
}

function writeUint32(buffer, type, value) {
  if (!Number.isInteger(value)) {
    throw new TypeError('Value to write as integer ' + value + ' is not an integer');
  }
  if (value < MIN_UNSIGNED_INT32 || value > MAX_UNSIGNED_INT32) {
    throw new RangeError('Integer to write ' + value + ' is outside the unsigned 32-bit range');
  }
  buffer.writeInt(value, type);
}

function writeUint64(buffer, value) {
  buffer.writeBuffer(value, ObjectType.Counter64);
}

function writeVarbinds(buffer, varbinds) {
  buffer.startSequence();
  for (let i = 0; i < varbinds.length; i++) {
    buffer.startSequence();
    buffer.writeOID(varbinds[i].oid);

    if (varbinds[i].type && varbinds[i].hasOwnProperty('value')) {
      const type = varbinds[i].type;
      const value = varbinds[i].value;

      switch (type) {
        case ObjectType.Boolean:
          buffer.writeBoolean(value ? true : false);
          break;
        case ObjectType.Integer: // also Integer32
          writeInt32(buffer, ObjectType.Integer, value);
          break;
        case ObjectType.OctetString:
          if (typeof value == 'string') buffer.writeString(value);
          else buffer.writeBuffer(value, ObjectType.OctetString);
          break;
        case ObjectType.Null:
          buffer.writeNull();
          break;
        case ObjectType.OID:
          buffer.writeOID(value);
          break;
        case ObjectType.IpAddress:
          var bytes = value.split('.');
          if (bytes.length != 4)
            throw new RequestInvalidError("Invalid IP address '" + value + "'");
          buffer.writeBuffer(Buffer.from(bytes), 64);
          break;
        case ObjectType.Counter: // also Counter32
          writeUint32(buffer, ObjectType.Counter, value);
          break;
        case ObjectType.Gauge: // also Gauge32 & Unsigned32
          writeUint32(buffer, ObjectType.Gauge, value);
          break;
        case ObjectType.TimeTicks:
          writeUint32(buffer, ObjectType.TimeTicks, value);
          break;
        case ObjectType.Opaque:
          buffer.writeBuffer(value, ObjectType.Opaque);
          break;
        case ObjectType.Counter64:
          writeUint64(buffer, value);
          break;
        case ObjectType.NoSuchObject:
        case ObjectType.NoSuchInstance:
        case ObjectType.EndOfMibView:
          buffer.writeByte(type);
          buffer.writeByte(0);
          break;
        default:
          throw new RequestInvalidError("Unknown type '" + type + "' in request");
      }
    } else {
      buffer.writeNull();
    }

    buffer.endSequence();
  }
  buffer.endSequence();
}
```	
*/

import {
  MAX_SIGNED_INT32,
  MAX_UNSIGNED_INT32,
  MIN_SIGNED_INT32,
  MIN_UNSIGNED_INT32,
  ObjectType,
  ResponseInvalidCode,
} from './constants';
import { ResponseInvalidError } from './errors';
import { ResponseVarbind, Varbind } from './varbind.interfaces';

export function isVarbindError(varbind: Varbind): boolean {
  return (
    varbind.type == ObjectType.NoSuchObject ||
    varbind.type == ObjectType.NoSuchInstance ||
    varbind.type == ObjectType.EndOfMibView
  );
}

export function varbindError(varbind: Varbind): string {
  return ((varbind.type && ObjectType[varbind.type]) || 'NotAnError') + ': ' + varbind.oid;
}

export function oidFollowsOid(oidString: string, nextString: string) {
  interface Oid {
    str: string;
    len: number;
    idx: number;
  }
  const oid: Oid = {
    str: oidString,
    len: oidString.length,
    idx: 0,
  };
  const next: Oid = {
    str: nextString,
    len: nextString.length,
    idx: 0,
  };
  const dotCharCode = '.'.charCodeAt(0);

  function getNumber(item: Oid) {
    let num = 0;
    if (item.idx >= item.len) {
      return null;
    }
    while (item.idx < item.len) {
      const charCode = item.str.charCodeAt(item.idx++);
      if (charCode == dotCharCode) {
        return num;
      } else {
        num = (num ? num * 10 : num) + (charCode - 48);
      }
    }
    return num;
  }

  while (1) {
    const oidNumber = getNumber(oid);
    const nextNumber = getNumber(next);

    if (oidNumber !== null && nextNumber !== null) {
      if (nextNumber > oidNumber) {
        return true;
      } else if (nextNumber < oidNumber) {
        return false;
      }
    } else {
      return true;
    }
  }
}

export function iodInSubtree(oidString: string, nextString: string) {
  const oid = oidString.split('.');
  const next = nextString.split('.');

  if (oid.length > next.length) {
    return false;
  }

  for (let i = 0; i < oid.length; i++) {
    if (next[i] !== oid[i]) {
      return false;
    }
  }

  return true;
}

export function oidInSubtree(oidString: string, nextString: string): boolean {
  const oid = oidString.split('.');
  const next = nextString.split('.');

  if (oid.length > next.length) {
    return false;
  }

  for (let i = 0; i < oid.length; i++) {
    if (next[i] != oid[i]) {
      return false;
    }
  }

  return true;
}

// TODO: Check where this function is used for buffer type bc readInt node buffer does not have
// I think it comes from asn1-ber (reader)
export function readInt32(buffer: any): number {
  const parsedInt = buffer.readInt();
  if (!Number.isInteger(parsedInt)) {
    throw new TypeError('Value read as integer ' + parsedInt + ' is not an integer');
  }
  if (parsedInt < MIN_SIGNED_INT32 || parsedInt > MAX_SIGNED_INT32) {
    throw new RangeError('Read integer ' + parsedInt + ' is outside the signed 32-bit range');
  }
  return parsedInt;
}

export function readUint32(buffer: any): number {
  const parsedInt = buffer.readInt();
  if (!Number.isInteger(parsedInt)) {
    throw new TypeError('Value read as integer ' + parsedInt + ' is not an integer');
  }
  if (parsedInt < MIN_UNSIGNED_INT32 || parsedInt > MAX_UNSIGNED_INT32) {
    throw new RangeError('Read integer ' + parsedInt + ' is outside the unsigned 32-bit range');
  }
  return parsedInt;
}

export function readUint64(buffer: any): Buffer {
  const value = buffer.readString(ObjectType.Counter64, true);
  return value;
}

export function readIpAddress(buffer: any): string {
  const bytes = buffer.readString(ObjectType.IpAddress, true);
  if (bytes.length != 4) {
    throw new ResponseInvalidError(
      `Length '${bytes.length}' of IP address '${bytes.toString('hex')}' is not 4`,
      ResponseInvalidCode.EIp4AddressSize
    );
  }
  const value = bytes.join('.');
  return value;
}

export function readVarbindValue(buffer: any, type: number): any {
  let value: any;
  switch (type) {
    case ObjectType.Boolean:
      value = buffer.readBoolean();
      break;
    case ObjectType.Integer:
      value = readInt32(buffer);
      break;
    case ObjectType.BitString:
      value = buffer.readBitString();
      break;
    case ObjectType.OctetString:
      value = buffer.readString(null, true);
      break;
    case ObjectType.Null:
      buffer.readByte();
      buffer.readByte();
      value = null;
      break;
    case ObjectType.OID:
      value = buffer.readOID();
      break;
    case ObjectType.IpAddress:
      value = readIpAddress(buffer);
      break;
    case ObjectType.Counter:
      value = readUint32(buffer);
      break;
    case ObjectType.Gauge:
      value = readUint32(buffer);
      break;
    case ObjectType.TimeTicks:
      value = readUint32(buffer);
      break;
    case ObjectType.Opaque:
      value = buffer.readString(ObjectType.Opaque, true);
      break;
    case ObjectType.Counter64:
      value = readUint64(buffer);
      break;
    case ObjectType.NoSuchObject:
      buffer.readByte();
      buffer.readByte();
      value = null;
      break;
    case ObjectType.NoSuchInstance:
      buffer.readByte();
      buffer.readByte();
      value = null;
      break;
    case ObjectType.EndOfMibView:
      buffer.readByte();
      buffer.readByte();
      value = null;
      break;
    default:
      throw new ResponseInvalidError(
        `Unknown type '${type}' in response`,
        ResponseInvalidCode.EUnknownObjectType
      );
  }
  return value;
}

export function readVarbinds(buffer: any, varbinds: Varbind[] | ResponseVarbind[]): void {
  buffer.readSequence();
  while (1) {
    buffer.readSequence();
    if (buffer.peek() != ObjectType.OID) {
      break;
    }

    const oid = buffer.readOID();
    const type = buffer.peek();
    if (type == null) {
      break;
    }

    const value = readVarbindValue(buffer, type);
    varbinds.push({ oid, type, value });
  }
}

export function writeInt32(buffer: any, type: number, value: number) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Value to write as integer ${value} is not an integer`);
  }
  if (value < MIN_SIGNED_INT32 || value > MAX_SIGNED_INT32) {
    throw new RangeError(`Integer to write ${value} is outside the signed 32-bit range`);
  }
  buffer.writeInt(value, type);
}

export function writeUint32(buffer: any, type: number, value: number) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Value to write as integer ${value} is not an integer`);
  }
  if (value < MIN_UNSIGNED_INT32 || value > MAX_UNSIGNED_INT32) {
    throw new RangeError(`Integer to write ${value} is outside the unsigned 32-bit range`);
  }
  buffer.writeInt(value, type);
}

export function writeUint64(buffer: any, value: Buffer) {
  buffer.writeBuffer(value, ObjectType.Counter64);
}

export function writeVarbinds(buffer: any, varbinds: Varbind[] | ResponseVarbind[]) {
  buffer.startSequence();
  for (const varbind of varbinds) {
    buffer.startSequence();
    buffer.writeOID(varbind.oid);

    // TODO: Needed? Are type and value optionals?
    if (varbind.type && varbind.hasOwnProperty('value')) {
      const type = varbind.type;
      const value = varbind.value;
      switch (varbind.type) {
        case ObjectType.Boolean:
          buffer.writeBoolean(value ? true : false);
          break;
        case ObjectType.Integer: // also Integer32
          writeInt32(buffer, type, value);
          break;
        case ObjectType.OctetString:
          typeof value === 'string'
            ? buffer.writeString(value, type)
            : buffer.writeBuffer(value, type);
          break;
        case ObjectType.Null:
          buffer.writeNull();
          break;
        case ObjectType.OID:
          buffer.writeOID(value);
          break;
        case ObjectType.IpAddress:
          const bytes = value.split('.');
          if (bytes.length != 4) {
            throw new Error(`Invalid IP address '${value}'`);
          }
          buffer.writeBuffer(Buffer.from(bytes), type);
          break;
        case ObjectType.Counter: // also Counter32
          writeUint32(buffer, type, value);
          break;
        case ObjectType.Gauge: // also Gauge32
          writeUint32(buffer, type, value);
          break;
        case ObjectType.TimeTicks:
          writeUint32(buffer, type, value);
          break;
        case ObjectType.Opaque:
          buffer.writeBuffer(value, type);
          break;
        case ObjectType.Counter64:
          writeUint64(buffer, value);
          break;
        case ObjectType.NoSuchObject:
        case ObjectType.NoSuchInstance:
        case ObjectType.EndOfMibView:
          buffer.writeByte(type);
          buffer.writeByte(0);
          break;
        default:
          throw new Error(`Unknown type '${type}' in request`);
      }
    } else {
      buffer.writeNull();
    }
    buffer.endSequence();
  }
  buffer.endSequence();
}
