import { RemoteInfo } from 'dgram';
import { Agent, AgentRequestPdu, CreateScalarInstanceResult, CreateTableInstanceResult } from '.';
import { Authorizer } from '../authorizer';
import {
  AccessControlModelType,
  ErrorStatus,
  MibProviderType,
  ObjectType,
  PduType,
  RowStatus,
  Version3,
} from '../constants';
import { Listener } from '../listener';
import { Message } from '../message';
import { Mib } from '../mib';
import {
  MibNode,
  MibScalarProvider,
  MibTableProvider,
  MibTableProviderIndexEntry,
} from '../mibNode';
import { MibRequest } from '../mibRequest';
import { MibRequestDoneError } from '../mibRequest/MibRequest.interfaces';
import { GetResponsePdu } from '../pdu';
import { RequestHandlerCallback } from '../request.interfaces';
import { ResponseVarbind } from '../varbind.interfaces';

export function handleNoSuchObjectOnRequest(
  mibRequests: MibRequest[],
  handlers: (RequestHandlerCallback | undefined)[],
  requestPdu: AgentRequestPdu,
  index: number
): void {
  mibRequests[index] = new MibRequest({
    operation: requestPdu.type,
    oid: requestPdu.varbinds[index].oid,
  });
  handlers[index] = (mibRequestForNso: MibRequest) => {
    mibRequestForNso.done({
      errorStatus: ErrorStatus.NoError,
      type: ObjectType.NoSuchObject,
      value: null,
    });
  };
}

export function handleNoSuchInstanceOnRequest(
  mibRequests: MibRequest[],
  handlers: (RequestHandlerCallback | undefined)[],
  requestPdu: AgentRequestPdu,
  index: number
): void {
  mibRequests[index] = new MibRequest({
    operation: requestPdu.type,
    oid: requestPdu.varbinds[index].oid,
  });
  handlers[index] = (mibRequestForNsi: MibRequest) => {
    mibRequestForNsi.done({
      errorStatus: ErrorStatus.NoError,
      type: ObjectType.NoSuchInstance,
      value: null,
    });
  };
}

export function handleAccessNoAllowedOnRequest(
  mibRequests: MibRequest[],
  handlers: (RequestHandlerCallback | undefined)[],
  requestPdu: AgentRequestPdu,
  index: number
): void {
  mibRequests[index] = new MibRequest({
    operation: requestPdu.type,
    oid: requestPdu.varbinds[index].oid,
  });
  handlers[index] = (mibRequestForRana: MibRequest) => {
    mibRequestForRana.done({
      errorStatus: ErrorStatus.NoAccess,
      type: ObjectType.Null,
      value: null,
    });
  };
}

export function isAccessDeniedByAuthorizer(
  requestMessage: Message,
  authorizer: Authorizer
): boolean {
  const securityName =
    requestMessage.version == Version3 ? requestMessage.user.name : requestMessage.community;
  const accessControlModel = authorizer.getAccessControlModel();
  const requestPdu = requestMessage.pdu;
  if (!requestPdu) {
    // TODO: Check added
    throw new Error('Invalid request, message does not have PDU');
  }

  const isSimpleAccessControlModel =
    authorizer.getAccessControlModelType() == AccessControlModelType.Simple;
  const isAccessAllowed =
    accessControlModel != null &&
    accessControlModel.isAccessAllowed(requestMessage.version, securityName, requestPdu.type);

  return isSimpleAccessControlModel && isAccessAllowed;
}

export function isInconsistentValue(
  requestPdu: AgentRequestPdu,
  provider: MibScalarProvider | MibTableProvider,
  instanceNode: MibNode
): boolean {
  // TODO: Could be changed to find()
  const rowStatusColumn = (provider as MibTableProvider).tableColumns.reduce(
    (acc, current) => (current.rowStatus ? current.number : acc),
    null as any
  );

  const isSetRequest = requestPdu.type === PduType.SetRequest;
  const isTableProvider = provider.type == MibProviderType.Table;
  const hasRowStatusColumn =
    typeof rowStatusColumn == 'number' &&
    instanceNode.getTableColumnFromInstanceNode() === rowStatusColumn;

  return isSetRequest && isTableProvider && hasRowStatusColumn;
}

