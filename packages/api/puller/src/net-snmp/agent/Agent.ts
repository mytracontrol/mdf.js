import { RemoteInfo } from 'dgram';
import {
  AGENT_DEFAULT_CONTEXT,
  AgentCallback,
  AgentOptions,
  AgentRequestPdu,
  CreateScalarInstanceResult,
  CreateTableInstanceResult,
  finishAgentRequestAtVarbindIndex,
  handleAccessNoAllowedOnRequest,
  handleInconsistentValueOnRequest,
  handleNoSuchInstanceOnRequest,
  handleNoSuchObjectOnRequest,
  isAccessDeniedByAuthorizer,
  isInconsistentValue,
} from '.';
import { Authorizer, AuthorizerOptions } from '../authorizer';
import {
  MaxAccess,
  MibProviderType,
  ObjectType,
  PduType,
  RowStatus,
  SecurityLevel,
  Version3,
} from '../constants';
import { Engine } from '../engine';
import { ProcessingError, RequestFailedError, RequestInvalidError } from '../errors';
import { Forwarder } from '../forwarder/Forwarder';
import { AGENT_DEFAULT_PORT, AGENT_DEFAULT_TRANSPORT } from '../forwarder/Forwarder.constants';
import { Listener } from '../listener';
import { ListenerOptions } from '../listener/Listener.interfaces';
import { Message } from '../message';
import { Mib } from '../mib';
import {
  MibNode,
  MibProvider,
  MibScalarCreateRequest,
  MibScalarProvider,
  MibTableCreateRequest,
  MibTableProvider,
  MibTableProviderIndexEntry,
} from '../mibNode';
import { MibRequest } from '../mibRequest';
import { BASE_OID_ADDRESS } from '../oids.constants';
import { generateId } from '../pdu/pduUtils';
import { Req } from '../req';
import { RequestHandlerCallback } from '../request.interfaces';
import { Varbind } from '../varbind.interfaces';

export class Agent {
  private listener: Listener;
  private engine: Engine;
  private authorizer: Authorizer;
  private _callback: AgentCallback;
  public mib: Mib;
  private context: string;
  private forwarder: Forwarder;

  constructor(options: AgentOptions, callback: AgentCallback, mib?: Mib) {
    const listenerOptions: ListenerOptions = {
      transport: options.transport || AGENT_DEFAULT_TRANSPORT,
      port: options.port || AGENT_DEFAULT_PORT,
      address: options.address || null,
      disableAuthorization: options.disableAuthorization || false,
    };
    this.listener = new Listener(listenerOptions, this);

    // TODO: Check, engine ID is not optional bc no check of existence
    this.engine = new Engine(options.engineID);

    // TODO: Added default
    const authorizerOptions: AuthorizerOptions = {
      disableAuthorization: options.disableAuthorization || false,
      accessControlModelType: options.accessControlModelType,
    };
    this.authorizer = new Authorizer(authorizerOptions);

    this._callback =
      callback ||
      (() => {
        /*empty*/
      });
    this.mib = mib || new Mib();
    this.context = AGENT_DEFAULT_CONTEXT;
    this.forwarder = new Forwarder(this.listener, this._callback);
  }

  public get callback(): AgentCallback {
    return this._callback;
  }

  public getMib(): Mib {
    return this.mib;
  }

  public setMib(mib: Mib): void {
    this.mib = mib;
  }

  public getAuthorizer(): Authorizer {
    return this.authorizer;
  }

  public registerProvider(provider: MibProvider): void {
    this.mib.registerProvider(provider);
  }

  public registerProviders(providers: MibProvider[]): void {
    this.mib.registerProviders(providers);
  }

  public unregisterProvider(name: string): void {
    this.mib.unregisterProvider(name);
  }

  public getProvider(name: string): MibProvider {
    return this.mib.getProvider(name);
  }

  public getProviders(): { [key: string]: MibProvider } {
    return this.mib.getProviders();
  }

  public scalarReadCreateHandlerInternal(createRequest: MibScalarCreateRequest): any | undefined {
    const provider = createRequest.provider;
    // If there's a default value specified...
    if (provider && typeof provider.defVal !== 'undefined') {
      // ...then use it
      return provider.defVal;
    }

    // We don't have enough information to auto-create the scalar
    return undefined;
  }

