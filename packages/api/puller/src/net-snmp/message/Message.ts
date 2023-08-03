/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js
var Message = function () {};

Message.prototype.getReqId = function () {
  return this.version == Version3 ? this.msgGlobalData.msgID : this.pdu.id;
};

Message.prototype.toBuffer = function () {
  if (this.version == Version3) {
    return this.toBufferV3();
  } else {
    return this.toBufferCommunity();
  }
};

Message.prototype.toBufferCommunity = function () {
  if (this.buffer) return this.buffer;

  var writer = new ber.Writer();

  writer.startSequence();

  writeInt32(writer, ObjectType.Integer, this.version);
  writer.writeString(this.community);

  this.pdu.toBuffer(writer);

  writer.endSequence();

  this.buffer = writer.buffer;

  return this.buffer;
};

Message.prototype.toBufferV3 = function () {
  var encryptionResult;

  if (this.buffer) return this.buffer;

  // ScopedPDU
  var scopedPduWriter = new ber.Writer();
  scopedPduWriter.startSequence();
  var contextEngineID = this.pdu.contextEngineID
    ? this.pdu.contextEngineID
    : this.msgSecurityParameters.msgAuthoritativeEngineID;
  if (contextEngineID.length == 0) {
    scopedPduWriter.writeString("");
  } else {
    scopedPduWriter.writeBuffer(contextEngineID, ber.OctetString);
  }
  scopedPduWriter.writeString(this.pdu.contextName);
  this.pdu.toBuffer(scopedPduWriter);
  scopedPduWriter.endSequence();

  if (this.hasPrivacy()) {
    var authoritativeEngine = {
      engineID: this.msgSecurityParameters.msgAuthoritativeEngineID,
      engineBoots: this.msgSecurityParameters.msgAuthoritativeEngineBoots,
      engineTime: this.msgSecurityParameters.msgAuthoritativeEngineTime,
    };
    encryptionResult = Encryption.encryptPdu(
      this.user.privProtocol,
      scopedPduWriter.buffer,
      this.user.privKey,
      this.user.authProtocol,
      authoritativeEngine
    );
  }

  var writer = new ber.Writer();

  writer.startSequence();

  writeInt32(writer, ObjectType.Integer, this.version);

  // HeaderData
  writer.startSequence();
  writeInt32(writer, ObjectType.Integer, this.msgGlobalData.msgID);
  writeInt32(writer, ObjectType.Integer, this.msgGlobalData.msgMaxSize);
  writer.writeByte(ber.OctetString);
  writer.writeByte(1);
  writer.writeByte(this.msgGlobalData.msgFlags);
  writeInt32(writer, ObjectType.Integer, this.msgGlobalData.msgSecurityModel);
  writer.endSequence();

  // msgSecurityParameters
  writer.startSequence(ber.OctetString);
  writer.startSequence();
  //writer.writeString (this.msgSecurityParameters.msgAuthoritativeEngineID);
  // writing a zero-length buffer fails - should fix asn1-ber for this condition
  if (this.msgSecurityParameters.msgAuthoritativeEngineID.length == 0) {
    writer.writeString("");
  } else {
    writer.writeBuffer(
      this.msgSecurityParameters.msgAuthoritativeEngineID,
      ber.OctetString
    );
  }
  writeInt32(
    writer,
    ObjectType.Integer,
    this.msgSecurityParameters.msgAuthoritativeEngineBoots
  );
  writeInt32(
    writer,
    ObjectType.Integer,
    this.msgSecurityParameters.msgAuthoritativeEngineTime
  );
  writer.writeString(this.msgSecurityParameters.msgUserName);

  var msgAuthenticationParameters = "";
  if (this.hasAuthentication()) {
    var authParametersLength = Authentication.getParametersLength(
      this.user.authProtocol
    );
    msgAuthenticationParameters = Buffer.alloc(authParametersLength);
    writer.writeBuffer(msgAuthenticationParameters, ber.OctetString);
  } else {
    writer.writeString("");
  }
  var msgAuthenticationParametersOffset =
    writer._offset - msgAuthenticationParameters.length;

  if (this.hasPrivacy()) {
    writer.writeBuffer(
      encryptionResult.msgPrivacyParameters,
      ber.OctetString
    );
  } else {
    writer.writeString("");
  }
  msgAuthenticationParametersOffset -= writer._offset;
  writer.endSequence();
  writer.endSequence();
  msgAuthenticationParametersOffset += writer._offset;

  if (this.hasPrivacy()) {
    writer.writeBuffer(encryptionResult.encryptedPdu, ber.OctetString);
  } else {
    writer.writeBuffer(scopedPduWriter.buffer);
  }

  msgAuthenticationParametersOffset -= writer._offset;
  writer.endSequence();
  msgAuthenticationParametersOffset += writer._offset;

  this.buffer = writer.buffer;

  if (this.hasAuthentication()) {
    msgAuthenticationParameters = this.buffer.subarray(
      msgAuthenticationParametersOffset,
      msgAuthenticationParametersOffset + msgAuthenticationParameters.length
    );
    Authentication.writeParameters(
      this.buffer,
      this.user.authProtocol,
      this.user.authKey,
      this.msgSecurityParameters.msgAuthoritativeEngineID,
      msgAuthenticationParameters
    );
  }

  return this.buffer;
};

