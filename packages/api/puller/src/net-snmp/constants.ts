/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
function _expandConstantObject (object) {
	var keys = [];
	for (var key in object)
		keys.push (key);
	for (var i = 0; i < keys.length; i++)
		object[object[keys[i]]] = parseInt (keys[i]);
}

var ErrorStatus = {
	0: "NoError",
	1: "TooBig",
	2: "NoSuchName",
	3: "BadValue",
	4: "ReadOnly",
	5: "GeneralError",
	6: "NoAccess",
	7: "WrongType",
	8: "WrongLength",
	9: "WrongEncoding",
	10: "WrongValue",
	11: "NoCreation",
	12: "InconsistentValue",
	13: "ResourceUnavailable",
	14: "CommitFailed",
	15: "UndoFailed",
	16: "AuthorizationError",
	17: "NotWritable",
	18: "InconsistentName"
};

_expandConstantObject (ErrorStatus);

var ObjectType = {
	1: "Boolean",
	2: "Integer",
	3: "BitString",
	4: "OctetString",
	5: "Null",
	6: "OID",
	64: "IpAddress",
	65: "Counter",
	66: "Gauge",
	67: "TimeTicks",
	68: "Opaque",
	70: "Counter64",
	128: "NoSuchObject",
	129: "NoSuchInstance",
	130: "EndOfMibView"
};

_expandConstantObject (ObjectType);

// ASN.1
ObjectType.INTEGER = ObjectType.Integer;
ObjectType["OCTET STRING"] = ObjectType.OctetString;
ObjectType["OBJECT IDENTIFIER"] = ObjectType.OID;
// SNMPv2-SMI
ObjectType.Integer32 = ObjectType.Integer;
ObjectType.Counter32 = ObjectType.Counter;
ObjectType.Gauge32 = ObjectType.Gauge;
ObjectType.Unsigned32 = ObjectType.Gauge32;

var PduType = {
	160: "GetRequest",
	161: "GetNextRequest",
	162: "GetResponse",
	163: "SetRequest",
	164: "Trap",
	165: "GetBulkRequest",
	166: "InformRequest",
	167: "TrapV2",
	168: "Report"
};

_expandConstantObject (PduType);

var TrapType = {
	0: "ColdStart",
	1: "WarmStart",
	2: "LinkDown",
	3: "LinkUp",
	4: "AuthenticationFailure",
	5: "EgpNeighborLoss",
	6: "EnterpriseSpecific"
};

_expandConstantObject (TrapType);

var SecurityLevel = {
	1: "noAuthNoPriv",
	2: "authNoPriv",
	3: "authPriv"
};

_expandConstantObject (SecurityLevel);

var AuthProtocols = {
	"1": "none",
	"2": "md5",
	"3": "sha",
	"4": "sha224",
	"5": "sha256",
	"6": "sha384",
	"7": "sha512"
};

_expandConstantObject (AuthProtocols);

var PrivProtocols = {
	"1": "none",
	"2": "des",
	"4": "aes",
	"6": "aes256b",
	"8": "aes256r"
};

_expandConstantObject (PrivProtocols);

var UsmStatsBase = "1.3.6.1.6.3.15.1.1";

var UsmStats = {
	"1": "Unsupported Security Level",
	"2": "Not In Time Window",
	"3": "Unknown User Name",
	"4": "Unknown Engine ID",
	"5": "Wrong Digest (incorrect password, community or key)",
	"6": "Decryption Error"
};

_expandConstantObject (UsmStats);

var MibProviderType = {
	"1": "Scalar",
	"2": "Table"
};

_expandConstantObject (MibProviderType);

var Version1 = 0;
var Version2c = 1;
var Version3 = 3;

var Version = {
	"1": Version1,
	"2c": Version2c,
	"3": Version3
};

var AgentXPduType = {
	1: "Open",
	2: "Close",
	3: "Register",
	4: "Unregister",
	5: "Get",
	6: "GetNext",
	7: "GetBulk",
	8: "TestSet",
	9: "CommitSet",
	10: "UndoSet",
	11: "CleanupSet",
	12: "Notify",
	13: "Ping",
	14: "IndexAllocate",
	15: "IndexDeallocate",
	16: "AddAgentCaps",
	17: "RemoveAgentCaps",
	18: "Response"
};

_expandConstantObject (AgentXPduType);

var AccessControlModelType = {
	0: "None",
	1: "Simple"
};

_expandConstantObject (AccessControlModelType);

var AccessLevel = {
	0: "None",
	1: "ReadOnly",
	2: "ReadWrite"
};

_expandConstantObject (AccessLevel);

// SMIv2 MAX-ACCESS values
var MaxAccess = {
	0: "not-accessible",
	1: "accessible-for-notify",
	2: "read-only",
	3: "read-write",
	4: "read-create"
};

_expandConstantObject (MaxAccess);

// SMIv1 ACCESS value mapping to SMIv2 MAX-ACCESS
var AccessToMaxAccess = {
	"not-accessible": "not-accessible",
	"read-only": "read-only",
	"read-write": "read-write",
	"write-only": "read-write"
};

var RowStatus = {
	// status values
	1: "active",
	2: "notInService",
	3: "notReady",

	// actions
	4: "createAndGo",
	5: "createAndWait",
	6: "destroy"
};

_expandConstantObject (RowStatus);