  public tableRowStatusHandlerInternal(createRequest: MibTableCreateRequest): any | undefined {
    const provider = createRequest.provider;
    const action = createRequest.action;
    const row = createRequest.row;
    const values: any[] = [];
    let missingDefVal = false;
    const rowIndexValues = Array.isArray(row) ? row.slice(0) : [row];
    const tableColumns = provider.tableColumns;

    tableColumns.forEach(columnInfo => {
      // Index columns get successive values from the rowIndexValues array.
      // RowStatus columns get either "active" or "notInService" values.
      // Every other column requires a defVal.
      const tableIndex = provider.tableIndex || [];
      const entries = tableIndex.filter(entry => columnInfo.number === entry.columnNumber);
      if (entries.length > 0) {
        // It's an index column. Use the next index value
        values.push(rowIndexValues.shift());
      } else if (columnInfo.rowStatus) {
        // It's the RowStatus column. Retain the action value for now; replaced later
        values.push(RowStatus[action]);
      } else if ('defVal' in columnInfo) {
        // Neither index nor RowStatus column, so use the default value
        values.push(columnInfo.defVal);
      } else {
        // Default value was required but not found
        console.log('No defVal defined for column:', columnInfo);
        missingDefVal = true;
        values.push(undefined); // just for debugging; never gets returned
      }
    });

    // If a default value was missing, we can't auto-create the table row.
    // Otherwise, we're good to go: give 'em the column values.
    return missingDefVal ? undefined : values;
  }

  public onMsg(buffer: Buffer, rinfo: RemoteInfo): void {
    try {
      const message = Listener.processIncoming(buffer, this.authorizer, this._callback);
      // TODO: Added check for !message.pdu, return for that case too?
      if (!message || !message.pdu) {
        return;
      }

      // SNMPv3 discovery
      if (
        message.version == Version3 &&
        message.pdu.type == PduType.GetRequest &&
        !message.hasAuthoritativeEngineID() &&
        message.isReportable()
      ) {
        const reportMessage = message.createReportResponseMessage(this.engine, this.context);
        this.listener.send(reportMessage, rinfo);
        return;
      }

      // Request processing
      if (message.pdu.contextName && message.pdu.contextName != '') {
        this.onProxyRequest(message, rinfo);
      } else if (message.pdu.type == PduType.GetRequest) {
        this.getRequest(message, rinfo);
      } else if (message.pdu.type == PduType.SetRequest) {
        this.setRequest(message, rinfo);
      } else if (message.pdu.type == PduType.GetNextRequest) {
        this.getNextRequest(message, rinfo);
      } else if (message.pdu.type == PduType.GetBulkRequest) {
        this.getBulkRequest(message, rinfo);
      } else {
        this._callback(
          new RequestInvalidError(
            `Unexpected PDU type ${message.pdu.type} (${PduType[message.pdu.type]})`
          )
        );
      }
    } catch (error) {
      this._callback(
        new ProcessingError(`Failure to process incoming message`, error, rinfo, buffer)
      );
    }
  }

  // TODO: Check later to see possible types for value
  public castSetValue(type: ObjectType, value: any): any {
    switch (type) {
      case ObjectType.Boolean:
        return !!value;
      case ObjectType.Integer:
        if (typeof value != 'number' && typeof value != 'string') {
          // TODO: Check. Original shows error, no 2nd arg. Same for below ones
          // throw new Error('Invalid Integer', value);
          throw new Error(`Invalid Integer:  ${value}`);
        }
        return typeof value == 'number' ? value : parseInt(value, 10);
      case ObjectType.OctetString:
        if (value instanceof Buffer) {
          return value.toString();
        } else if (typeof value == 'string') {
          throw new Error(`Invalid OctetString ${value}`);
        } else {
          return value;
        }
      case ObjectType.OID:
        if (typeof value != 'string' || !value.match(/[0-9]+\([.][0-9]+\)+/)) {
          throw new Error(`Invalid OID ${value}`);
        }
        return value;
      case ObjectType.Counter:
      case ObjectType.Counter64:
        // Counters should be initialized to 0 (RFC2578, end of section 7.9)
        // We'll do so.
        return 0;
      case ObjectType.IpAddress:
        const bytes = value.split('.');
        if (typeof value != 'string' || bytes.length != 4) {
          throw new Error(`Invalid IpAddress ${value}`);
        }
        return value;
      default:
        // Assume the caller knows what he's doing
        return value;
    }
  }