export function handleInconsistentValueOnRequest(
  mibRequests: MibRequest[],
  handlers: (RequestHandlerCallback | undefined)[],
  requestPdu: AgentRequestPdu,
  instanceNode: MibNode,
  castedValue: any,
  index: number
): void {
  const getIcsHandler = (mibRequestForIcs: MibRequest) => {
    mibRequestForIcs.done({
      errorStatus: ErrorStatus.InconsistentValue,
      type: ObjectType.Null,
      value: null,
    });
  };

  requestPdu.varbinds[index].requestValue = castedValue;

  switch (requestPdu.varbinds[index].value) {
    case RowStatus['active']:
    case RowStatus['notInService']:
      // Setting either of these states, when the row already exists, is fine
      break;
    case RowStatus['destroy']:
      // This case is handled later
      break;
    case RowStatus['createAndGo']:
      // Valid if this was a new row creation, but now set to active
      if (instanceNode.value === RowStatus['createAndGo']) {
        requestPdu.varbinds[index].value = RowStatus['active'];
      } else {
        // Row already existed
        mibRequests[index] = new MibRequest({
          operation: requestPdu.type,
          oid: requestPdu.varbinds[index].oid,
        });
        handlers[index] = getIcsHandler;
      }
      break;

    case RowStatus['createAndWait']:
      // Valid if this was a new row creation, but now set to notInService
      if (instanceNode.value === RowStatus['createAndWait']) {
        requestPdu.varbinds[index].value = RowStatus['notInService'];
      } else {
        // Row already existed
        mibRequests[index] = new MibRequest({
          operation: requestPdu.type,
          oid: requestPdu.varbinds[index].oid,
        });
        handlers[index] = getIcsHandler;
      }
      break;

    case RowStatus['notReady']:
    default:
      // It's not ever legal to set the RowStatus to
      // any value but the six that are defined, and
      // it's not legal to change the state to
      // "notReady".
      //
      // The row already exists, as determined by
      // the fact that we have an instanceNode, so
      // we can not apply a create action to the
      // RowStatus column, as dictated RFC-2579.
      // (See the summary state table on Page 8
      // (inconsistent value)
      mibRequests[index] = new MibRequest({
        operation: requestPdu.type,
        oid: requestPdu.varbinds[index].oid,
      });
      handlers[index] = getIcsHandler;
      break;
  }
}

