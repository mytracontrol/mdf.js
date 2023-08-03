/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var MibRequest = function (requestDefinition) {
  this.operation = requestDefinition.operation;
  this.address = Mib.convertOidToAddress(requestDefinition.oid);
  this.oid = this.address.join(".");
  this.providerNode = requestDefinition.providerNode;
  this.instanceNode = requestDefinition.instanceNode;
};

MibRequest.prototype.isScalar = function () {
  return (
    this.providerNode &&
    this.providerNode.provider &&
    this.providerNode.provider.type == MibProviderType.Scalar
  );
};

MibRequest.prototype.isTabular = function () {
  return (
    this.providerNode &&
    this.providerNode.provider &&
    this.providerNode.provider.type == MibProviderType.Table
  );
};
```
*/

import { MibProviderType } from '../constants';
import { Mib } from '../mib';
import { MibNode } from '../mibNode';
import { MibRequestDoneError } from './MibRequest.interfaces';

export class MibRequest {
  private operation: string;
  private address: number[];
  public oid: string;
  private providerNode: MibNode;
  public instanceNode: MibNode;

  // TODO: Set in Agent.request
  public setType: number | null; // TODO: Null due to Subagent.request
  public setValue: any;
  public done: (error?: MibRequestDoneError) => void;

  constructor(requestDefinition: any) {
    this.operation = requestDefinition.operation;
    this.address = Mib.convertOidToAddress(requestDefinition.oid);
    this.oid = this.address.join('.');
    this.providerNode = requestDefinition.providerNode;
    this.instanceNode = requestDefinition.instanceNode;
  }

  isScalar() {
    return (
      this.providerNode &&
      this.providerNode.provider &&
      this.providerNode.provider.type == MibProviderType.Scalar
    );
  }

  isTabular() {
    return (
      this.providerNode &&
      this.providerNode.provider &&
      this.providerNode.provider.type == MibProviderType.Table
    );
  }
}
