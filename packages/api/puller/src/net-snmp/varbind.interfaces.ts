export interface Varbind {
  oid: string;
  // TODO: Added null for Subagent.getRequest, not in doc
  // TODO: Added undefined for Session.get()
  type?: number | null;
  value?: any | null;
  requestValue?: any; // TODO: ADDed for Agent.request, not in doc
  previousOid?: string; // TODO: ADDed for Agent.request, not in doc
}

export interface ResponseVarbind {
  oid: string;
  type?: number;
  value?: any;
  errorStatus?: number;
  errorIndex?: number;
  providerName?: string;
  previousOid?: string;
  oldValue?: any;
  requestType?: number | null;
  requestValue?: any;
  autoCreated?: boolean;
  deleted?: boolean;
  column?: number | null;
  columnPosition?: number;
  rowIndex?: any[] | null;
  row?: any | null[];
}
