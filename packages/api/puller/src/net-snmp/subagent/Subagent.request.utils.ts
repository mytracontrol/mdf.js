import { AgentXPdu } from '../agentXpdu';
import { AgentXPduType, ObjectType } from '../constants';
import { MibRequest } from '../mibRequest';
import { MibRequestDoneError } from '../mibRequest/MibRequest.interfaces';
import { Varbind } from '../varbind.interfaces';
import { Subagent } from './Subagent';

export function finishSubagentRequestAtVarbindIndex(
  subagent: Subagent,
  pdu: AgentXPdu,
  mibRequest: MibRequest,
  requestVarbind: Varbind,
  setTransactions: any,
  responseVarbinds: any[],
  varbindsCompleted: number,
  varbindsLength: number,
  varbindIndex: number
): number {
  let responseVarbindType: ObjectType | undefined;
  const setRequestDoneCb = (savedIndex: number) => {
    let responseVarbind: any = {};
    mibRequest.done = (error?: MibRequestDoneError) => {
      if (error) {
        responseVarbind = {
          oid: mibRequest.oid,
          type: error.hasOwnProperty('type') && error['type'] ? error['type'] : ObjectType.Null,
          value: error.hasOwnProperty('value') && error['value'] ? error['value'] : null,
        };
      } else {
        if (pdu.pduType == AgentXPduType.TestSet) {
          // more tests?
        } else if (pdu.pduType == AgentXPduType.CommitSet) {
          setTransactions[pdu.transactionID].originalValue = mibRequest.instanceNode.value;
          mibRequest.instanceNode.value = requestVarbind.value;
        } else if (pdu.pduType == AgentXPduType.UndoSet) {
          mibRequest.instanceNode.value = setTransactions[pdu.transactionID].originalValue;
        }

        if (
          (pdu.pduType == AgentXPduType.GetNext || pdu.pduType == AgentXPduType.GetBulk) &&
          requestVarbind.type == ObjectType.EndOfMibView
        ) {
          responseVarbindType = ObjectType.EndOfMibView;
        } else {
          responseVarbindType = mibRequest.instanceNode.type;
        }

        responseVarbind = {
          oid: mibRequest.oid,
          type: responseVarbindType,
          value: mibRequest.instanceNode.value,
        };
      }

      responseVarbinds[savedIndex] = responseVarbind;

      if (++varbindsCompleted == varbindsLength) {
        if (
          pdu.pduType == AgentXPduType.TestSet ||
          pdu.pduType == AgentXPduType.CommitSet ||
          pdu.pduType == AgentXPduType.UndoSet
        ) {
          subagent.sendSetResponse.call(subagent, pdu);
        } else {
          subagent.sendGetResponse.call(subagent, pdu, responseVarbinds);
        }
      }
    };
  };

  setRequestDoneCb(varbindIndex);

  return varbindsCompleted;
}