var ResponseInvalidCode = {
	1: "EIp4AddressSize",
	2: "EUnknownObjectType",
	3: "EUnknownPduType",
	4: "ECouldNotDecrypt",
	5: "EAuthFailure",
	6: "EReqResOidNoMatch",
//	7: "ENonRepeaterCountMismatch",  // no longer used
	8: "EOutOfOrder",
	9: "EVersionNoMatch",
	10: "ECommunityNoMatch",
	11: "EUnexpectedReport",
	12: "EResponseNotHandled",
	13: "EUnexpectedResponse"
};

_expandConstantObject (ResponseInvalidCode);
``` 
*/

export const MIN_SIGNED_INT32 = -2147483648;
export const MAX_SIGNED_INT32 = 2147483647;
export const MIN_UNSIGNED_INT32 = 0;
export const MAX_UNSIGNED_INT32 = 4294967295;

export enum ErrorStatus {
  NoError = 0,
  TooBig = 1,
  NoSuchName = 2,
  BadValue = 3,
  ReadOnly = 4,
  GeneralError = 5,
  NoAccess = 6,
  WrongType = 7,
  WrongLength = 8,
  WrongEncoding = 9,
  WrongValue = 10,
  NoCreation = 11,
  InconsistentValue = 12,
  ResourceUnavailable = 13,
  CommitFailed = 14,
  UndoFailed = 15,
  AuthorizationError = 16,
  NotWritable = 17,
  InconsistentName = 18,
}

export enum ObjectType {
  Boolean = 1,
  Integer = 2,
  BitString = 3,
  OctetString = 4,
  Null = 5,
  OID = 6,
  IpAddress = 64,
  Counter = 65,
  Gauge = 66,
  TimeTicks = 67,
  Opaque = 68,
  Counter64 = 70,
  NoSuchObject = 128,
  NoSuchInstance = 129,
  EndOfMibView = 130,
  // ASN.1
  INTEGER = 2,
  'OCTET STRING' = 4,
  'OBJECT IDENTIFIER' = 6,
  // SNMPv2-SMI
  Integer32 = 2,
  Counter32 = 65,
  Gauge32 = 66,
  Unsigned32 = 66,
}

export enum PduType {
  GetRequest = 160,
  GetNextRequest = 161,
  GetResponse = 162,
  SetRequest = 163,
  Trap = 164,
  GetBulkRequest = 165,
  InformRequest = 166,
  TrapV2 = 167,
  Report = 168,
}

export enum TrapType {
  ColdStart = 0,
  WarmStart = 1,
  LinkDown = 2,
  LinkUp = 3,
  AuthenticationFailure = 4,
  EgpNeighborLoss = 5,
  EnterpriseSpecific = 6,
}

export enum SecurityLevel {
  noAuthNoPriv = 1,
  authNoPriv = 2,
  authPriv = 3,
}

export enum AuthProtocols {
  none = 1,
  md5 = 2,
  sha = 3,
  sha224 = 4,
  sha256 = 5,
  sha384 = 6,
  sha512 = 7,
}

export enum PrivProtocols {
  none = 1,
  des = 2,
  aes = 4,
  aes256b = 6,
  aes256r = 8,
}

export const UsmStatsBase = '1.3.6.1.6.3.15.1.1';

export enum UsmStats {
  'Unsupported Security Level' = 1,
  'Not In Time Window' = 2,
  'Unknown User Name' = 3,
  'Unknown Engine ID' = 4,
  'Wrong Digest (incorrect password, community or key)' = 5,
  'Decryption Error' = 6,
}

export enum MibProviderType {
  Scalar = 1,
  Table = 2,
}

export const Version1 = 0;
export const Version2c = 1;
export const Version3 = 3;

// TODO: Not changed to enum bc expand constant object is not applied
export const Version = {
  '1': Version1,
  '2c': Version2c,
  '3': Version3,
};

export enum AgentXPduType {
  Open = 1,
  Close = 2,
  Register = 3,
  Unregister = 4,
  Get = 5,
  GetNext = 6,
  GetBulk = 7,
  TestSet = 8,
  CommitSet = 9,
  UndoSet = 10,
  CleanupSet = 11,
  Notify = 12,
  Ping = 13,
  IndexAllocate = 14,
  IndexDeallocate = 15,
  AddAgentCaps = 16,
  RemoveAgentCaps = 17,
  Response = 18,
}

export enum AccessControlModelType {
  None = 0,
  Simple = 1,
}

export enum AccessLevel {
  None = 0,
  ReadOnly = 1,
  ReadWrite = 2,
}

// SMIv2 MAX-ACCESS values
export enum MaxAccess {
  'not-accessible' = 0,
  'accessible-for-notify' = 1,
  'read-only' = 2,
  'read-write' = 3,
  'read-create' = 4,
}

// SMIv1 ACCESS value mapping to SMIv2 MAX-ACCESS
export enum AccessToMaxAccess {
  'not-accessible' = 'not-accessible',
  'read-only' = 'read-only',
  'read-write' = 'read-write',
  'write-only' = 'read-write',
}

export enum RowStatus {
  // status values
  active = 1,
  notInService = 2,
  notReady = 3,
  // actions
  createAndGo = 4,
  createAndWait = 5,
  destroy = 6,
}

export enum ResponseInvalidCode {
  EIp4AddressSize = 1,
  EUnknownObjectType = 2,
  EUnknownPduType = 3,
  ECouldNotDecrypt = 4,
  EAuthFailure = 5,
  EReqResOidNoMatch = 6,
  // ENonRepeaterCountMismatch = 7,  // no longer used
  EOutOfOrder = 8,
  EVersionNoMatch = 9,
  ECommunityNoMatch = 10,
  EUnexpectedReport = 11,
  EResponseNotHandled = 12,
  EUnexpectedResponse = 13,
}