  public tryCreateInstance(
    varbind: Varbind,
    requestType: PduType
  ): CreateScalarInstanceResult | CreateTableInstanceResult | undefined {
    const oid = varbind.oid;
    const providersByOid = this.mib.providersByOid;
    let subOid: string;
    let subAddress: string[];

    // Look for the provider.
    const fullAddress = Mib.convertOidToAddress(oid);
    for (let address = fullAddress.slice(0); address.length > 0; address.pop()) {
      subOid = address.join('.'); // create an oid from the current address

      // Does this oid have a provider?
      const provider = providersByOid[subOid];
      if (provider) {
        /**
         * Scalar
         *
         */
        if (provider.type == MibProviderType.Scalar) {
          // Does this provider support "read-create"?
          if (provider.maxAccess != MaxAccess['read-create']) {
            return undefined;
          }

          // See if the provider says not to auto-create this scalar
          if (provider.createHandler === null) {
            return undefined;
          }

          // Call the provider-provided handler if available, or the default one if not
          const createRequest: MibScalarCreateRequest = { provider: provider };
          let scalarValue = (provider.createHandler || this.scalarReadCreateHandlerInternal)(
            createRequest
          );
          if (typeof scalarValue == 'undefined') {
            return undefined;
          }

          // Ensure the value is of the correct type, and save it
          scalarValue = this.castSetValue(provider.scalarType, scalarValue);
          this.mib.setScalarValue(provider.name, scalarValue);

          // Now there should be an instanceNode available.
          return {
            instanceNode: this.mib.lookup(oid),
            providerType: MibProviderType.Scalar,
          };
        }

        /**
         * Table
         *
         * This is where we would support "read-create" of table
         * columns. RFC2578 section 7.1.12.1, however, implies
         * that rows should be created only via use of the
         * RowStatus column. We'll therefore avoid creating rows
         * based solely on any other column's "read-create"
         * max-access value.
         */
        subOid = Mib.getSubOidFromBaseOid(oid, provider.oid);
        subAddress = subOid.split('.');
        const columnStr = subAddress.shift();
        // TODO: Check added
        if (!columnStr) {
          throw new Error('Invalid subOid');
        }
        const column = parseInt(columnStr, 10);
        const row = Mib.getRowIndexFromOid(
          subAddress.join('.'),
          provider.tableIndex as MibTableProviderIndexEntry[]
        );
        // TODO: It finds the status columns. Use find()?
        const rowStatusColumn = provider.tableColumns.reduce(
          (acc, current) => (current.rowStatus ? current.number : acc),
          null as any
        );

        if (
          requestType == PduType.SetRequest &&
          typeof rowStatusColumn == 'number' &&
          column == rowStatusColumn
        ) {
          if (
            (varbind.value == RowStatus.createAndGo || varbind.value == RowStatus.createAndWait) &&
            provider.createHandler !== null
          ) {
            // The create handler will return an array containing all table column values for the
            // table row to be added.
            const createRequest: MibTableCreateRequest = {
              provider: provider,
              action: RowStatus[varbind.value],
              row: row,
            };
            let tableValue: any[] = (provider.createHandler || this.tableRowStatusHandlerInternal)(
              createRequest
            );
            if (typeof tableValue == 'undefined') {
              // Handler said do not create instance
              return undefined;
            }

            if (!Array.isArray(tableValue)) {
              // TODO: Join 2 params in 1 message
              throw new Error(`createHandler must return an array or undefined; got ${tableValue}`);
            }

            if (tableValue.length != provider.tableColumns.length) {
              throw new Error(
                `createHandler's returned array must contain a value for each column`
              );
            }

            // Map each column's value to the appropriate type
            tableValue = tableValue.map((v, i) =>
              this.castSetValue(provider.tableColumns[i].type, v)
            );

            // Add the table row
            this.mib.addTableRow(provider.name, tableValue);

            // Now there should be an instanceNode available.
            return {
              instanceNode: this.mib.lookup(oid),
              providerType: MibProviderType.Table,
              action: RowStatus[varbind.value],
              rowIndex: row,
              row: tableValue,
            };
          }
        }

        return undefined;
      }
    }
    return undefined;
  }