Message.prototype.processIncomingSecurity = function (user, responseCb) {
  if (this.hasPrivacy()) {
    if (!this.decryptPdu(user, responseCb)) {
      return false;
    }
  }

  if (this.hasAuthentication() && !this.isAuthenticationDisabled()) {
    return this.checkAuthentication(user, responseCb);
  } else {
    return true;
  }
};

Message.prototype.decryptPdu = function (user, responseCb) {
  var decryptedPdu;
  var decryptedPduReader;
  try {
    var authoratitiveEngine = {
      engineID: this.msgSecurityParameters.msgAuthoritativeEngineID,
      engineBoots: this.msgSecurityParameters.msgAuthoritativeEngineBoots,
      engineTime: this.msgSecurityParameters.msgAuthoritativeEngineTime,
    };
    decryptedPdu = Encryption.decryptPdu(
      user.privProtocol,
      this.encryptedPdu,
      this.msgSecurityParameters.msgPrivacyParameters,
      user.privKey,
      user.authProtocol,
      authoratitiveEngine
    );
    decryptedPduReader = new ber.Reader(decryptedPdu);
    this.pdu = readPdu(decryptedPduReader, true);
    return true;
  } catch (error) {
    responseCb(
      new ResponseInvalidError(
        "Failed to decrypt PDU: " + error,
        ResponseInvalidCode.ECouldNotDecrypt
      )
    );
    return false;
  }
};

Message.prototype.checkAuthentication = function (user, responseCb) {
  if (
    Authentication.isAuthentic(
      this.buffer,
      user.authProtocol,
      user.authKey,
      this.msgSecurityParameters.msgAuthoritativeEngineID,
      this.msgSecurityParameters.msgAuthenticationParameters
    )
  ) {
    return true;
  } else {
    responseCb(
      new ResponseInvalidError(
        "Authentication digest " +
          this.msgSecurityParameters.msgAuthenticationParameters.toString(
            "hex"
          ) +
          " received in message does not match digest " +
          Authentication.calculateDigest(
            this.buffer,
            user.authProtocol,
            user.authKey,
            this.msgSecurityParameters.msgAuthoritativeEngineID
          ).toString("hex") +
          " calculated for message",
        ResponseInvalidCode.EAuthFailure,
        { user }
      )
    );
    return false;
  }
};

Message.prototype.setMsgFlags = function (bitPosition, flag) {
  if (
    this.msgGlobalData &&
    this.msgGlobalData !== undefined &&
    this.msgGlobalData !== null
  ) {
    if (flag) {
      this.msgGlobalData.msgFlags =
        this.msgGlobalData.msgFlags | (2 ** bitPosition);
    } else {
      this.msgGlobalData.msgFlags =
        this.msgGlobalData.msgFlags & (255 - 2 ** bitPosition);
    }
  }
};

Message.prototype.hasAuthentication = function () {
  return (
    this.msgGlobalData &&
    this.msgGlobalData.msgFlags &&
    this.msgGlobalData.msgFlags & 1
  );
};

Message.prototype.setAuthentication = function (flag) {
  this.setMsgFlags(0, flag);
};

