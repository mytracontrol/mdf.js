import { Socket, SocketType, createSocket } from 'dgram';
import EventEmitter from 'events';
import {
  ErrorStatus,
  ObjectType,
  PduType,
  ResponseInvalidCode,
  SecurityLevel,
  UsmStats,
  UsmStatsBase,
  Version1,
  Version2c,
  Version3,
} from '../constants';
import { Engine } from '../engine';
import {
  RequestFailedError,
  RequestInvalidError,
  RequestTimedOutError,
  ResponseInvalidError,
} from '../errors';
import { isVarbindError, oidFollowsOid, oidInSubtree, varbindError } from '../helpers';
import { Message } from '../message';
import {
  GetBulkRequestPdu,
  GetNextRequestPdu,
  GetRequestPdu,
  InformRequestPdu,
  Pdu,
  SetRequestPdu,
  SimplePdu,
  SimpleResponsePdu,
  TrapV2Pdu,
  createDiscoveryPdu,
  generateId,
} from '../pdu';

import {
  DoneCallback,
  InformCallback,
  MsgSecurityParameters,
  SESSION_DEFAULT_BACKWARDS_GET_NEXTS,
  SESSION_DEFAULT_COMMUNITY,
  SESSION_DEFAULT_CONTEXT,
  SESSION_DEFAULT_ID_BIT_SIZE,
  SESSION_DEFAULT_MIN_BACKOFF,
  SESSION_DEFAULT_PORT,
  SESSION_DEFAULT_REPORT_OID_MISMATCH_ERRORS,
  SESSION_DEFAULT_RETRIES,
  SESSION_DEFAULT_TARGET,
  SESSION_DEFAULT_TIMEOUT,
  SESSION_DEFAULT_TRANSPORT,
  SESSION_DEFAULT_TRAP_PORT,
  SessionOptions,
  SessionV3Options,
  TableResponseCallback,
  TrapResponseCallback,
  WalkDoneCallback,
  WalkFeedCallback,
} from '.';
import { AgentCallback } from '../agent';
import { ForwarderProxyComplete } from '../forwarder/Forwarder.interfaces';
import {
  DEFAULT_OID_TRAP_0_OID_VALUE_PREFIX,
  DEFAULT_SNMP_TRAP_0_OID,
  DEFAULT_SYS_UPTIME_0_OID,
} from '../oids.constants';
import { FeedCallback, Req, ReqOptions, ResponseCallback } from '../req';
import { User } from '../user.interface';
import { ResponseVarbind, Varbind } from '../varbind.interfaces';

export interface InformOptions {
  upTime?: number;
}
export interface TrapOptions {
  agentAddr?: string;
  upTime?: number;
}
export interface ReqPayload {
  id: number;
  message: Message;
  responseCb: TrapResponseCallback;
  port: number;
}
export interface WalkReqPayload {
  baseOid: string;
  maxRepetitions: number;
  feedCb: WalkFeedCallback;
  doneCb: WalkDoneCallback;
}

export class Session extends EventEmitter {
  private _target: string;
  private _version: number;
  private _user: User; // TODO: Check. User type for Session.createV3. See doc
  private _community: string;
  private _transport: SocketType;
  public port: number;
  private _trapPort: number;
  public retries: number;
  public timeout: number;
  public backoff: number;
  private _sourceAddress: string | undefined;
  private _sourcePort: number | undefined;
  private _idBitsSize: number;
  public context: string;
  private _backwardsGetNexts: boolean;
  private _reportOidMismatchErrors: boolean;
  private _engine: Engine;
  private _reqs: { [reqId: number]: Req };
  private _reqCount: number;
  private _dgram: Socket;
  public msgSecurityParameters: MsgSecurityParameters;
  public proxy: ForwarderProxyComplete;

  constructor(target: string, authenticator: User, options: SessionOptions | SessionV3Options) {
    super();

    this._target = target || SESSION_DEFAULT_TARGET;
    this._version = options.version ? options.version : Version1;
    if (this._version == Version3) {
      this._user = authenticator;
    } else {
      // TODO: Check. Community def is string
      this._community = authenticator || SESSION_DEFAULT_COMMUNITY;
    }

    this._transport = options.transport ? options.transport : SESSION_DEFAULT_TRANSPORT;
    this.port = options.port ? options.port : SESSION_DEFAULT_PORT;
    this._trapPort = options.trapPort ? options.trapPort : SESSION_DEFAULT_TRAP_PORT;
    this.retries = options.retries || SESSION_DEFAULT_RETRIES;
    this.timeout = options.timeout ? options.timeout : SESSION_DEFAULT_TIMEOUT;
    this.backoff =
      options.backoff && options.backoff >= SESSION_DEFAULT_MIN_BACKOFF
        ? options.backoff
        : SESSION_DEFAULT_MIN_BACKOFF;
    this._sourceAddress = options.sourceAddress ? options.sourceAddress : undefined;
    this._sourcePort = options.sourcePort ? parseInt(options.sourcePort) : undefined;
    this._idBitsSize = options.idBitsSize ? options.idBitsSize : SESSION_DEFAULT_ID_BIT_SIZE;
    this.context =
      options.hasOwnProperty('context') && options['context']
        ? options['context']
        : SESSION_DEFAULT_CONTEXT;
    this._backwardsGetNexts =
      typeof options.backwardsGetNexts !== 'undefined'
        ? options.backwardsGetNexts
        : SESSION_DEFAULT_BACKWARDS_GET_NEXTS;
    this._reportOidMismatchErrors =
      typeof options.reportOidMismatchErrors !== 'undefined'
        ? options.reportOidMismatchErrors
        : SESSION_DEFAULT_REPORT_OID_MISMATCH_ERRORS;

    // setDebugFlag(options.debug);
    const engineID =
      options.hasOwnProperty('engineID') && options['engineID'] ? options['engineID'] : undefined;
    this._engine = new Engine(engineID);
    this._reqs = {};
    this._reqCount = 0;

    this._dgram = createSocket(this._transport);
    this._dgram.unref();
    // TODO: Removed me = this. Check why it is done, necessary?
    this._dgram.on('message', this.onMsg.bind(this));
    this._dgram.on('close', this.onClose.bind(this));
    this._dgram.on('error', this.onError.bind(this));
    if (this._sourceAddress || this._sourcePort) {
      this._dgram.bind(this._sourcePort, this._sourceAddress);
    }
  }