  public isAllowed(
    pduType: PduType,
    provider: MibScalarProvider | MibTableProvider,
    instanceNode: MibNode
  ): boolean {
    let maxAccess: MaxAccess;
    if (provider.type == MibProviderType.Scalar) {
      // It's a scalar. We'll use the provider's maxAccess
      maxAccess = provider.maxAccess;
    } else {
      // It's a table column. Use that column's maxAccess.
      const column = instanceNode.getTableColumnFromInstanceNode();

      // In the typical case, we could use (column - 1) to index
      // into tableColumns to get to the correct entry. There is no
      // guarantee, however, that column numbers in the OID are
      // necessarily consecutive; theoretically some could be
      // missing. We'll therefore play it safe and search for the
      // specified column entry.
      const columnEntry = provider.tableColumns.find(entry => entry.number === column);
      maxAccess = columnEntry
        ? columnEntry.maxAccess || MaxAccess['not-accessible']
        : MaxAccess['not-accessible'];
    }

    switch (PduType[pduType]) {
      case 'SetRequest':
        // SetRequest requires at least read-write access
        return maxAccess >= MaxAccess['read-write'];
      case 'GetRequest':
      case 'GetNextRequest':
      case 'GetBulkRequest':
        // GetRequests require at least read-only access
        return maxAccess >= MaxAccess['read-only'];
      default:
        // Disallow other pdu types
        return false;
    }
  }

  public getInstanceNodeForRequest(
    requestPdu: AgentRequestPdu,
    createResult: (CreateScalarInstanceResult | CreateTableInstanceResult | undefined)[],
    createResultIndex: number
  ): MibNode | null {
    let instanceNode = this.mib.lookup(requestPdu.varbinds[createResultIndex].oid);
    // If we didn't find an instance node, see if we can
    // automatically create it, either because it has
    // "read-create" MAX-ACCESS, or because it's a RowStatus SET
    // indicating create.
    if (!instanceNode) {
      const createInstanceRes = this.tryCreateInstance(
        requestPdu.varbinds[createResultIndex],
        requestPdu.type
      );
      createResult[createResultIndex] = createInstanceRes;
      if (createInstanceRes) {
        instanceNode = createInstanceRes.instanceNode;
      }
    }

    return instanceNode;
  }