Message.prototype.hasPrivacy = function () {
  return (
    this.msgGlobalData &&
    this.msgGlobalData.msgFlags &&
    this.msgGlobalData.msgFlags & 2
  );
};

Message.prototype.setPrivacy = function (flag) {
  this.setMsgFlags(1, flag);
};

Message.prototype.isReportable = function () {
  return (
    this.msgGlobalData &&
    this.msgGlobalData.msgFlags &&
    this.msgGlobalData.msgFlags & 4
  );
};

Message.prototype.setReportable = function (flag) {
  this.setMsgFlags(2, flag);
};

Message.prototype.isAuthenticationDisabled = function () {
  return this.disableAuthentication;
};

Message.prototype.hasAuthoritativeEngineID = function () {
  return (
    this.msgSecurityParameters &&
    this.msgSecurityParameters.msgAuthoritativeEngineID &&
    this.msgSecurityParameters.msgAuthoritativeEngineID != ""
  );
};

Message.prototype.createReportResponseMessage = function (engine, context) {
  var user = {
    name: "",
    level: SecurityLevel.noAuthNoPriv,
  };
  var responseSecurityParameters = {
    msgAuthoritativeEngineID: engine.engineID,
    msgAuthoritativeEngineBoots: engine.engineBoots,
    msgAuthoritativeEngineTime: engine.engineTime,
    msgUserName: user.name,
    msgAuthenticationParameters: "",
    msgPrivacyParameters: "",
  };
  var reportPdu = ReportPdu.createFromVariables(this.pdu.id, [], {});
  reportPdu.contextName = context;
  var responseMessage = Message.createRequestV3(
    user,
    responseSecurityParameters,
    reportPdu
  );
  responseMessage.msgGlobalData.msgID = this.msgGlobalData.msgID;
  return responseMessage;
};

Message.prototype.createResponseForRequest = function (responsePdu) {
  if (this.version == Version3) {
    return this.createV3ResponseFromRequest(responsePdu);
  } else {
    return this.createCommunityResponseFromRequest(responsePdu);
  }
};

Message.prototype.createCommunityResponseFromRequest = function (
  responsePdu
) {
  return Message.createCommunity(this.version, this.community, responsePdu);
};

Message.prototype.createV3ResponseFromRequest = function (responsePdu) {
  var responseUser = {
    name: this.user.name,
    level: this.user.level,
    authProtocol: this.user.authProtocol,
    authKey: this.user.authKey,
    privProtocol: this.user.privProtocol,
    privKey: this.user.privKey,
  };
  var responseSecurityParameters = {
    msgAuthoritativeEngineID:
      this.msgSecurityParameters.msgAuthoritativeEngineID,
    msgAuthoritativeEngineBoots:
      this.msgSecurityParameters.msgAuthoritativeEngineBoots,
    msgAuthoritativeEngineTime:
      this.msgSecurityParameters.msgAuthoritativeEngineTime,
    msgUserName: this.msgSecurityParameters.msgUserName,
    msgAuthenticationParameters: "",
    msgPrivacyParameters: "",
  };
  var responseGlobalData = {
    msgID: this.msgGlobalData.msgID,
    msgMaxSize: 65507,
    msgFlags: this.msgGlobalData.msgFlags & (255 - 4),
    msgSecurityModel: 3,
  };
  return Message.createV3(
    responseUser,
    responseGlobalData,
    responseSecurityParameters,
    responsePdu
  );
};

Message.createCommunity = function (version, community, pdu) {
  var message = new Message();

  message.version = version;
  message.community = community;
  message.pdu = pdu;

  return message;
};

Message.createRequestV3 = function (user, msgSecurityParameters, pdu) {
  var authFlag =
    user.level == SecurityLevel.authNoPriv ||
    user.level == SecurityLevel.authPriv
      ? 1
      : 0;
  var privFlag = user.level == SecurityLevel.authPriv ? 1 : 0;
  var reportableFlag =
    pdu.type == PduType.GetResponse || pdu.type == PduType.TrapV2 ? 0 : 1;
  var msgGlobalData = {
    msgID: _generateId(), // random ID
    msgMaxSize: 65507,
    msgFlags: (reportableFlag * 4) | (privFlag * 2) | (authFlag * 1),
    msgSecurityModel: 3,
  };
  return Message.createV3(user, msgGlobalData, msgSecurityParameters, pdu);
};