export function finishAgentRequestAtVarbindIndex(
  agent: Agent,
  requestPdu: AgentRequestPdu,
  responsePdu: GetResponsePdu,
  providerNode: MibNode | null,
  instanceNode: MibNode,
  mibRequests: MibRequest[],
  handlers: (RequestHandlerCallback | undefined)[],
  oldValues: any[],
  createResult: (CreateScalarInstanceResult | CreateTableInstanceResult | undefined)[],
  varbindsCompleted: number,
  varbindsLength: number,
  rinfo: RemoteInfo,
  requestMessage: Message,
  varbindIndex: number
): number {
  const setRequestDoneCb = (savedIndex: number) => {
    const requestVarbind = requestPdu.varbinds[savedIndex];
    let responseVarbind: ResponseVarbind = { oid: '' }; // TODO: Bc oid required

    mibRequests[savedIndex].done = (error?: MibRequestDoneError) => {
      let rowIndex: any[] | null = null;
      let row: any[] | null = null;
      let deleted = false;
      let column: number | null = -1;
      responseVarbind = {
        oid: mibRequests[savedIndex].oid,
      };

      // TODO: Check added. Throw error?? Or handle it somehow so that it does
      // not crash everything (all requests in loop)
      if (requestVarbind.type == null || requestVarbind.value == null) {
        throw new Error(
          `Invalid request varbind at index ${savedIndex}: type and value cannot be null`
        );
      }

      if (error) {
        if (
          (typeof responsePdu.errorStatus == 'undefined' ||
            responsePdu.errorStatus == ErrorStatus.NoError) &&
          error.hasOwnProperty('errorStatus') && // TODO: Check added
          error['errorStatus'] != ErrorStatus.NoError
        ) {
          responsePdu.errorStatus = error['errorStatus'];
          responsePdu.errorIndex = savedIndex + 1;
        }
        responseVarbind.type =
          error.hasOwnProperty('type') && error['type'] ? error['type'] : ObjectType.Null;
        responseVarbind.value =
          error.hasOwnProperty('value') && error['value'] ? error['value'] : null;

        if (error['errorStatus'] != ErrorStatus.NoError) {
          responseVarbind.errorStatus = error['errorStatus'];
        }
      } else {
        const provider = providerNode ? providerNode.provider : null;
        const providerName = provider ? provider.name : null;
        let subOid: string;
        let subAddress: string[];

        // TODO: Added check for providerName
        if (providerNode && provider && providerName && provider.type == MibProviderType.Table) {
          column = instanceNode.getTableColumnFromInstanceNode();
          subOid = Mib.getSubOidFromBaseOid(instanceNode.oid, provider.oid);
          subAddress = subOid.split('.');
          subAddress.shift(); // shift off the column number, leaving the row index values
          rowIndex = Mib.getRowIndexFromOid(
            subAddress.join('.'),
            provider.tableIndex as MibTableProviderIndexEntry[] //TODO: Check
          );
          row = agent.mib.getTableRowCells(providerName, rowIndex);
        }

        if (provider && providerName && requestPdu.type == PduType.SetRequest) {
          // Is this a RowStatus column with a value of 6 (delete)?
          const rowStatusColumn =
            provider.type == MibProviderType.Table
              ? provider.tableColumns.reduce(
                  (acc, current) => (current.rowStatus ? current.number : acc),
                  null as any
                )
              : null;

          if (
            requestVarbind.value === RowStatus.destroy &&
            typeof rowStatusColumn == 'number' &&
            column === rowStatusColumn &&
            rowIndex // TODO: Check added
          ) {
            // Yup. Do the deletion.
            agent.mib.deleteTableRow(providerName, rowIndex);
            deleted = true;
            // This is going to return the prior state of the RowStatus column,
            // i.e., either "active" or "notInService". That feels wrong, but there
            // is no value we can set it to to indicate just-deleted. One would
            // think we could set it to "notReady", but that is explicitly defined
            // in RFC-2579 as "the conceptual row exists in the agent", which is
            // no longer the case now that we've deleted the row. We're not allowed
            // to ever return "destroy" as a status, so that doesn't give us an
            // option either.
          } else {
            // No special handling required. Just save the new value.
            const setResult = mibRequests[savedIndex].instanceNode.setValue(
              agent.castSetValue(requestVarbind.type, requestVarbind.value)
            );
            if (!setResult) {
              if (
                typeof responsePdu.errorStatus == 'undefined' ||
                responsePdu.errorStatus == ErrorStatus.NoError
              ) {
                responsePdu.errorStatus = ErrorStatus.WrongValue;
                responsePdu.errorIndex = savedIndex + 1;
              }
              responseVarbind.errorStatus = ErrorStatus.WrongValue;
            }
          }
        }

        if (
          (requestPdu.type == PduType.GetNextRequest ||
            requestPdu.type == PduType.GetBulkRequest) &&
          requestVarbind.type == ObjectType.EndOfMibView
        ) {
          responseVarbind.type = ObjectType.EndOfMibView;
        } else {
          responseVarbind.type = mibRequests[savedIndex].instanceNode.valueType;
        }
        responseVarbind.value = mibRequests[savedIndex].instanceNode.value;
      }

      if (providerNode && providerNode.provider && providerNode.provider.name) {
        responseVarbind.providerName = providerNode.provider.name;
      }

      if (requestPdu.type == PduType.GetNextRequest || requestPdu.type == PduType.GetNextRequest) {
        responseVarbind.previousOid = requestVarbind.previousOid;
      }
      if (requestPdu.type == PduType.SetRequest) {
        if (oldValues[savedIndex] !== undefined) {
          responseVarbind.oldValue = oldValues[savedIndex];
        }
        responseVarbind.requestType = requestVarbind.type;
        if (requestVarbind.requestValue) {
          responseVarbind.requestValue = agent.castSetValue(
            requestVarbind.type,
            requestVarbind.requestValue
          );
        } else {
          responseVarbind.requestValue = agent.castSetValue(
            requestVarbind.type,
            requestVarbind.value
          );
        }
      }

      if (createResult[savedIndex]) {
        responseVarbind.autoCreated = true;
      } else if (deleted) {
        responseVarbind.deleted = true;
      }

      if (
        providerNode &&
        providerNode.provider && // TODO: Check added
        providerNode.provider.type == MibProviderType.Table
      ) {
        responseVarbind.column = column;
        responseVarbind.columnPosition = providerNode.provider.tableColumns.findIndex(
          tc => tc.number == column
        );
        responseVarbind.rowIndex = rowIndex;
        if (!deleted && rowIndex) {
          row = agent.mib.getTableRowCells(providerNode.provider.name, rowIndex);
        }
        responseVarbind.row = row;
      }

      setSingleVarbind(responsePdu, savedIndex, responseVarbind);
      if (++varbindsCompleted == varbindsLength) {
        sendResponse.call(agent, rinfo, requestMessage, responsePdu);
      }
    };
  };

  setRequestDoneCb(varbindIndex);

  const handler = handlers[varbindIndex];
  if (handler) {
    handler(mibRequests[varbindIndex]);
  } else {
    mibRequests[varbindIndex].done();
  }

  return varbindsCompleted;
}

export function setSingleVarbind(
  responsePdu: GetResponsePdu,
  index: number,
  responseVarbind: ResponseVarbind
): void {
  responsePdu.varbinds[index] = responseVarbind;
}

export function sendResponse(
  rinfo: RemoteInfo,
  requestMessage: Message,
  responsePdu: GetResponsePdu
): void {
  const responseMessage = requestMessage.createResponseForRequest(responsePdu);
  this.listener.send(responseMessage, rinfo);
  this.callback(null, Listener.formatCallbackData(responseMessage.pdu, rinfo));
}