  public request(requestMessage: Message, rinfo: RemoteInfo): void {
    const requestPdu = requestMessage.pdu as AgentRequestPdu; // TODO: Forced cast, could check
    const createResult: (CreateScalarInstanceResult | CreateTableInstanceResult | undefined)[] = [];
    const mibRequests: MibRequest[] = [];
    const handlers: (RequestHandlerCallback | undefined)[] = [];
    const oldValues: any[] = [];
    const responsePdu = requestPdu.getResponsePduForRequest();
    const varbindsLength = requestPdu.varbinds.length;
    let varbindsCompleted = 0;

    // TODO: Check added
    if (!requestPdu) {
      throw new Error('Invalid request, message does not have PDU');
    }

    for (let i = 0; i < requestPdu.varbinds.length; i++) {
      const instanceNode = this.getInstanceNodeForRequest(requestPdu, createResult, i);
      let providerNode: MibNode | null = null;

      // workaround re-write of OIDs less than 4 digits due to asn1-ber length limitation
      if (requestPdu.varbinds[i].oid.split('.').length < 4) {
        requestPdu.varbinds[i].oid = BASE_OID_ADDRESS;
      }

      if (!instanceNode) {
        handleNoSuchObjectOnRequest(mibRequests, handlers, requestPdu, i);
      } else {
        providerNode = this.mib.getProviderNodeForInstance(instanceNode);
        if (!providerNode || instanceNode.value === undefined) {
          handleNoSuchInstanceOnRequest(mibRequests, handlers, requestPdu, i);
        } else if (!providerNode.provider) {
          // TODO: Check added, OK? Or error if no provider?
          throw new Error('Provider node has no provider');
        } else if (!this.isAllowed(requestPdu.type, providerNode.provider, instanceNode)) {
          // requested access not allowed (by MAX-ACCESS)
          handleAccessNoAllowedOnRequest(mibRequests, handlers, requestPdu, i);
        } else if (!isAccessDeniedByAuthorizer(requestMessage, this.authorizer)) {
          // Access control check
          handleAccessNoAllowedOnRequest(mibRequests, handlers, requestPdu, i);
        } else if (isInconsistentValue(requestPdu, providerNode.provider, instanceNode)) {
          const varbindType = requestPdu.varbinds[i].type;
          // TODO: Check added. Throw error? We could have a handleInvalidTypeOnRequest()
          if (!varbindType) {
            throw new Error('Invalid request, varbind does not have type');
          }
          const castedSetValue = this.castSetValue(varbindType, requestPdu.varbinds[i].value);
          handleInconsistentValueOnRequest(
            mibRequests,
            handlers,
            requestPdu,
            instanceNode,
            castedSetValue,
            i
          );
        }

        if (requestPdu.type === PduType.SetRequest && !createResult[i]) {
          oldValues[i] = instanceNode.value;
        }

        if (!handlers[i]) {
          mibRequests[i] = new MibRequest({
            operation: requestPdu.type,
            providerNode: providerNode,
            instanceNode: instanceNode,
            oid: requestPdu.varbinds[i].oid,
          });

          if (requestPdu.type == PduType.SetRequest) {
            mibRequests[i].setType = requestPdu.varbinds[i].type;
            mibRequests[i].setValue =
              requestPdu.varbinds[i].requestValue || requestPdu.varbinds[i].value;
          }
          // TODO: Check. ? for providerNode and provider
          handlers[i] = providerNode?.provider?.handler;
        }
      }

      // TODO: Check added. What to do if no instance node?
      if (instanceNode) {
        varbindsCompleted = finishAgentRequestAtVarbindIndex(
          this,
          requestPdu,
          responsePdu,
          providerNode,
          instanceNode,
          mibRequests,
          handlers,
          oldValues,
          createResult,
          varbindsCompleted,
          varbindsLength,
          rinfo,
          requestMessage,
          i
        );
      }
    }
  }

  public getRequest(requestMessage: Message, rinfo: RemoteInfo): void {
    this.request(requestMessage, rinfo);
  }

