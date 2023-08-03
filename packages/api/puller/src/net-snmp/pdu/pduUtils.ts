/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var readPdu = function (reader, scoped) {
  var pdu;
  var contextEngineID;
  var contextName;
  if (scoped) {
    reader = new ber.Reader(
      reader.readString(ber.Sequence | ber.Constructor, true)
    );
    contextEngineID = reader.readString(ber.OctetString, true);
    contextName = reader.readString();
  }
  var type = reader.peek();

  if (type == PduType.GetResponse) {
    pdu = GetResponsePdu.createFromBuffer(reader);
  } else if (type == PduType.Report) {
    pdu = ReportPdu.createFromBuffer(reader);
  } else if (type == PduType.Trap) {
    pdu = TrapPdu.createFromBuffer(reader);
  } else if (type == PduType.TrapV2) {
    pdu = TrapV2Pdu.createFromBuffer(reader);
  } else if (type == PduType.InformRequest) {
    pdu = InformRequestPdu.createFromBuffer(reader);
  } else if (type == PduType.GetRequest) {
    pdu = GetRequestPdu.createFromBuffer(reader);
  } else if (type == PduType.SetRequest) {
    pdu = SetRequestPdu.createFromBuffer(reader);
  } else if (type == PduType.GetNextRequest) {
    pdu = GetNextRequestPdu.createFromBuffer(reader);
  } else if (type == PduType.GetBulkRequest) {
    pdu = GetBulkRequestPdu.createFromBuffer(reader);
  } else {
    throw new ResponseInvalidError(
      "Unknown PDU type '" + type + "' in response",
      ResponseInvalidCode.EUnknownPduType
    );
  }
  if (scoped) {
    pdu.contextEngineID = contextEngineID;
    pdu.contextName = contextName;
  }
  pdu.scoped = scoped;
  return pdu;
};

var createDiscoveryPdu = function (context) {
  return GetRequestPdu.createFromVariables(_generateId(), [], {
    context: context,
  });
};
```
*/

import { BerReader } from 'asn1-ber';
import {
  GetBulkRequestPdu,
  GetNextRequestPdu,
  GetRequestPdu,
  GetResponsePdu,
  InformRequestPdu,
  ReportPdu,
  SetRequestPdu,
  TrapPdu,
  TrapV2Pdu,
} from '.';
import { PduType, ResponseInvalidCode } from '../constants';
import { ResponseInvalidError } from '../errors';
// TODO: Require for types, with import they are not recognized
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ber = require('asn1-ber').Ber;

export type Pdu =
  | GetResponsePdu
  | ReportPdu
  | TrapPdu
  | TrapV2Pdu
  | InformRequestPdu
  | GetRequestPdu
  | SetRequestPdu
  | GetNextRequestPdu
  | GetBulkRequestPdu;

// TODO: DONE: Export function directly, not in a var
export function readPdu(reader: BerReader, scoped: boolean) {
  // Check types
  let pdu: Pdu;
  let contextEngineID: Buffer | null = null;
  let contextName: string | null = null;
  if (scoped) {
    reader = new BerReader(reader.readString(ber.Sequence | ber.Constructor, true));

    // TODO: Check, could return also buffer or null
    const readContextEngineID = reader.readString(ber.OctetString, true);
    const readContextName = reader.readString();
    contextEngineID = readContextEngineID ? (readContextEngineID as Buffer) : null;
    contextName = readContextName ? (readContextName as string) : null;
  }
  const type = reader.peek();

  switch (type) {
    case PduType.GetResponse:
      pdu = GetResponsePdu.createFromBuffer(reader);
      break;
    case PduType.Report:
      pdu = ReportPdu.createFromBuffer(reader);
      break;
    case PduType.Trap:
      pdu = TrapPdu.createFromBuffer(reader);
      break;
    case PduType.TrapV2:
      pdu = TrapV2Pdu.createFromBuffer(reader);
      break;
    case PduType.InformRequest:
      pdu = InformRequestPdu.createFromBuffer(reader);
      break;
    case PduType.GetRequest:
      pdu = GetRequestPdu.createFromBuffer(reader);
      break;
    case PduType.SetRequest:
      pdu = SetRequestPdu.createFromBuffer(reader);
      break;
    case PduType.GetNextRequest:
      pdu = GetNextRequestPdu.createFromBuffer(reader);
      break;
    case PduType.GetBulkRequest:
      pdu = GetBulkRequestPdu.createFromBuffer(reader);
      break;
    default:
      throw new ResponseInvalidError(
        "Unknown PDU type '" + type + "' in response",
        ResponseInvalidCode.EUnknownPduType
      );
  }

  if (scoped) {
    pdu.contextEngineID = contextEngineID;
    pdu.contextName = contextName;
  }
  pdu.scoped = scoped;
  return pdu;
}

export function createDiscoveryPdu(context: string) {
  return GetRequestPdu.createFromVariables(generateId(), [], {
    context: context,
  });
}

export function generateId(bitSize?: number): number {
  if (bitSize === 16) {
    return Math.floor(Math.random() * 10000) % 65535;
  }
  return Math.floor(Math.random() * 100000000) % 4294967295;
}
