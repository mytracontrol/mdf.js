import { RemoteInfo } from 'dgram';
import EventEmitter from 'events';
import { Socket } from 'net';
import { BASE_OID_ADDRESS } from '../../../../../../packages/api/puller/src/net-snmp/oids.constants';
import { AgentXPdu, AgentXPduSendCallback } from '../agentXPdu';
import {
  DEFAULT_AGENTXPDU_ERROR,
  DEFAULT_AGENTXPDU_INDEX,
  DEFAULT_AGENTXPDU_PRIORITY,
  DEFAULT_AGENTXPDU_RANGE_SUBID,
  DEFAULT_AGENTXPDU_SYS_UP_TIME,
} from '../agentXPdu/AgentXPdu.constants';
import { AgentXPduType, ErrorStatus, ObjectType, ResponseInvalidCode } from '../constants';
import { RequestInvalidError, ResponseInvalidError } from '../errors';
import { Mib } from '../mib';
import { MibNode, MibProvider } from '../mibNode';
import { MibRequest } from '../mibRequest';
import { generateId } from '../pdu/pduUtils';
import { RequestHandlerCallback } from '../request.interfaces';
import {
  DEFAULT_SNMP_TRAP_0_OID,
  DEFAULT_SNMP_TRAP_0_OID_VALUE_PREFIX,
  DEFAULT_SYS_UPTIME_0_OID,
} from '../session';
import { Varbind } from '../varbind.interfaces';
import {
  DEFAULT_SUBAGENT_DESCRIPTION,
  DEFAULT_SUBAGENT_MASTER,
  DEFAULT_SUBAGENT_PORT,
  DEFAULT_SUBAGENT_REGISTER_PROVIDER_AGENTXPDU_TIMEOUT,
  DEFAULT_SUBAGENT_SESSION_ID,
  DEFAULT_SUBAGENT_TIMEOUT,
} from './Subagent.constants';
import { SubagentOptions } from './Subagent.interfaces';
import { finishSubagentRequestAtVarbindIndex } from './Subagent.request.utils';

export class Subagent extends EventEmitter {
  // DEBUG

  private mib: Mib;
  private master: string;
  private masterPort: number;
  private timeout: number;
  private description: string;
  private sessionID: number;
  private transactionID: number;
  private packetID: number;
  private requestPdus: { [packetID: number]: AgentXPdu };
  private setTransactions: { [transactionID: number]: AgentXPdu };
  private socket: Socket;
  public oid: string;

  constructor(options: SubagentOptions) {
    super();
    this.mib = new Mib();
    this.master = options.master || DEFAULT_SUBAGENT_MASTER;
    this.masterPort = options.masterPort || DEFAULT_SUBAGENT_PORT;
    this.timeout = options.timeout || DEFAULT_SUBAGENT_TIMEOUT;
    this.description = options.description || DEFAULT_SUBAGENT_DESCRIPTION;
    this.sessionID = DEFAULT_SUBAGENT_SESSION_ID;
    this.transactionID = 0;
    this.packetID = generateId();
    this.requestPdus = {};
    this.setTransactions = {};
  }

  public onClose(): void {
    this.emit('close');
  }

  public onError(error: Error): void {
    this.emit('error', error);
  }

  public getMib(): Mib {
    return this.mib;
  }