  public setRequest(requestMessage: Message, rinfo: RemoteInfo): void {
    this.request(requestMessage, rinfo); // TODO: Same as getRequest
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
        previousOid: startOid,
        oid: startOid,
        type: ObjectType.EndOfMibView,
        value: null,
      });
    } else {
      // Normal response
      targetVarbinds.push({
        previousOid: startOid,
        oid: getNextNode.oid,
        type: getNextNode.valueType,
        value: getNextNode.value,
      });
    }

    return getNextNode;
  }

  public getNextRequest(requestMessage: Message, rinfo: RemoteInfo): void {
    const requestPdu = requestMessage.pdu;
    // TODO: Added
    if (!requestPdu) {
      throw new Error('Invalid request, message does not have PDU');
    }

    const varbindsLength = requestPdu.varbinds.length;
    const getNextVarbinds = [];
    for (let i = 0; i < varbindsLength; i++) {
      this.addGetNextVarbind(getNextVarbinds, requestPdu.varbinds[i].oid);
    }

    requestPdu.varbinds = getNextVarbinds;
    this.request(requestMessage, rinfo);
  }

  public getBulkRequest(requestMessage: Message, rinfo: RemoteInfo): void {
    const requestPdu = requestMessage.pdu;
    // TODO: Added
    if (!requestPdu) {
      throw new Error('Invalid request, message does not have PDU');
    }

    const requestVarbinds = requestPdu.varbinds;
    const getBulkVarbinds = [];
    const startOid: string[] = [];
    let endOfMib = false;
    let getNextNode: MibNode | null | undefined;

    // TODO: Check. Added, they have default values 0, 20 (doc). Where assigned.
    // Because they are deleted in Listener.formatCallbackData()
    const nonRepeaters = requestPdu.nonRepeaters != null ? requestPdu.nonRepeaters : 0;
    const maxRepetitions = requestPdu.maxRepetitions != null ? requestPdu.maxRepetitions : 20;

    for (let n = 0; n < Math.min(nonRepeaters, requestVarbinds.length); n++) {
      this.addGetNextVarbind(getBulkVarbinds, requestVarbinds[n].oid);
    }

    if (nonRepeaters < requestVarbinds.length) {
      for (let v = nonRepeaters; v < requestVarbinds.length; v++) {
        startOid.push(requestVarbinds[v].oid);
      }

      while (getBulkVarbinds.length < maxRepetitions && !endOfMib) {
        for (let w = nonRepeaters; w < requestVarbinds.length; w++) {
          if (getBulkVarbinds.length < maxRepetitions) {
            getNextNode = this.addGetNextVarbind(getBulkVarbinds, startOid[w - nonRepeaters]);
            if (getNextNode) {
              startOid[w - nonRepeaters] = getNextNode.oid;
              if (getNextNode.type == ObjectType.EndOfMibView) {
                endOfMib = true;
              }
            }
          }
        }
      }
    }

    requestPdu.varbinds = getBulkVarbinds;
    this.request(requestMessage, rinfo);
  }

  public onProxyRequest(message: Message, rinfo: RemoteInfo): void {
    if (!message.pdu) {
      throw new Error('Invalid request, message does not have PDU');
    }

    if (message.version != Version3) {
      this._callback(new RequestFailedError('Only SNMP version 3 contexts are supported'));
      return;
    }

    const contextName = message.pdu.contextName;
    // TODO: Check added. Throw error or this.callback?
    if (!contextName) {
      throw new Error('Invalid request, message PDU does not have context name');
    }
    const proxy = this.forwarder.getProxy(contextName);
    if (!proxy) {
      this._callback(
        new RequestFailedError(`No proxy found for message received with context ${contextName}`)
      );
      return;
    }
    // TODO: Added. No needed anymore, session is not possibly undefined on proxyComplete
    // if (!proxy.session) {
    //   this.callback(
    //     new RequestFailedError(
    //       `No proxy session found for message received with context ${contextName}`
    //     )
    //   );
    //   return;
    // }

    if (!proxy.session?.msgSecurityParameters) {
      // Discovery required - but chaining not implemented from here yet
      proxy.session.sendV3Discovery(null, null, this._callback, {});
    } else {
      message.msgSecurityParameters = proxy.session.msgSecurityParameters;
      message.setAuthentication(!(proxy.user.level == SecurityLevel.noAuthNoPriv));
      message.setPrivacy(proxy.user.level == SecurityLevel.authPriv);
      const proxiedUser = message.user;
      message.user = proxy.user;
      message.buffer = null;
      message.pdu.contextEngineID = proxy.session.msgSecurityParameters?.authoritativeEngineId;
      message.pdu.contextName = AGENT_DEFAULT_CONTEXT;
      const proxiedPduId = message.pdu.id;
      message.pdu.id = generateId();
      // TODO: Error on original, extra param (true)
      // const req = new Req(proxy.session, message, null, this.callback, {}, true);
      const req = new Req(proxy.session, message, null, this._callback, {});
      req.port = proxy.port;
      req.proxiedRinfo = rinfo;
      req.proxiedPduId = proxiedPduId;
      req.proxiedUser = proxiedUser;
      req.proxiedEngine = this.engine;
      proxy.session.send(req);
    }
  }

  public getForwarder(): Forwarder {
    return this.forwarder;
  }

  public close(): void {
    this.listener.close();
  }

  // TODO: Check doc, optional mib?
  public static create(options: AgentOptions, callback: AgentCallback, mib: Mib): Agent {
    const agent = new Agent(options, callback, mib);
    agent.listener.startListening();
    return agent;
  }
}