Message.createV3 = function (
  user,
  msgGlobalData,
  msgSecurityParameters,
  pdu
) {
  var message = new Message();

  message.version = 3;
  message.user = user;
  message.msgGlobalData = msgGlobalData;
  message.msgSecurityParameters = {
    msgAuthoritativeEngineID:
      msgSecurityParameters.msgAuthoritativeEngineID || Buffer.from(""),
    msgAuthoritativeEngineBoots:
      msgSecurityParameters.msgAuthoritativeEngineBoots || 0,
    msgAuthoritativeEngineTime:
      msgSecurityParameters.msgAuthoritativeEngineTime || 0,
    msgUserName: user.name || "",
    msgAuthenticationParameters: "",
    msgPrivacyParameters: "",
  };
  message.pdu = pdu;

  return message;
};

Message.createDiscoveryV3 = function (pdu) {
  var msgSecurityParameters = {
    msgAuthoritativeEngineID: Buffer.from(""),
    msgAuthoritativeEngineBoots: 0,
    msgAuthoritativeEngineTime: 0,
  };
  var emptyUser = {
    name: "",
    level: SecurityLevel.noAuthNoPriv,
  };
  return Message.createRequestV3(emptyUser, msgSecurityParameters, pdu);
};

Message.createFromBuffer = function (buffer, user) {
  var reader = new ber.Reader(buffer);
  var message = new Message();

  reader.readSequence();

  message.version = readInt32(reader);

  if (message.version != 3) {
    message.community = reader.readString();
    message.pdu = readPdu(reader, false);
  } else {
    // HeaderData
    message.msgGlobalData = {};
    reader.readSequence();
    message.msgGlobalData.msgID = readInt32(reader);
    message.msgGlobalData.msgMaxSize = readInt32(reader);
    message.msgGlobalData.msgFlags = reader.readString(
      ber.OctetString,
      true
    )[0];
    message.msgGlobalData.msgSecurityModel = readInt32(reader);

    // msgSecurityParameters
    message.msgSecurityParameters = {};
    var msgSecurityParametersReader = new ber.Reader(
      reader.readString(ber.OctetString, true)
    );
    msgSecurityParametersReader.readSequence();
    message.msgSecurityParameters.msgAuthoritativeEngineID =
      msgSecurityParametersReader.readString(ber.OctetString, true);
    message.msgSecurityParameters.msgAuthoritativeEngineBoots = readInt32(
      msgSecurityParametersReader
    );
    message.msgSecurityParameters.msgAuthoritativeEngineTime = readInt32(
      msgSecurityParametersReader
    );
    message.msgSecurityParameters.msgUserName =
      msgSecurityParametersReader.readString();
    message.msgSecurityParameters.msgAuthenticationParameters =
      msgSecurityParametersReader.readString(ber.OctetString, true);
    message.msgSecurityParameters.msgPrivacyParameters = Buffer.from(
      msgSecurityParametersReader.readString(ber.OctetString, true)
    );

    if (message.hasPrivacy()) {
      message.encryptedPdu = reader.readString(ber.OctetString, true);
      message.pdu = null;
    } else {
      message.pdu = readPdu(reader, true);
    }
  }

  message.buffer = buffer;

  return message;
};
```
*/

import { BerReader, BerWriter, ber } from 'asn1-ber';
import { Authentication } from '../authentication';
import { ObjectType, PduType, ResponseInvalidCode, SecurityLevel, Version3 } from '../constants';
import { Encryption } from '../encryption';
import { ResponseInvalidError } from '../errors';
import { readInt32, writeInt32 } from '../helpers';
import { ReportPdu, TrapPdu } from '../pdu';
import { generateId, readPdu } from '../pdu/pduUtils';
import { SimplePdu } from '../pdu/requests/SimplePdu';
import { SimpleResponsePdu } from '../pdu/responses/SimpleResponsePdu';

export class Message {
  private _version: number;
  private _msgGlobalData: any;
  private _pdu: SimplePdu | TrapPdu | SimpleResponsePdu | null;
  private _encryptedPdu: any;
  private _community: string;
  private _msgSecurityParameters: any;
  private _disableAuthentication: boolean;
  private _user: any;
  private _buffer: Buffer;
  constructor() {
    // Empty constructor
  }

  // ---------------------------- GETTER AND SETTERS ----------------------------
  public get version(): any {
    return this._version;
  }

  public set version(value: any) {
    this._version = value;
  }

  public get community(): any {
    return this._community;
  }

  public set community(value: any) {
    this._community = value;
  }

  public get pdu(): SimplePdu | TrapPdu | SimpleResponsePdu | null {
    return this._pdu;
  }

  public set pdu(value: SimplePdu | TrapPdu | SimpleResponsePdu | null) {
    this._pdu = value;
  }

  public get user(): any {
    return this._user;
  }

  public set user(value: any) {
    this._user = value;
  }

  public get msgGlobalData(): any {
    return this._msgGlobalData;
  }

  public set msgGlobalData(value: any) {
    this._msgGlobalData = value;
  }

  public get msgSecurityParameters(): any {
    return this._msgSecurityParameters;
  }

  public set msgSecurityParameters(value: any) {
    this._msgSecurityParameters = value;
  }

  public get encryptedPdu(): any {
    return this._encryptedPdu;
  }

  public set encryptedPdu(value: any) {
    this._encryptedPdu = value;
  }

  public get buffer(): any {
    return this._buffer;
  }

  public set buffer(value: any) {
    this._buffer = value;
  }

  public set disableAuthentication(value: boolean) {
    this._disableAuthentication = value;
  }

  // ------------------------------------------------------------

  public getReqId(): number {
    return this._version == Version3 ? this._msgGlobalData.msgID : this._pdu?.id;
  }

  public toBuffer() {
    if (this._version == Version3) {
      return this.toBufferV3();
    } else {
      return this.toBufferCommunity();
    }
  }

  public toBufferCommunity(): Buffer {
    if (this._buffer) {
      return this._buffer;
    }

    const writer = new BerWriter();

    writer.startSequence();
    writeInt32(writer, ObjectType.Integer, this._version);
    writer.writeString(this._community);
    this._pdu?.toBuffer(writer);
    writer.endSequence();

    this._buffer = writer.buffer;
    return writer.buffer;
  }

  public toBufferV3(): Buffer {
    if (this._buffer) {
      return this._buffer;
    }

    const scopedPduWriter = new BerWriter();
    scopedPduWriter.startSequence();

    const contextEngineID = this._pdu?.contextEngineID
      ? this._pdu.contextEngineID
      : this._msgSecurityParameters.msgAuthoritativeEngineID;
    if (contextEngineID.length == 0) {
      scopedPduWriter.writeString('');
    } else {
      scopedPduWriter.writeBuffer(contextEngineID, BerWriter.OctetString);
    }
    scopedPduWriter.writeString(this._pdu?.contextName);
    this._pdu?.toBuffer(scopedPduWriter);
    scopedPduWriter.endSequence();

    // Privacy
    let encryptionResult: any;
    if (this.hasPrivacy()) {
      const authoritativeEngine = {
        engineID: this._msgSecurityParameters.msgAuthoritativeEngineID,
        engineBoots: this._msgSecurityParameters.msgAuthoritativeEngineBoots,
        engineTime: this._msgSecurityParameters.msgAuthoritativeEngineTime,
      };
      encryptionResult = Encryption.encryptPdu(
        this._user.privProtocol,
        scopedPduWriter.buffer,
        this._user.privKey,
        this._user.authProtocol,
        authoritativeEngine
      );
    }

    const writer = new BerWriter();
    writer.startSequence();
    writeInt32(writer, ObjectType.Integer, this._version);

    // HeaderData
    writer.startSequence();
    writeInt32(writer, ObjectType.Integer, this._msgGlobalData.msgID);
    writeInt32(writer, ObjectType.Integer, this._msgGlobalData.msgMaxSize);
    writer.writeByte(ber.OctetString);
    writer.writeByte(1);
    writer.writeByte(this._msgGlobalData.msgFlags);
    writeInt32(writer, ObjectType.Integer, this._msgGlobalData.msgSecurityModel);
    writer.endSequence();

    // msgSecurityParameters
    writer.startSequence(ber.OctetString);
    writer.startSequence();
    //writer.writeString (this.msgSecurityParameters.msgAuthoritativeEngineID);
    // writing a zero-length buffer fails - should fix asn1-ber for this condition
    if (this._msgSecurityParameters.msgAuthoritativeEngineID.length == 0) {
      writer.writeString('');
    } else {
      writer.writeBuffer(this._msgSecurityParameters.msgAuthoritativeEngineID, ber.OctetString);
    }
    writeInt32(writer, ObjectType.Integer, this._msgSecurityParameters.msgAuthoritativeEngineBoots);
    writeInt32(writer, ObjectType.Integer, this._msgSecurityParameters.msgAuthoritativeEngineTime);
    writer.writeString(this._msgSecurityParameters.msgUserName);

    // Authentication
    let msgAuthenticationParameters: string | Buffer = '';
    if (this.hasAuthentication()) {
      const authParametersLength = Authentication.getParametersLength(this._user.authProtocol);
      const msgAuthenticationParameters = Buffer.alloc(authParametersLength);
      writer.writeBuffer(msgAuthenticationParameters, ber.OctetString);
    } else {
      writer.writeString('');
    }

    let msgAuthenticationParametersOffset = writer._offset - msgAuthenticationParameters.length;

    // Privacy
    if (this.hasPrivacy()) {
      writer.writeBuffer(encryptionResult.msgPrivacyParameters, ber.OctetString);
    } else {
      writer.writeString('');
    }
    msgAuthenticationParametersOffset -= writer._offset;
    writer.endSequence();
    writer.endSequence();
    msgAuthenticationParametersOffset += writer._offset;

    if (this.hasPrivacy()) {
      writer.writeBuffer(encryptionResult.encryptedPdu, ber.OctetString);
    } else {
      writer.writeBuffer(scopedPduWriter.buffer);
    }
    msgAuthenticationParametersOffset -= writer._offset;
    writer.endSequence();
    msgAuthenticationParametersOffset += writer._offset;

    // Authentication
    this._buffer = writer.buffer;
    if (this.hasAuthentication()) {
      msgAuthenticationParameters = this._buffer.subarray(
        msgAuthenticationParametersOffset,
        msgAuthenticationParametersOffset + msgAuthenticationParameters.length
      );
      Authentication.writeParameters(
        this._buffer,
        this._user.authProtocol,
        this._user.authKey,
        this._msgSecurityParameters.msgAuthoritativeEngineID,
        msgAuthenticationParameters
      );
    }

    return this._buffer;
  }

  public processIncomingSecurity(user: any, responseCb: any): boolean {
    if (this.hasPrivacy() && !this.decryptPdu(user, responseCb)) {
      return false;
    }

    if (this.hasAuthentication() && !this.isAuthenticationDisabled()) {
      return this.checkAuthentication(user, responseCb);
    } else {
      return true;
    }
  }

  public decryptPdu(user: any, responseCb: any): boolean {
    try {
      const authoritativeEngine = {
        engineID: this._msgSecurityParameters.msgAuthoritativeEngineID,
        engineBoots: this._msgSecurityParameters.msgAuthoritativeEngineBoots,
        engineTime: this._msgSecurityParameters.msgAuthoritativeEngineTime,
      };
      const decryptedPdu = Encryption.decryptPdu(
        user.privProtocol,
        this._encryptedPdu,
        this._msgSecurityParameters.msgPrivacyParameters,
        user.privKey,
        user.authProtocol,
        authoritativeEngine
      );
      const decryptedPduReader = new BerReader(decryptedPdu);
      this._pdu = readPdu(decryptedPduReader, true);
      return true;
    } catch (error) {
      responseCb(
        new ResponseInvalidError(
          `Failed to decrypt PDU: ${error}`,
          ResponseInvalidCode.ECouldNotDecrypt
        )
      );
      return false;
    }
  }

  public checkAuthentication(user: any, responseCb: any): boolean {
    if (
      Authentication.isAuthentic(
        this._buffer,
        user.authProtocol,
        user.authKey,
        this._msgSecurityParameters.msgAuthoritativeEngineID,
        this._msgSecurityParameters.msgAuthenticationParameters
      )
    ) {
      return true;
    } else {
      const msgAuthParamsStr =
        this._msgSecurityParameters.msgAuthenticationParameters.toString('hex');
      const digestStr = Authentication.calculateDigest(
        this._buffer,
        user.authProtocol,
        user.authKey,
        this._msgSecurityParameters.msgAuthoritativeEngineID
      ).toString('hex');
      responseCb(
        new ResponseInvalidError(
          `Authentication digest: ${msgAuthParamsStr} received in message does not match digest ${digestStr} calculated for message.}`,
          ResponseInvalidCode.EAuthFailure,
          { user }
        )
      );
      return false;
    }
  }

  public setMsgFlags(bitPosition: number, flag: boolean): void {
    // TODO: I would remove first check
    if (this._msgGlobalData && this._msgGlobalData !== undefined && this._msgGlobalData !== null) {
      if (flag) {
        this._msgGlobalData.msgFlags = this._msgGlobalData.msgFlags | (2 ** bitPosition);
      } else {
        this._msgGlobalData.msgFlags = this._msgGlobalData.msgFlags & (255 - 2 ** bitPosition);
      }
    }
  }

  public hasAuthentication(): boolean {
    return this._msgGlobalData && this._msgGlobalData.msgFlags && this._msgGlobalData.msgFlags & 1;
  }

  public setAuthentication(flag: boolean): void {
    this.setMsgFlags(0, flag);
  }

  public hasPrivacy(): boolean {
    return this._msgGlobalData && this._msgGlobalData.msgFlags && this._msgGlobalData.msgFlags & 2;
  }

  public setPrivacy(flag: boolean): void {
    this.setMsgFlags(1, flag);
  }

  public isReportable(): boolean {
    return this._msgGlobalData && this._msgGlobalData.msgFlags && this._msgGlobalData.msgFlags & 4;
  }

  public setReportable(flag: boolean): void {
    this.setMsgFlags(2, flag);
  }

  public isAuthenticationDisabled(): boolean {
    return this._disableAuthentication;
  }

  public hasAuthoritativeEngineID(): boolean {
    return (
      this._msgSecurityParameters &&
      this._msgSecurityParameters.msgAuthoritativeEngineID &&
      this._msgSecurityParameters.msgAuthoritativeEngineID.length != ''
    );
  }

  public createReportResponseMessage(engine: any, context: string): any {
    const user = {
      name: '',
      level: SecurityLevel.noAuthNoPriv,
    };
    const responseSecurityParameters = {
      msgAuthoritativeEngineID: engine.engineID,
      msgAuthoritativeEngineBoots: engine.engineBoots,
      msgAuthoritativeEngineTime: engine.engineTime,
      msgUserName: user.name,
      msgAuthenticationParameters: '',
      msgPrivacyParameters: '',
    };
    // TODO: Check use of !
    const reportPdu = ReportPdu.createFromVariables(this._pdu!.id, [], {});
    reportPdu.contextName = context;

    const responseMessage = Message.createRequestV3(user, responseSecurityParameters, reportPdu);
    responseMessage.msgGlobalData.msgID = this._msgGlobalData.msgID;
    return responseMessage;
  }

  public createResponseForRequest(responsePdu: any): any {
    if (this._version == Version3) {
      return this.createV3ResponseFromRequest(responsePdu);
    } else {
      return this.createCommunityResponseForRequest(responsePdu);
    }
  }

  public createCommunityResponseForRequest(responsePdu: any): any {
    return Message.createCommunity(this._version, this._community, responsePdu);
  }

  public createV3ResponseFromRequest(responsePdu: any): any {
    const responseUser = {
      name: this._user.name,
      level: this._user.level,
      authProtocol: this._user.authProtocol,
      authKey: this._user.authKey,
      privProtocol: this._user.privProtocol,
      privKey: this._user.privKey,
    };
    const responseSecurityParameters = {
      msgAuthoritativeEngineID: this._msgSecurityParameters.msgAuthoritativeEngineID,
      msgAuthoritativeEngineBoots: this._msgSecurityParameters.msgAuthoritativeEngineBoots,
      msgAuthoritativeEngineTime: this._msgSecurityParameters.msgAuthoritativeEngineTime,
      msgUserName: this._msgSecurityParameters.msgUserName,
      msgAuthenticationParameters: '',
      msgPrivacyParameters: '',
    };
    const responseGlobalData = {
      msgID: this._msgGlobalData.msgID,
      msgMaxSize: 65507,
      msgFlags: this._msgGlobalData.msgFlags & (255 - 4),
      msgSecurityModel: 3,
    };

    return Message.createV3(
      responseUser,
      responseGlobalData,
      responseSecurityParameters,
      responsePdu
    );
  }

  public static createCommunity(version: any, community: any, pdu: any): Message {
    const message = new Message();
    message.version = version;
    message.community = community;
    message.pdu = pdu;

    return message;
  }

  public static createRequestV3(user: any, securityParameters: any, pdu: any): any {
    const authFlag =
      user.level == SecurityLevel.authNoPriv || user.level == SecurityLevel.authPriv ? 1 : 0;
    const privFlag = user.level == SecurityLevel.authPriv ? 1 : 0;
    const reportableFlag = pdu.type == PduType.GetResponse || pdu.type == PduType.TrapV2 ? 0 : 1;
    const msgGlobalData = {
      msgID: generateId(),
      msgMaxSize: 65507,
      msgFlags: (reportableFlag * 4) | (privFlag * 2) | (authFlag * 1),
      msgSecurityModel: 3,
    };

    return Message.createV3(user, msgGlobalData, securityParameters, pdu);
  }

  public static createV3(
    user: any,
    msgGlobalData: any,
    msgSecurityParameters: any,
    pdu: any
  ): Message {
    const message = new Message();
    message.version = Version3;
    message.user = user;
    message.msgGlobalData = msgGlobalData;
    message.msgSecurityParameters = msgSecurityParameters;
    message.pdu = pdu;

    return message;
  }

  public static createDiscoveryV3(pdu: any) {
    const msgSecurityParameters = {
      msgAuthoritativeEngineID: Buffer.from(''),
      msgAuthoritativeEngineBoots: 0,
      msgAuthoritativeEngineTime: 0,
    };
    const emptyUser = {
      name: '',
      level: SecurityLevel.noAuthNoPriv,
    };

    return Message.createRequestV3(emptyUser, msgSecurityParameters, pdu);
  }

  public static createFromBuffer(buffer: Buffer, user?: any): Message {
    const reader = new BerReader(buffer);
    const message = new Message();

    reader.readSequence();
    message.version = readInt32(reader);

    if (message.version != Version3) {
      message.community = reader.readString();
      message.pdu = readPdu(reader, false);
    } else {
      // TODO: Check this sets to private attrS _msgGlobalData, _msgSecurityParameters, ...
      // HeaderData
      message.msgGlobalData = {};
      reader.readSequence();
      message.msgGlobalData.msgID = readInt32(reader);
      message.msgGlobalData.msgMaxSize = readInt32(reader);
      message.msgGlobalData.msgFlags = reader.readString(ber.OctetString, true)[0];
      message.msgGlobalData.msgSecurityModel = readInt32(reader);

      // msgSecurityParameters
      message.msgSecurityParameters = {};
      const msgSecurityParametersReader = new BerReader(reader.readString(ber.OctetString, true));
      msgSecurityParametersReader.readSequence();
      message.msgSecurityParameters.msgAuthoritativeEngineID =
        msgSecurityParametersReader.readString(ber.OctetString, true);
      message.msgSecurityParameters.msgAuthoritativeEngineBoots = readInt32(
        msgSecurityParametersReader
      );
      message.msgSecurityParameters.msgAuthoritativeEngineTime = readInt32(
        msgSecurityParametersReader
      );
      message.msgSecurityParameters.msgUserName = msgSecurityParametersReader.readString();
      message.msgSecurityParameters.msgAuthenticationParameters =
        msgSecurityParametersReader.readString(ber.OctetString, true);
      message.msgSecurityParameters.msgPrivacyParameters = Buffer.from(
        msgSecurityParametersReader.readString(ber.OctetString, true)
      );

      if (message.hasPrivacy()) {
        message.encryptedPdu = reader.readString(ber.OctetString, true);
        message.pdu = null;
      } else {
        message.pdu = readPdu(reader, true);
      }
    }

    message.buffer = buffer;
    return message;
  }
}