  public connectSocket(): void {
    this.socket = new Socket();
    const connectionListener = (): void => {
      console.debug(`Connected to '${this.master}' on port ${this.masterPort}`);
    };

    this.socket.connect(this.masterPort, this.master, connectionListener);
    // TODO: Check, params are not passed when binding
    this.socket.on('data', this.onMsg.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('close', this.onClose.bind(this));
  }

  public open(callback: AgentXPduSendCallback): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Open,
      timeout: this.timeout,
      oid: this.oid,
      descr: this.description,
    });
    this.sendPdu(pdu, callback);
  }

  public close(callback: AgentXPduSendCallback): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Close,
      sessionID: this.sessionID,
    });
    this.sendPdu(pdu, callback);
  }

  public registerProvider(provider: MibProvider, callback: AgentXPduSendCallback): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Register,
      sessionID: this.sessionID,
      rangeSubid: DEFAULT_AGENTXPDU_RANGE_SUBID,
      timeout: DEFAULT_SUBAGENT_REGISTER_PROVIDER_AGENTXPDU_TIMEOUT,
      priority: DEFAULT_AGENTXPDU_PRIORITY,
      oid: provider.oid,
    });
    this.mib.registerProvider(provider);
    this.sendPdu(pdu, callback);
  }

  public unregisterProvider(name: string, callback: AgentXPduSendCallback): void {
    const provider = this.getProvider(name);
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Unregister,
      sessionID: this.sessionID,
      rangeSubid: DEFAULT_AGENTXPDU_RANGE_SUBID,
      priority: DEFAULT_AGENTXPDU_PRIORITY,
      oid: provider.oid,
    });
    this.mib.unregisterProvider(name);
    this.sendPdu(pdu, callback);
  }

  public registerProviders(providers: MibProvider[], callback: AgentXPduSendCallback): void {
    for (const provider of providers) {
      this.registerProvider(provider, callback);
    }
  }

  public getProvider(name: string): MibProvider {
    return this.mib.getProvider(name);
  }

  public getProviders(): { [key: string]: MibProvider } {
    return this.mib.getProviders();
  }

  public addAgentCaps(oid: string, description: string, callback: AgentXPduSendCallback): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.AddAgentCaps,
      sessionID: this.sessionID,
      oid,
      descr: description,
    });
    this.sendPdu(pdu, callback);
  }

  public removeAgentCaps(oid: string, callback: AgentXPduSendCallback): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.RemoveAgentCaps,
      sessionID: this.sessionID,
      oid,
    });
    this.sendPdu(pdu, callback);
  }

  public notify(typeOrOid: string | number, callback: AgentXPduSendCallback): void;
  public notify(
    typeOrOid: string | number,
    varbinds: Varbind[],
    callback: AgentXPduSendCallback
  ): void;
  public notify(typeOrOid: string | number, ...args: (Varbind[] | AgentXPduSendCallback)[]) {
    // Set default values if needed
    let varbinds: Varbind[], callback: AgentXPduSendCallback;
    if (args.length === 1 && typeof args[0] === 'function') {
      varbinds = [];
      callback = args[0];
    } else if (args.length === 2 && Array.isArray(args[0]) && typeof args[1] === 'function') {
      varbinds = args[0] as Varbind[];
      callback = args[1] as AgentXPduSendCallback;
    } else {
      throw new Error('Invalid arguments for Subagent.notify()');
    }

    // Set Oid
    if (typeof typeOrOid != 'string') {
      typeOrOid = DEFAULT_SNMP_TRAP_0_OID_VALUE_PREFIX + (typeOrOid + 1);
    }

    // Create Varbinds
    let pduVarbinds: Varbind[] = [
      {
        oid: DEFAULT_SYS_UPTIME_0_OID,
        type: ObjectType.TimeTicks,
        value: Math.floor(process.uptime() * 100),
      },
      {
        oid: DEFAULT_SNMP_TRAP_0_OID,
        type: ObjectType.OID,
        value: typeOrOid,
      },
    ];
    pduVarbinds = pduVarbinds.concat(varbinds);

    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Notify,
      sessionID: this.sessionID,
      varbinds: pduVarbinds,
    });
    this.sendPdu(pdu, callback);
  }

  public ping(callback: AgentXPduSendCallback): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Ping,
      sessionID: this.sessionID,
    });
    this.sendPdu(pdu, callback);
  }

  public sendPdu(pdu: AgentXPdu, callback: AgentXPduSendCallback | null): void {
    console.debug(`Sending AgentX ${AgentXPduType[pdu.pduType]} PDU`);
    console.debug(pdu);

    const buffer = pdu.toBuffer();
    this.socket.write(buffer);
    if (pdu.pduType !== AgentXPduType.Response && !this.requestPdus[pdu.packetID]) {
      pdu.callback = callback;
      this.requestPdus[pdu.packetID] = pdu;
    }

    // Possible timeout / retry mechanism?
    // pdu.timer = setTimeout(function () {
    //   if (pdu.retries-- > 0) {
    //     this.sendPdu(pdu);
    //   } else {
    //     delete this.requestPdus[pdu.packetID];
    //     this.callback(new RequestTimedOutError('Request timed out'));
    //   }
    // }, this.timeout);
  }

  public onMsg(buffer: Buffer, rinfo: RemoteInfo): void {
    const pdu = AgentXPdu.createFromBuffer(buffer);

    console.debug(`Received AgentX ${AgentXPduType[pdu.pduType]} PDU`);
    console.debug(pdu);

    switch (pdu.pduType) {
      case AgentXPduType.Response:
        this.response(pdu);
        break;
      case AgentXPduType.Get:
        this.getRequest(pdu);
        break;
      case AgentXPduType.GetNext:
        this.getNextRequest(pdu);
        break;
      case AgentXPduType.GetBulk:
        this.getBulkRequest(pdu);
        break;
      case AgentXPduType.TestSet:
        this.testSet(pdu);
        break;
      case AgentXPduType.CommitSet:
        this.commitSet(pdu);
        break;
      case AgentXPduType.UndoSet:
        this.undoSet(pdu);
        break;
      case AgentXPduType.CleanupSet:
        this.cleanupSet(pdu);
        break;
      default:
        // Unknown PDU type - shouldn't happen as master agents shouldn't send administrative PDUs
        throw new RequestInvalidError(`Unknown PDU type '${pdu.pduType}' in request`);
    }
  }

  public response(pdu: AgentXPdu): void {
    const requestPdu = this.requestPdus[pdu.packetID];
    if (requestPdu) {
      delete this.requestPdus[pdu.packetID];
      // clearTimeout (pdu.timer);
      // delete pdu.timer;
      switch (requestPdu.pduType) {
        case AgentXPduType.Open:
          this.sessionID = pdu.sessionID;
          break;
        case AgentXPduType.Close:
          this.socket.end();
          break;
        case AgentXPduType.Register:
        case AgentXPduType.Unregister:
        case AgentXPduType.AddAgentCaps:
        case AgentXPduType.RemoveAgentCaps:
        case AgentXPduType.Notify:
        case AgentXPduType.Ping:
          break;
        default:
          // Response PDU for request type not handled
          throw new ResponseInvalidError(
            `Response PDU for type '${requestPdu.pduType}' not handled`,
            ResponseInvalidCode.EResponseNotHandled
          );
      }

      if (requestPdu.callback) {
        requestPdu.callback(null, pdu);
      }
    } else {
      // unexpected Response PDU - has no matching request
      throw new ResponseInvalidError(
        `Unexpected Response PDU with packetID '${pdu.packetID}'`,
        ResponseInvalidCode.EUnexpectedResponse
      );
    }
  }

  public request(pdu: AgentXPdu, requestVarbinds: Varbind[]): void {
    // TODO: Added
    if (!pdu.varbinds) {
      throw new Error('Error at Subagent.request(): PDU varbinds null or undefined');
    }

    let varbindsCompleted = 0;
    const varbindsLength = pdu.varbinds.length;
    const responseVarbinds: Varbind[] = [];

    for (let i = 0; i < requestVarbinds.length; i++) {
      const requestVarbind = requestVarbinds[i];
      const instanceNode = this.mib.lookup(requestVarbind.oid);
      let mibRequest: MibRequest;
      let handler: RequestHandlerCallback | undefined;
      // TODO: Check, omitted bc no really used out of the arrow func (done -> setRequestDoneCb)
      // let responseVarbindType: ObjectType | undefined;

      if (!instanceNode) {
        mibRequest = new MibRequest({
          operation: pdu.pduType,
          oid: requestVarbind.oid,
        });
        handler = (mibRequestForNso: MibRequest) => {
          mibRequestForNso.done({
            errorStatus: ErrorStatus.NoError,
            errorIndex: 0,
            type: ObjectType.NoSuchObject,
            value: null,
          });
        };
      } else {
        const providerNode = this.mib.getProviderNodeForInstance(instanceNode);
        if (!providerNode) {
          mibRequest = new MibRequest({
            operation: pdu.pduType,
            oid: requestVarbind.oid,
          });
          handler = (mibRequestForNsi: MibRequest) => {
            mibRequestForNsi.done({
              errorStatus: ErrorStatus.NoError,
              errorIndex: 0,
              type: ObjectType.NoSuchInstance,
              value: null,
            });
          };
        } else {
          mibRequest = new MibRequest({
            operation: pdu.pduType,
            providerNode: providerNode,
            instanceNode: instanceNode,
            oid: requestVarbind.oid,
          });
          if (pdu.pduType == AgentXPduType.TestSet) {
            mibRequest.setType = requestVarbind.type;
            mibRequest.setValue = requestVarbind.value;
          }
          // TODO: Check added. if providerNode.provider is null?
          if (providerNode.provider) {
            handler = providerNode.provider.handler;
          }
        }
      }

      varbindsCompleted = finishSubagentRequestAtVarbindIndex(
        this,
        pdu,
        mibRequest,
        requestVarbind,
        this.setTransactions,
        responseVarbinds,
        varbindsCompleted,
        varbindsLength,
        i
      );
      // responseVarbindType = finishRequestResult.responseVarbindType;
      // varbindsCompleted = finishRequestResult.varbindsCompleted;

      if (handler) {
        handler(mibRequest);
      } else {
        mibRequest.done();
      }
    }
  }

  public addGetNextVarbind(
    targetVarbinds: Varbind[],
    startOid: string
  ): MibNode | null | undefined {
    let startNode: MibNode | null;

    try {
      startNode = this.mib.lookup(startOid);
    } catch (error) {
      startOid = BASE_OID_ADDRESS;
      startNode = this.mib.lookup(startOid);
    }

    if (!startNode) {
      // Off-tree start specified
      startNode = this.mib.getTreeNode(startOid);
    }

    const getNextNode = startNode.getNextInstanceNode();
    if (!getNextNode) {
      // End of MIB
      targetVarbinds.push({
        oid: startOid,
        type: ObjectType.EndOfMibView,
        value: null,
      });
    } else {
      // Normal response
      targetVarbinds.push({
        oid: getNextNode.oid,
        type: getNextNode.valueType,
        value: getNextNode.value,
      });
    }

    return getNextNode;
  }

  public getRequest(pdu: AgentXPdu): void {
    const requestVarbinds: Varbind[] = [];

    for (let i = 0; i < pdu.searchRangeList.length; i++) {
      requestVarbinds.push({
        // TODO: Check, func that reads oid can return null, OID can be null?
        oid: pdu.searchRangeList[i].start,
        value: null,
        type: null,
      });
    }

    this.request(pdu, requestVarbinds);
  }

  public getNextRequest(pdu: AgentXPdu): void {
    const getNextVarbinds: Varbind[] = [];

    for (let i = 0; i < pdu.searchRangeList.length; i++) {
      // TODO: Check
      this.addGetNextVarbind(getNextVarbinds, pdu.searchRangeList[i].start);
    }

    this.request(pdu, getNextVarbinds);
  }

  public getBulkRequest(pdu: AgentXPdu): void {
    const getBulkVarbinds: Varbind[] = [];
    const startOid: string[] = [];
    let endOfMib = false;
    let getNextNode: MibNode | null | undefined;

    for (let n = 0; n < pdu.nonRepeaters; n++) {
      this.addGetNextVarbind(getBulkVarbinds, pdu.searchRangeList[n].start);
    }

    for (let v = pdu.nonRepeaters; v < pdu.searchRangeList.length; v++) {
      // TODO: Check. Only access to searchRange.oid, where is it assigned a value?
      // readSearchRangeList only sets start and end, not oid.
      startOid.push(pdu.searchRangeList[v].oid);
    }

    while (getBulkVarbinds.length < pdu.maxRepetitions && !endOfMib) {
      for (let w = pdu.nonRepeaters; w < pdu.searchRangeList.length; w++) {
        if (getBulkVarbinds.length < pdu.maxRepetitions) {
          getNextNode = this.addGetNextVarbind(getBulkVarbinds, startOid[w - pdu.nonRepeaters]);
          if (getNextNode) {
            startOid[w - pdu.nonRepeaters] = getNextNode.oid;
            if (getNextNode.type == ObjectType.EndOfMibView) {
              endOfMib = true;
            }
          }
        }
      }
    }

    this.request(pdu, getBulkVarbinds);
  }

  public sendGetResponse(requestPdu: AgentXPdu, varbinds: Varbind[]): void {
    const pdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Response,
      sessionID: requestPdu.sessionID,
      transactionID: requestPdu.transactionID,
      packetID: requestPdu.packetID,
      sysUpTime: DEFAULT_AGENTXPDU_SYS_UP_TIME,
      error: DEFAULT_AGENTXPDU_INDEX,
      index: DEFAULT_AGENTXPDU_ERROR,
      varbinds: varbinds,
    });

    this.sendPdu(pdu, null);
  }

  public sendSetResponse(setPdu: AgentXPdu): void {
    const responsePdu = AgentXPdu.createFromVariables({
      pduType: AgentXPduType.Response,
      sessionID: setPdu.sessionID,
      transactionID: setPdu.transactionID,
      packetID: setPdu.packetID,
      sysUpTime: DEFAULT_AGENTXPDU_SYS_UP_TIME,
      index: DEFAULT_AGENTXPDU_INDEX,
      error: DEFAULT_AGENTXPDU_ERROR,
    });

    this.sendPdu(responsePdu, null);
  }

  public testSet(setPdu: AgentXPdu): void {
    // TODO: Added
    if (!setPdu.varbinds) {
      throw new Error('Error at Subagent.testSet(): PDU varbinds null or undefined');
    }

    this.setTransactions[setPdu.transactionID] = setPdu;
    this.request(setPdu, setPdu.varbinds);
  }

  public commitSet(setPdu: AgentXPdu): void {
    if (this.setTransactions[setPdu.transactionID]) {
      // TODO: Added
      const pduVarbinds = this.setTransactions[setPdu.transactionID].varbinds;
      if (!pduVarbinds) {
        throw new Error('Error at Subagent.commitSet(): PDU varbinds null or undefined');
      }

      this.request(setPdu, pduVarbinds);
    } else {
      throw new RequestInvalidError(
        `Unexpected CommitSet PDU with transactionID ${setPdu.transactionID}`
      );
    }
  }

  // TODO: Same as in commitSet
  public undoSet(setPdu: AgentXPdu): void {
    if (this.setTransactions[setPdu.transactionID]) {
      // TODO: Added
      const pduVarbinds = this.setTransactions[setPdu.transactionID].varbinds;
      if (!pduVarbinds) {
        throw new Error('Error at Subagent.commitSet(): PDU varbinds null or undefined');
      }

      this.request(setPdu, pduVarbinds);
    } else {
      throw new RequestInvalidError(
        `Unexpected UndoSet PDU with transactionID ${setPdu.transactionID}`
      );
    }
  }

  public cleanupSet(setPdu: AgentXPdu): void {
    if (this.setTransactions[setPdu.transactionID]) {
      delete this.setTransactions[setPdu.transactionID];
    } else {
      throw new RequestInvalidError(
        `Unexpected CleanupSet PDU with transactionID ${setPdu.transactionID}`
      );
    }
  }

  public static create(options: SubagentOptions): Subagent {
    const subagent = new Subagent(options);
    subagent.connectSocket();
    return subagent;
  }
}