  public close(): Session {
    this._dgram.close();
    return this;
  }

  public cancelRequests(error: Error): void {
    for (const reqId in this._reqs) {
      const req = this._reqs[reqId];
      if (req) {
        req.responseCb(error);
      }
    }
  }

  public get(oids: string[], responseCb: ResponseCallback): Session {
    const reportOidMismatchErrors = this._reportOidMismatchErrors;
    const feedCb = (req: Req, message: Message) => {
      const pdu = message.pdu;
      const reqMessagePdu = req.message.pdu;
      // TODO: Checks added
      if (!pdu) {
        throw new Error('Error at Session.get() feedCb: message PDU is undefined');
      }
      if (!reqMessagePdu) {
        throw new Error('Error at Session.get() feedCb: request message PDU is undefined');
      }

      const varbinds: ResponseVarbind[] = [];
      if (reqMessagePdu.varbinds.length != pdu.varbinds.length) {
        req.responseCb(
          new ResponseInvalidError(
            `Requested OIDs do not match response OIDs`,
            ResponseInvalidCode.EReqResOidNoMatch
          )
        );
      } else {
        for (let pos = 0; pos < pdu.varbinds.length; pos++) {
          const reqVarbind = reqMessagePdu.varbinds[pos];
          const resVarbind = pdu.varbinds[pos];
          if (reportOidMismatchErrors && reqVarbind.oid != resVarbind.oid) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${reqVarbind.oid}' in request at position '${pos}' does not match OID '${resVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EReqResOidNoMatch
              )
            );
          } else {
            varbinds.push(resVarbind as ResponseVarbind); // TODO: Forced cast
          }
        }
        (req.responseCb as ResponseCallback)(null, varbinds); //TODO: Forced cast
      }
    };

    const pduVarbinds: Varbind[] = [];
    for (const oid in oids) {
      pduVarbinds.push({ oid: oid });
    }
    this.simpleGet(GetRequestPdu, feedCb, pduVarbinds, responseCb);

    return this;
  }

  // Overlaps
  public getBulk(oids: string[], responseCb: ResponseCallback): Session;
  public getBulk(oids: string[], nonRepeaters: number, responseCb: ResponseCallback): Session;
  public getBulk(
    oids: string[],
    nonRepeaters: number,
    maxRepetitions: number,
    responseCb: ResponseCallback
  ): Session;
  // Implementation
  public getBulk(oids: string[], ...args: (number | ResponseCallback)[]): Session {
    // Set default values if needed
    let nonRepeaters: number, maxRepetitions: number, responseCb: ResponseCallback;
    if (args.length == 1 && typeof args[0] == 'function') {
      nonRepeaters = 0;
      maxRepetitions = 10;
      responseCb = args[0] as ResponseCallback;
    } else if (args.length == 2 && typeof args[0] == 'number' && typeof args[1] == 'function') {
      nonRepeaters = args[0] as number;
      maxRepetitions = 10;
      responseCb = args[1] as ResponseCallback;
    } else if (
      args.length == 3 &&
      typeof args[0] == 'number' &&
      typeof args[1] == 'number' &&
      typeof args[2] == 'function'
    ) {
      nonRepeaters = args[0] as number;
      maxRepetitions = args[1] as number;
      responseCb = args[2] as ResponseCallback;
    } else {
      throw new Error('Invalid arguments at Session.getBulk()');
    }

    // Define feed callback
    const reportOidMismatchErrors = this._reportOidMismatchErrors;
    const backwardsGetNexts = this._backwardsGetNexts;
    const feedCb = (req: Req, message: Message) => {
      const pdu = message.pdu; // response
      const reqMessagePdu = req.message.pdu; // request
      // TODO: Checks added
      if (!pdu) {
        throw new Error('Error at Session.get() feedCb: message PDU is undefined');
      }
      if (!reqMessagePdu) {
        throw new Error('Error at Session.get() feedCb: request message PDU is undefined');
      }

      const reqVarbinds = reqMessagePdu.varbinds;
      const varbinds: (ResponseVarbind[] | ResponseVarbind)[] = [];
      let pos = 0;
      for (; pos < reqVarbinds.length && pos < pdu.varbinds.length; pos++) {
        const responseVarbind = pdu.varbinds[pos] as ResponseVarbind; // TODO: Forced cast
        if (isVarbindError(responseVarbind)) {
          if (reportOidMismatchErrors && reqVarbinds[pos].oid != responseVarbind.oid) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${responseVarbind.oid}' in request at position '${pos}' does not match OID '${responseVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EReqResOidNoMatch
              )
            );
          }
        } else {
          if (!backwardsGetNexts && !oidFollowsOid(reqVarbinds[pos].oid, responseVarbind.oid)) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${reqVarbinds[pos].oid}' in request at position '${pos}' does not precede OID '${responseVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EOutOfOrder
              )
            );
          }
        }

        if (pos < (nonRepeaters as number)) {
          varbinds.push(responseVarbind);
        } else {
          varbinds.push([responseVarbind]);
        }
      }

      const repeaters = reqVarbinds.length - (nonRepeaters as number);
      for (; pos < pdu.varbinds.length; pos++) {
        const responseVarbind = pdu.varbinds[pos] as ResponseVarbind; // TODO: Forced cast
        const reqIndex = ((pos - (nonRepeaters as number)) % repeaters) + (nonRepeaters as number);
        const prevIndex = pos - repeaters;
        const prevOid = pdu.varbinds[prevIndex].oid;
        if (isVarbindError(responseVarbind)) {
          if (reportOidMismatchErrors && prevOid !== responseVarbind.oid) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${prevOid}' in response at position '${prevIndex}' does not match OID '${responseVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EReqResOidNoMatch
              )
            );
          }
        } else {
          if (!backwardsGetNexts && !oidFollowsOid(prevOid, responseVarbind.oid)) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${prevOid}' in response at position '${prevIndex}' does not precede OID '${responseVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EOutOfOrder
              )
            );
          }
        }
        (varbinds[reqIndex] as ResponseVarbind[]).push(responseVarbind);
      }
      (req.responseCb as ResponseCallback)(null, varbinds); // TODO: Forced cast
    };

    const pduVarbinds: Varbind[] = [];
    for (const oid of oids) {
      pduVarbinds.push({ oid: oid });
    }

    const options = {
      nonRepeaters: nonRepeaters,
      maxRepetitions: maxRepetitions,
    };
    this.simpleGet(GetBulkRequestPdu, feedCb, pduVarbinds, responseCb, options);
    return this;
  }

  public getNext(oids: string[], responseCb: ResponseCallback): Session {
    const backwardsGetNexts = this._backwardsGetNexts;
    const feedCb = (req: Req, message: Message) => {
      const pdu = message.pdu; // response
      const reqMessagePdu = req.message.pdu; // request
      // TODO: Checks added
      if (!pdu) {
        throw new Error('Error at Session.get() feedCb: message PDU is undefined');
      }
      if (!reqMessagePdu) {
        throw new Error('Error at Session.get() feedCb: request message PDU is undefined');
      }

      const varbinds: ResponseVarbind[] = [];
      if (reqMessagePdu.varbinds.length != pdu.varbinds.length) {
        req.responseCb(
          new ResponseInvalidError(
            `Requested OIDs do not match response OIDs`,
            ResponseInvalidCode.EReqResOidNoMatch
          )
        );
      } else {
        for (let pos = 0; pos < reqMessagePdu.varbinds.length; pos++) {
          const reqVarbind = reqMessagePdu.varbinds[pos];
          const resVarbind = pdu.varbinds[pos] as ResponseVarbind; // TODO: Forced cast
          if (isVarbindError(resVarbind)) {
            varbinds.push(resVarbind);
          } else if (!backwardsGetNexts && !oidFollowsOid(reqVarbind.oid, resVarbind.oid)) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${reqVarbind.oid}' in request at position '${pos}' does not precede OID '${resVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EOutOfOrder
              )
            );
          } else {
            varbinds.push(resVarbind);
          }
        }
        (req.responseCb as ResponseCallback)(null, varbinds); // TODO: Forced cast
      }
    };

    const pduVarbinds: Varbind[] = [];
    for (const oid of oids) {
      pduVarbinds.push({ oid: oid });
    }
    this.simpleGet(GetNextRequestPdu, feedCb, pduVarbinds, responseCb);
    return this;
  }

  // Overload signatures
  public inform(typeOrOid: string | number, callback: InformCallback): Session;
  public inform(typeOrOid: string | number, varbinds: Varbind[], callback: InformCallback): Session;
  public inform(
    typeOrOid: string | number,
    options: InformOptions,
    callback: InformCallback
  ): Session;
  public inform(
    typeOrOid: string | number,
    varbinds: Varbind[],
    options: InformOptions,
    callback: InformCallback
  ): Session;
  // Implementation
  public inform(
    typeOrOid: string | number,
    ...args: (Varbind[] | InformOptions | InformCallback)[]
  ): Session {
    // Set default values if needed
    let varbinds: Varbind[], options: InformOptions, responseCb: InformCallback;
    if (args.length === 1 && typeof args[0] === 'function') {
      responseCb = args[0];
      varbinds = [];
      options = {};
    } else if (args.length === 2 && Array.isArray(args[0]) && typeof args[1] === 'function') {
      responseCb = args[1];
      varbinds = args[0] as Varbind[];
      options = {};
    } else if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'function') {
      responseCb = args[1];
      options = args[0] as InformOptions;
      varbinds = [];
    } else if (
      args.length === 3 &&
      Array.isArray(args[0]) &&
      typeof args[1] === 'object' &&
      typeof args[2] === 'function'
    ) {
      responseCb = args[2];
      varbinds = args[0] as Varbind[];
      options = args[1] as InformOptions;
    } else {
      throw new Error('Invalid arguments at Session.inform()');
    }

    if (this._version === Version1) {
      responseCb(new RequestInvalidError('Inform not allowed for SNMPv1'));
    }

    // Define feed callback
    const feedCb = (req: Req, message: Message) => {
      const pdu = message.pdu; // response
      const reqMessagePdu = req.message.pdu; // request
      // TODO: Checks added
      if (!pdu) {
        throw new Error('Error at Session.inform() feedCb: message PDU is undefined');
      }
      if (!reqMessagePdu) {
        throw new Error('Error at Session.inform() feedCb: request message PDU is undefined');
      }

      const varbinds: ResponseVarbind[] = [];
      const reqVarbinds = reqMessagePdu.varbinds;
      const resVarbinds = pdu.varbinds as ResponseVarbind[]; // TODO: Forced cast
      if (reqVarbinds.length != resVarbinds.length) {
        req.responseCb(
          new ResponseInvalidError(
            `Inform OIDs do not match response OIDs`,
            ResponseInvalidCode.EReqResOidNoMatch
          )
        );
      } else {
        for (let pos = 0; pos < reqVarbinds.length; pos++) {
          if (reqVarbinds[pos] != resVarbinds[pos]) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${reqVarbinds[pos].oid}' in inform at position '${pos}' does not match OID '${resVarbinds[pos].oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EReqResOidNoMatch
              )
            );
          } else {
            varbinds.push(resVarbinds[pos]);
          }
        }
        (req.responseCb as ResponseCallback)(null, varbinds); // TODO: Forced cast
      }
    };

    // Perform imform
    if (typeof typeOrOid != 'string') {
      typeOrOid = `${DEFAULT_OID_TRAP_0_OID_VALUE_PREFIX}${typeOrOid + 1}`;
    }

    const pduVarbinds: Varbind[] = [
      {
        oid: DEFAULT_SYS_UPTIME_0_OID,
        type: ObjectType.TimeTicks,
        value: options.upTime || Math.floor(process.uptime() * 100),
      },
      {
        oid: DEFAULT_SNMP_TRAP_0_OID,
        type: ObjectType.OID,
        value: typeOrOid,
      },
    ];

    for (const varbind of varbinds) {
      pduVarbinds.push(varbind);
    }
    // TODO: Check, getOptions created as port is not included in original options
    // passed to this func. Check if options is modified in simpleGet
    const getOptions = {
      ...options,
      port: this._trapPort,
    };
    this.simpleGet(InformRequestPdu, feedCb, pduVarbinds, responseCb, getOptions);
    return this;
  }

  public onClose() {
    this.cancelRequests(new Error('Socket forcibly closed'));
    this.emit('close');
  }

  public onError(error: Error): void {
    this.emit('error', error);
  }

  public onMsg(buffer: Buffer): void {
    try {
      const message = Message.createFromBuffer(buffer);
      // TODO: Check added
      const messagePdu = message.pdu;
      if (!messagePdu) {
        throw new Error('Error at Session.onMsg(): message PDU is undefined');
      }

      const req = this.unregisterRequest(message.getReqId());
      if (!req) {
        return;
      }
      if (!message.processIncomingSecurity(this._user, req.responseCb)) {
        return;
      }

      if (message.version != req.message.version) {
        req.responseCb(
          new ResponseInvalidError(
            `Version in request '${req.message.version}' does not match version in response '${message.version}'`,
            ResponseInvalidCode.EVersionNoMatch
          )
        );
      } else if (message.community != req.message.community) {
        req.responseCb(
          new ResponseInvalidError(
            `Community '${req.message.community}' in request does not match community '${message.community}' in response`,
            ResponseInvalidCode.ECommunityNoMatch
          )
        );
      } else if (messagePdu.type == PduType.Report) {
        this.msgSecurityParameters = {
          msgAuthoritativeEngineID: message.msgSecurityParameters.msgAuthoritativeEngineID,
          msgAuthoritativeEngineBoots: message.msgSecurityParameters.msgAuthoritativeEngineBoots,
          msgAuthoritativeEngineTime: message.msgSecurityParameters.msgAuthoritativeEngineTime,
        };

        if (this.proxy) {
          this.msgSecurityParameters.msgUserName = this.proxy.user.name;
          this.msgSecurityParameters.msgAuthenticationParameters = '';
          this.msgSecurityParameters.msgPrivacyParameters = '';
        } else {
          if (!req.originalPdu || !req.allowReport) {
            if (
              Array.isArray(messagePdu.varbinds) &&
              messagePdu.varbinds[0] &&
              messagePdu.varbinds[0].oid.indexOf(UsmStatsBase) === 0
            ) {
              this.userSecurityModelError(req, messagePdu.varbinds[0].oid);
            }
            req.responseCb(
              new ResponseInvalidError(
                `Unexpected Report PDU`,
                ResponseInvalidCode.EUnexpectedReport
              )
            );
          }
          // TODO: Check assignment
          req.originalPdu.contextName = this.context;
          const timeSyncNeeded =
            !message.msgSecurityParameters.msgAuthoritativeEngineBoots &&
            !message.msgSecurityParameters.msgAuthoritativeEngineTime;
          this.sendV3Req(
            req.originalPdu,
            req.feedCb,
            req.responseCb as ResponseCallback, // TODO: Forced cast
            req.options, // TODO: Check. Where are this options set? Not in Req
            req.port,
            timeSyncNeeded
          );
        }
      } else if (this.proxy) {
        this.onProxyResponse(req, message);
      } else if (messagePdu.type == PduType.GetResponse) {
        req.onResponse(req, message);
      } else {
        req.responseCb(
          new ResponseInvalidError(
            `Unknown PDU type '${messagePdu.type}' in response`,
            ResponseInvalidCode.EUnknownPduType
          )
        );
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  public onSimpleGetResponse(req: Req, message: Message): void {
    // TODO: Check added
    if (!message.pdu) {
      throw new Error('Error at Session.onSimpleGetResponse(): message PDU is undefined');
    }
    const pdu: SimpleResponsePdu = message.pdu as SimpleResponsePdu; // TODO: Forced cast

    if (pdu.errorStatus > 0) {
      const statusString: string =
        ErrorStatus[pdu.errorStatus] || ErrorStatus[ErrorStatus.GeneralError];
      const statusCode: number = ErrorStatus[statusString] || ErrorStatus.GeneralError;

      if (pdu.errorIndex <= 0 || pdu.errorIndex > pdu.varbinds.length) {
        req.responseCb(new RequestFailedError(statusString, statusCode));
      } else {
        const oid = pdu.varbinds[pdu.errorIndex - 1].oid;
        req.responseCb(new RequestFailedError(`${statusString}:${oid}`, statusCode));
      }
    } else {
      // TODO: Check added
      if (req.feedCb) {
        req.feedCb(req, message);
      }
    }
  }

  public registerRequest(req: Req): void {
    if (!this._reqs[req.getId()]) {
      this._reqs[req.getId()] = req;
      if (this._reqCount <= 0) {
        this._dgram.ref();
      }
      this._reqCount++;
    }

    req.timer = setTimeout(() => {
      if (req.retries-- > 0) {
        this.send(req);
      } else {
        this.unregisterRequest(req.getId());
        req.responseCb(new RequestTimedOutError(`Request timed out`));
      }
    }, req.timeout);

    // Apply timeout backoff
    if (req.backoff && req.backoff >= 1) {
      req.timeout *= req.backoff;
    }
  }

  public send(req: Req, noWait?: boolean): Session {
    try {
      const buffer = req.message.toBuffer();
      this._dgram.send(
        buffer,
        0,
        buffer.length,
        req.port,
        this._target,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (error: Error | null, _bytes: number) => {
          if (error) {
            req.responseCb(error);
          } else {
            if (noWait) {
              req.responseCb(null);
            } else {
              this.registerRequest(req);
            }
          }
        }
      );
    } catch (error) {
      req.responseCb(error);
    }

    return this;
  }

  public set(varbinds: Varbind[], responseCb: ResponseCallback): Session {
    const reportOidMismatchErrors = this._reportOidMismatchErrors;
    const feedCb = (req: Req, message: Message) => {
      // TODO: Checks added
      if (!message.pdu) {
        throw new Error('Error at Session.set() feedCb: message PDU is undefined');
      }

      if (!req.message.pdu) {
        throw new Error('Error at Session.set() feedCb: req message PDU is undefined');
      }

      const pdu = message.pdu; // response
      const reqMessagePdu = req.message.pdu; // request
      const varbinds: ResponseVarbind[] = [];
      if (reqMessagePdu.varbinds.length != pdu.varbinds.length) {
        req.responseCb(
          new ResponseInvalidError(
            `Requested OIDs do not match response OIDs`,
            ResponseInvalidCode.EReqResOidNoMatch
          )
        );
      } else {
        for (let pos = 0; pos < reqMessagePdu.varbinds.length; pos++) {
          const reqVarbind = reqMessagePdu.varbinds[pos];
          const resVarbind = pdu.varbinds[pos] as ResponseVarbind; // TODO: Forced cast
          if (reportOidMismatchErrors && reqVarbind.oid != resVarbind.oid) {
            req.responseCb(
              new ResponseInvalidError(
                `OID '${reqVarbind.oid}' in request at position '${pos}' does not match '${resVarbind.oid}' in response at position '${pos}'`,
                ResponseInvalidCode.EReqResOidNoMatch
              )
            );
          } else {
            varbinds.push(resVarbind);
          }
        }
        (req.responseCb as ResponseCallback)(null, varbinds); // TODO: Forced cast
      }
    };

    const pduVarbinds: Varbind[] = [];
    for (const varbind of varbinds) {
      pduVarbinds.push({ ...varbind });
    }

    this.simpleGet(SetRequestPdu, feedCb, pduVarbinds, responseCb);
    return this;
  }

  public simpleGet(
    pduClass: any,
    feedCb: FeedCallback,
    varbinds: Varbind[],
    responseCb: ResponseCallback,
    options?: ReqOptions
  ): void {
    const id = generateId(this._idBitsSize);
    options = Object.assign({}, options, { context: this.context });
    const pdu = SimplePdu.createFromVariables(pduClass, id, varbinds, options);

    if (this._version == Version3) {
      if (this.msgSecurityParameters) {
        this.sendV3Req(pdu, feedCb, responseCb, options, this.port, true);
      } else {
        this.sendV3Discovery(pdu, feedCb, responseCb, options);
      }
    } else {
      const message = Message.createCommunity(this._version, this._community, pdu);
      const req = new Req(this, message, feedCb, responseCb, options);
      this.send(req, false);
    }
  }

  private _subtreeCb(req: Req, varbinds: Varbind[]): boolean | void {
    let done = 0;

    for (let pos = varbinds.length; pos > 0; pos--) {
      if (!oidInSubtree(req.baseOid, varbinds[pos - 1].oid)) {
        done = 1;
        varbinds.pop();
      }
    }

    if (varbinds.length > 0) {
      // TODO: Check added
      if (req.feedCb) {
        // TODO: Check, varbinds param does not match the other calls
        req.feedCb(varbinds);
      }
    }

    if (done) {
      return true;
    }
  }

  // Overloading declaration signatures
  public subtree(oid: string, feedCallback: FeedCallback, doneCallback: DoneCallback): Session;
  public subtree(
    oid: string,
    maxRepetitions: number,
    feedCallback: FeedCallback,
    doneCallback: DoneCallback
  ): Session;
  // Implementation
  public subtree(oid: string, ...args: (number | FeedCallback | DoneCallback)[]): Session {
    // Check args and set default values if needed
    let maxRepetitions: number, feedCb: FeedCallback, doneCb: DoneCallback;
    if (args.length === 2 && typeof args[0] === 'function' && typeof args[1] === 'function') {
      maxRepetitions = 20;
      feedCb = args[0] as FeedCallback;
      doneCb = args[1] as DoneCallback;
    } else if (
      args.length === 3 &&
      typeof args[0] === 'number' &&
      typeof args[1] === 'function' &&
      typeof args[2] === 'function'
    ) {
      maxRepetitions = args[0];
      feedCb = args[1] as FeedCallback;
      doneCb = args[2] as DoneCallback;
    } else {
      throw new Error('Invalid arguments passed to subtree() function');
    }

    // TODO: Continue here
    const req = {
      feedCb,
      doneCb,
      maxRepetitions,
      baseOid: oid,
    };
    this.walk(oid, maxRepetitions, this._subtreeCb.bind(this, req), doneCb);
    return this;
  }

  private _tableColumnsResponseCb(req: Req, error: Error | null): void {
    if (error) {
      req.responseCb(error);
    } else if (req.error) {
      req.responseCb(req.error);
    } else {
      if (req.columns.length > 0) {
        const column = req.columns.pop();
        this.subtree(
          `${req.rowOid}${column}`,
          req.maxRepetitions,
          this._tableColumnsFeedCb.bind(this, req),
          this._tableColumnsResponseCb.bind(this, req)
        );
      } else {
        req.responseCb(null, req.table);
      }
    }
  }

  private _tableColumnsFeedCb(req: Req, varbinds: Varbind[]): boolean | void {
    for (const varbind of varbinds) {
      if (isVarbindError(varbind)) {
        req.error = new RequestFailedError(varbindError(varbind));
        return true;
      }

      const oid = varbind.oid.replace(req.rowOid, '');
      if (oid && oid != varbind.oid) {
        const match = oid.match(/^(\d+)\.(.+)$/);
        if (match && parseInt(match[1]) > 0) {
          if (!req.table[match[2]]) {
            req.table[match[2]] = {};
          }
          req.table[match[2]][match[1]] = varbind.value;
        }
      }
    }
  }

  // Overloading declaration signatures
  public tableColumns(oid: string, columns: string[], callback: TableResponseCallback): Session;
  public tableColumns(
    oid: string,
    columns: string[],
    maxRepetitions: number,
    callback: TableResponseCallback
  ): Session;
  // Implementation
  public tableColumns(
    oid: string,
    columns: string[],
    ...args: (number | TableResponseCallback)[]
  ): Session {
    // Check args and set default values if needed
    let maxRepetitions: number, responseCb: TableResponseCallback;
    if (args.length === 1 && typeof args[0] === 'function') {
      maxRepetitions = 20;
      responseCb = args[0] as TableResponseCallback;
    } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'function') {
      maxRepetitions = args[0];
      responseCb = args[1] as TableResponseCallback;
    } else {
      throw new Error('Invalid arguments passed to tableColumns() function');
    }

    const req = {
      responseCb: responseCb,
      maxRepetitions: maxRepetitions,
      baseOid: oid,
      rowOid: oid + '.1.',
      columns: columns.slice(0),
      table: {},
    };

    // TODO: Check, varbinds param not being passed to callbacks when binding
    if (req.columns.length > 0) {
      const column = req.columns.pop();
      this.subtree(
        `${req.rowOid}${column}`,
        maxRepetitions,
        this._tableColumnsFeedCb.bind(this, req),
        this._tableColumnsResponseCb.bind(this, req)
      );
    }

    return this;
  }

  private _tableResponseCb(req: Req, error: Error | null): void {
    if (error) {
      req.responseCb(error);
    } else if (req.error) {
      req.responseCb(req.error);
    } else {
      req.responseCb(null, req.table);
    }
  }

  private _tableFeedCb(req: Req, varbinds: Varbind[]): boolean | void {
    for (const varbind of varbinds) {
      if (isVarbindError(varbind)) {
        req.error = new RequestFailedError(varbindError(varbind));
        return true;
      }

      const oid = varbind.oid.replace(req.rowOid, '');
      if (oid && oid != varbind.oid) {
        const match = oid.match(/^(\d+)\.(.+)$/);
        if (match && parseInt(match[1]) > 0) {
          if (!req.table[match[2]]) {
            req.table[match[2]] = {};
          }
          req.table[match[2]][match[1]] = varbind.value;
        }
      }
    }
  }

  // Overloading declaration signatures
  public table(oid: string, responseCb: TableResponseCallback): Session;
  public table(oid: string, maxRepetitions: number, responseCb: TableResponseCallback): Session;
  // Implementation
  public table(
    oid: string,
    // arg1: number | TableResponseCallback,
    // arg2?: TableResponseCallback
    ...args: (number | TableResponseCallback)[]
  ): Session {
    // Check args and set default values if needed
    let maxRepetitions: number, responseCb: TableResponseCallback;
    if (args.length === 1 && typeof args[0] === 'function') {
      maxRepetitions = 20;
      responseCb = args[0] as TableResponseCallback;
    } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'function') {
      maxRepetitions = args[0];
      responseCb = args[1] as TableResponseCallback;
    } else {
      throw new Error('Invalid arguments passed to table() function');
    }

    const req = {
      responseCb: responseCb,
      maxRepetitions: maxRepetitions,
      baseOid: oid,
      rowOid: oid + '.1.',
      table: {},
    };

    this.subtree(
      req.rowOid,
      maxRepetitions,
      this._tableFeedCb.bind(this, req),
      this._tableResponseCb.bind(this, req)
    );
    return this;
  }

  // Overloading declaration signatures
  public trap(typeOrOid: string | number, callback: TrapResponseCallback): Session;
  public trap(
    typeOrOid: string | number,
    varbinds: Varbind[],
    callback: TrapResponseCallback
  ): Session;
  public trap(
    typeOrOid: string | number,
    agentAddrOrOptions: string | TrapOptions,
    callback: TrapResponseCallback
  ): Session;
  public trap(
    typeOrOid: string | number,
    varbinds: Varbind[],
    agentAddrOrOptions: string | TrapOptions,
    callback: TrapResponseCallback
  ): Session;
  // Implementation
  public trap(
    typeOrOid: string | number,
    arg1: Varbind[] | string | TrapOptions | TrapResponseCallback,
    arg2?: string | TrapOptions | TrapResponseCallback,
    arg3?: TrapResponseCallback
  ): Session {
    let varbinds: Varbind[] = [],
      options: TrapOptions = {},
      responseCb: TrapResponseCallback;
    if (typeof arg1 === 'function' && !arg2 && !arg3) {
      responseCb = arg1 as TrapResponseCallback;
    } else if (Array.isArray(arg1) && typeof arg2 === 'function' && !arg3) {
      varbinds = arg1 as Varbind[];
      responseCb = arg2 as TrapResponseCallback;
    } else if (typeof arg1 === 'string' && typeof arg2 === 'function' && !arg3) {
      options = { agentAddr: arg1 };
      responseCb = arg2 as TrapResponseCallback;
    } else if (typeof arg1 === 'object' && typeof arg2 === 'function' && !arg3) {
      options = arg1 as TrapOptions;
      responseCb = arg2 as TrapResponseCallback;
    } else if (Array.isArray(arg1) && typeof arg2 == 'string' && typeof arg3 == 'function') {
      varbinds = arg1;
      options = { agentAddr: arg2 };
      responseCb = arg3 as TrapResponseCallback;
    } else if (Array.isArray(arg1) && typeof arg2 == 'object' && typeof arg3 == 'function') {
      varbinds = arg1;
      options = arg2;
      responseCb = arg3 as TrapResponseCallback;
    } else {
      throw new Error('Invalid arguments passed to trap() function');
    }

    let pdu: TrapV2Pdu;
    const pduVarbinds: Varbind[] = [];
    for (const varbind of varbinds) {
      pduVarbinds.push({ ...varbind });
    }

    const id = generateId(this._idBitsSize);

    if (this._version == Version2c || this._version == Version3) {
      if (typeof typeOrOid != 'string') {
        typeOrOid = `${DEFAULT_OID_TRAP_0_OID_VALUE_PREFIX}${typeOrOid + 1}`;
      }

      pduVarbinds.unshift(
        {
          oid: DEFAULT_SYS_UPTIME_0_OID,
          type: ObjectType.TimeTicks,
          value: options.upTime || Math.floor(process.uptime() * 100),
        },
        {
          oid: DEFAULT_SNMP_TRAP_0_OID,
          type: ObjectType.OID,
          value: typeOrOid,
        }
      );
      pdu = TrapV2Pdu.createFromVariables(null, id, pduVarbinds, options);
    } else {
      pdu = TrapV2Pdu.createFromVariables(null, id, pduVarbinds, options);
    }

    let message: Message;
    if (this._version == Version3) {
      const msgSecurityParameters = {
        msgAuthoritativeEngineID: this._engine.engineID,
        msgAuthoritativeEngineBoots: 0,
        msgAuthoritativeEngineTime: 0,
      };
      message = Message.createRequestV3(this._user, msgSecurityParameters, pdu);
    } else {
      message = Message.createCommunity(this._version, this._community, pdu);
    }

    // TODO: Check types, send<- expects Req, but this obj is passed
    const req = {
      id: id,
      message: message,
      responseCb: responseCb,
      port: this._trapPort,
    };
    this.send(req, false);
    return this;
  }

  public unregisterRequest(id: number): Req | null {
    const req = this._reqs[id];
    if (req) {
      delete this._reqs[id];
      clearTimeout(req.timer);
      delete req.timer;
      this._reqCount--;
      if (this._reqCount <= 0) {
        this._dgram.unref();
      }
      return req;
    } else {
      return null;
    }
  }

  public walkCb(
    req: WalkReqPayload,
    error: Error | null,
    varbinds: (Varbind | Varbind[])[]
  ): boolean | void {
    let done = 0;
    let oid;

    if (error) {
      if (error instanceof RequestFailedError) {
        if (error.status == ErrorStatus.NoSuchName) {
          req.doneCb(error);
        } else {
          // signal the version 1 walk code below that it should stop
          done = 1;
        }
      } else {
        req.doneCb(error);
      }
    }

    if (!varbinds?.length) {
      req.doneCb(null);
    }

    if (this._version == Version2c || this._version == Version3) {
      // TODO: Check varbinds type/structure
      for (let i = (varbinds[0] as Varbind[]).length; i > 0; i--) {
        if (varbinds[0][i - 1].type == ObjectType.EndOfMibView) {
          (varbinds[0] as Varbind[]).pop();
          done = 1;
        }
      }
      if (req.feedCb(varbinds[0] as Varbind[])) {
        done = 1;
      }
      if (!done) {
        oid = (varbinds[0] as Varbind[])[(varbinds[0] as Varbind[]).length - 1].oid;
      }
    } else {
      if (!done) {
        if (req.feedCb(varbinds as Varbind[])) {
          done = 1;
        } else {
          oid = (varbinds[0] as Varbind).oid;
        }
      }
    }

    if (done) {
      req.doneCb(null);
    } else {
      // TODO: Check. Last parameter should not be passed.
      this.walk(oid, req.maxRepetitions, req.feedCb, req.doneCb, req.baseOid);
    }
  }

  // Overloading declaration signatures
  public walk(oid: string, feedCallback: WalkFeedCallback, doneCallback: WalkDoneCallback): Session;
  public walk(
    oid: string,
    maxRepetitions: number,
    feedCallback: WalkFeedCallback,
    doneCallback: WalkDoneCallback
  ): Session;
  // Implementation
  public walk(
    oid: string,
    arg1: number | WalkFeedCallback,
    arg2: WalkFeedCallback | WalkDoneCallback,
    arg3?: WalkDoneCallback
  ): Session {
    // Check args and set default values if needed
    let maxRepetitions: number, feedCb: WalkFeedCallback, doneCb: WalkDoneCallback;
    if (typeof arg1 === 'number' && typeof arg2 === 'function' && typeof arg3 === 'function') {
      maxRepetitions = arg1;
      feedCb = arg2 as WalkFeedCallback;
      doneCb = arg3 as WalkDoneCallback;
    } else if (typeof arg1 === 'function' && typeof arg2 === 'function' && !arg3) {
      maxRepetitions = 20;
      feedCb = arg1 as WalkFeedCallback;
      doneCb = arg2 as WalkDoneCallback;
    } else {
      throw new Error('Invalid arguments passed to walk() function');
    }

    // const req = {
    //   maxRepetitions: maxRepetitions,
    //   feedCb: feedCb,
    //   doneCb: doneCb,
    // };

    if (this._version == Version2c || this._version == Version3) {
      this.getBulk([oid], 0, maxRepetitions, this.walkCb.bind(this, req));
    } else {
      this.getNext([oid], this.walkCb.bind(this, req));
    }
    return this;
  }

  public sendV3Req(
    pdu: Pdu,
    feedCb: FeedCallback | null,
    responseCb: ResponseCallback,
    options: ReqOptions,
    port: number,
    allowReport: boolean
  ): void {
    const message = Message.createRequestV3(this._user, this.msgSecurityParameters, pdu);
    const reqOptions = options || {};
    const req = new Req(this, message, feedCb, responseCb, reqOptions);
    req.port = port;
    req.originalPdu = pdu;
    req.allowReport = allowReport;
    this.send(req);
  }

  // TODO: Check, null types added for use in Forwarder
  public sendV3Discovery(
    originalPdu: Pdu | null,
    feedCb: FeedCallback | null,
    responseCb: ResponseCallback | AgentCallback,
    options?: ReqOptions
  ): void {
    const discoveryPdu = createDiscoveryPdu(this.context);
    const discoveryMessage = Message.createDiscoveryV3(discoveryPdu);
    const discoveryReq = new Req(this, discoveryMessage, feedCb, responseCb, options);
    discoveryReq.originalPdu = originalPdu as Pdu; // TODO: Forced cast
    discoveryReq.allowReport = true;
    this.send(discoveryReq);
  }

  public userSecurityModelError(req: Req, oid: string): void {
    const oidSuffix = oid.replace(UsmStatsBase + '.', '').replace(/\.0$/, '');
    const errorType = UsmStats[oidSuffix] || 'Unexpected Report PDU';
    req.responseCb(new ResponseInvalidError(errorType, ResponseInvalidCode.EAuthFailure));
  }

  public onProxyResponse(req: Req, message: Message): void {
    if (message.version != Version3) {
      // TODO: Check. There is no callback in Session
      this.callback(new RequestFailedError('Only SNMP version 3 contexts are supported'));
    }
    // TODO: Checks added
    if (!message.pdu) {
      throw new Error('Error at Session.onProxyResponse(): no PDU in response message');
    }
    if (!req.proxiedPduId) {
      throw new Error('Error at Session.onProxyResponse(): PDU in request PDU has no ID');
    }

    // TODO: Check this assignments {{}} and unexpected attrs
    message.pdu.contextName = this.proxy.context;
    message.user = req.proxiedUser;
    message.setAuthentication(req.proxiedUser.level != SecurityLevel.noAuthNoPriv);
    message.setPrivacy(req.proxiedUser.level == SecurityLevel.authPriv);
    message.msgSecurityParameters = {
      msgAuthoritativeEngineID: req.proxiedEngine?.engineID,
      msgAuthoritativeEngineBoots: req.proxiedEngine?.engineBoots,
      msgAuthoritativeEngineTime: req.proxiedEngine?.engineTime,
      msgUserName: req.proxiedUser.name,
      msgAuthenticationParameters: '',
      msgPrivacyParameters: '',
    };
    message.buffer = null;
    message.pdu.contextEngineID = message.msgSecurityParameters.msgAuthoritativeEngineID;
    message.pdu.contextName = this.proxy.context;
    message.pdu.id = req.proxiedPduId;
    this.proxy.listener.send(message, req.proxiedRinfo);
  }

  public static create(target: string, community: string, options?: SessionOptions): Session {
    // TODO: Check. Refactored due to warning
    // const version = options && options.version ? options.version : Version1;
    const version = options?.version || Version1;
    if (version != Version1 && version != Version2c) {
      throw new ResponseInvalidError(
        "SNMP community session requested but version '" +
          options?.version +
          "' specified in options not valid",
        ResponseInvalidCode.EVersionNoMatch
      );
    } else {
      if (!options) {
        options = {};
      }
      options.version = version;
      return new Session(target, community, options);
    }
  }

  public static createV3(target: string, user: User, options?: SessionV3Options): Session {
    if (options?.version && options.version != Version3) {
      throw new ResponseInvalidError(
        "SNMPv3 session requested but version '" + options.version + "' specified in options",
        ResponseInvalidCode.EVersionNoMatch
      );
    } else {
      if (!options) {
        options = {};
      }
      options.version = Version3;
    }
    return new Session(target, user, options);
  }
}
