import { MaxAccess, MibProviderType, ObjectType } from '../constants';
import { Mib } from '../mib/Mib';
import { RequestHandlerCallback } from '../request.interfaces';

export class MibNode {
  private _address: number[];
  private _oid: string;
  public parent: MibNode | null;
  public children: { [index: number]: MibNode };
  public provider: MibProvider | null;
  public value: any;
  public valueType: ObjectType;

  // TODO: Added for Agent.getBulkRequest
  public type: ObjectType;

  constructor(address: number[], parent: MibNode | null) {
    this._address = address;
    this._oid = this._address.join('.');
    this.parent = parent;
    this.children = [];
  }

  public get address(): number[] {
    return this._address;
  }

  public get oid(): string {
    return this._oid;
  }

  public child(index: number): MibNode {
    return this.children[index];
  }

  // TODO: Check children types
  public listChildren(lowest?: number): number[] {
    const sorted: number[] = [];
    const lowestIdx = lowest || 0;
    // this.children.forEach((_children, index) => {
    //   if (index >= lowestIdx) sorted.push(index);
    // });
    for (const index in this.children) {
      // TODO: Check, can it not be int?
      const indexNumber = +index;
      if (indexNumber >= lowestIdx) sorted.push(indexNumber);
    }
    sorted.sort((a, b) => a - b);
    return sorted;
  }

  public findChildImmediatelyBefore(index: number): MibNode | null {
    const sortedChildrenKeys = Object.keys(this.children).sort((a, b) => +a - +b);
    if (sortedChildrenKeys.length === 0) {
      return null;
    }
    for (let pos = 0; pos < sortedChildrenKeys.length; pos++) {
      const sortedChildrenKeyNumber = +sortedChildrenKeys[pos];
      if (index < sortedChildrenKeyNumber) {
        if (pos === 0) {
          return null;
        } else {
          return this.children[sortedChildrenKeys[pos - 1]];
        }
      }
    }
    return this.children[sortedChildrenKeys[sortedChildrenKeys.length - 1]];
  }

  public isDescendant(address: number[]): boolean {
    return MibNode.oidIsDescended(this._address, address);
  }

  public isAncestor(address: number[]): boolean {
    return MibNode.oidIsDescended(address, this._address);
  }

  public getAncestorProvider(): MibNode | null {
    if (this.provider) {
      return this;
    } else if (!this.parent) {
      return null;
    } else {
      return this.parent.getAncestorProvider();
    }
  }

  public getTableColumnFromInstanceNode(): number | null {
    if (this.parent && this.parent.provider) {
      return this._address[this._address.length - 1];
    } else if (!this.parent) {
      return null;
    } else {
      return this.parent.getTableColumnFromInstanceNode();
    }
  }

  public getConstraintsFromProvider(): MibConstraints | null | undefined {
    const providerNode = this.getAncestorProvider();
    if (!providerNode) {
      return null;
    }
    const provider = providerNode.provider;
    // TODO: Added checking for provider existence (could be undefined, see getAncestorProvider())
    if (provider && provider.type == MibProviderType.Scalar) {
      return provider.constraints;
    } else if (provider && provider.type == MibProviderType.Table) {
      const columnNumber = this.getTableColumnFromInstanceNode();
      if (!columnNumber) {
        return null;
      }
      const columnDefinition = provider.tableColumns.filter(
        column => column.number == columnNumber
      )[0];
      return columnDefinition ? columnDefinition.constraints : null;
    } else {
      return null;
    }
  }

  public setValue(newValue: any): boolean {
    let len: number;
    let min: number;
    let max: number;
    let range: MibRange;
    let found = false;
    const constraints = this.getConstraintsFromProvider();
    if (!constraints) {
      this.value = newValue;
      return true;
    }
    if (constraints.enumeration) {
      if (!constraints.enumeration[newValue]) {
        return false;
      }
    } else if (constraints.ranges) {
      for (range of constraints.ranges) {
        min = range.min != undefined ? range.min : Number.MIN_SAFE_INTEGER;
        max = range.max != undefined ? range.max : Number.MAX_SAFE_INTEGER;
        if (newValue >= min && newValue <= max) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    } else if (constraints.sizes) {
      // if size is constrained, value must have a length property
      if (newValue.length === undefined) {
        return false;
      }
      len = newValue.length;
      for (range of constraints.sizes) {
        min = range.min != undefined ? range.min : Number.MIN_SAFE_INTEGER;
        max = range.max != undefined ? range.max : Number.MAX_SAFE_INTEGER;
        if (len >= min && len <= max) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    this.value = newValue;
    return true;
  }

  public getInstanceNodeForTableRow(): MibNode | null | undefined {
    const childCount = Object.keys(this.children).length;
    if (childCount == 0) {
      if (this.value != null) {
        return this;
      } else {
        return null;
      }
    } else if (childCount == 1) {
      return this.children[0].getInstanceNodeForTableRow();
    } else if (childCount > 1) {
      return null;
    }
  }

  // TODO: Check where it is used to check index type
  public getInstanceNodeForTableRowIndex(index: number[]): MibNode | null | undefined {
    const childCount = Object.keys(this.children).length;
    if (childCount == 0) {
      if (this.value != null) {
        return this;
      } else {
        // not found
        return null;
      }
    } else {
      if (index.length == 0) {
        return this.getInstanceNodeForTableRow();
      } else {
        const nextChildIndexPart = index[0];
        if (nextChildIndexPart == null) {
          return null;
        }
        const remainingIndex = index.slice(1);
        if (this.children[nextChildIndexPart]) {
          return this.children[nextChildIndexPart].getInstanceNodeForTableRowIndex(remainingIndex);
        } else {
          return null;
        }
      }
    }
  }

  public getInstanceNodesForColumn(): MibNode[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const columnNode = this;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let instanceNode: MibNode | null | undefined = this;
    const instanceNodes: MibNode[] = [];

    while (
      instanceNode &&
      (instanceNode == columnNode || columnNode.isAncestor(instanceNode._address))
    ) {
      instanceNode = instanceNode.getNextInstanceNode();
      if (instanceNode && columnNode.isAncestor(instanceNode._address)) {
        instanceNodes.push(instanceNode);
      }
    }
    return instanceNodes;
  }

  public getNextInstanceNode(): MibNode | null | undefined {
    let siblingIndex: number;
    let childrenAddresses: string[];

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: MibNode | null = this;
    if (this.value != null) {
      // Need upwards traversal first
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      node = this;
      while (node) {
        siblingIndex = this._address.slice(-1)[0];
        node = node.parent;
        if (!node) {
          // end of MIB
          return null;
        } else {
          childrenAddresses = Object.keys(node.children).sort((a, b) => +a - +b);
          const siblingPosition = childrenAddresses.indexOf(siblingIndex.toString());
          if (siblingPosition + 1 < childrenAddresses.length) {
            node = node.children[childrenAddresses[siblingPosition + 1]];
            break;
          }
        }
      }
    }
    // Descent
    while (node) {
      if (node.value != null) {
        return node;
      }
      childrenAddresses = Object.keys(node.children).sort((a, b) => +a - +b);
      node = node.children[childrenAddresses[0]];
      if (!node) {
        // unexpected
        return null;
      }
    }
  }

  public delete(): void {
    // TODO: Check, original makes no sense
    // if (Object.keys(this.children) > 0) {
    if (Object.keys(this.children).length > 0) {
      throw new Error('Cannot delete non-leaf MIB node');
    }
    const addressLastPart = this._address.splice(-1)[0].toString();
    if (!this.parent) {
      return;
    }
    delete this.parent.children[addressLastPart];
    // TODO: Check if needed, null type added and above checking bc of this
    this.parent = null;
  }

  public pruneUpwards(): void {
    if (!this.parent) {
      return;
    }
    if (Object.keys(this.children).length == 0) {
      const lastAddressPart = this._address.splice(-1)[0].toString();
      delete this.parent.children[lastAddressPart];
      this.parent.pruneUpwards();
      this.parent = null;
    }
  }

  public dump(options: DumpOptions): void {
    if ((!options.leavesOnly || options.showProviders) && this.provider) {
      console.log(`${this._oid} [${MibProviderType[this.provider.type]}: ${this.provider.name}]`);
    } else if (!options.leavesOnly || Object.keys(this.children).length == 0) {
      let valueString: string;
      if (this.value != null) {
        valueString = ' = ';
        const types = options.showTypes ? `${ObjectType[this.valueType]}: ` : '';
        const values = options.showValues ? this.value : '';
        valueString = ` = ${types} ${values}`;
      } else {
        valueString = '';
      }
      console.log(`${this._oid} ${valueString}`);
    }
    for (const node of Object.keys(this.children).sort((a, b) => +a - +b)) {
      this.children[node].dump(options);
    }
  }

  public static oidIsDescended(oid: number[], ancestor: number[]): boolean {
    const ancestorAddress = Mib.convertOidToAddress(ancestor);
    const address = Mib.convertOidToAddress(oid);
    let isAncestor = true;

    if (address.length <= ancestorAddress.length) {
      return false;
    }

    // TODO: Check if it really works. Example: 1.3.1.1 and 1.2.1.1, break?
    ancestorAddress.forEach((o, index) => {
      if (address[index] !== ancestorAddress[index]) {
        isAncestor = false;
      }
    });

    return isAncestor;
  }
}

export interface DumpOptions {
  leavesOnly?: boolean;
  showProviders?: boolean;
  showTypes?: boolean;
  showValues?: boolean;
}

export interface MibConstraints {
  enumeration?: { [index: string]: string };
  ranges?: MibRange[];
  sizes?: MibSize[];
}

export interface MibRange {
  min?: number;
  max?: number;
}

export interface MibSize {
  min?: number;
  max?: number;
}

export interface MibBaseProvider {
  name: string;
  type: MibProviderType.Scalar | MibProviderType.Table;
  oid: string;
  maxAccess: MaxAccess;
  defVal?: any;
  handler?: RequestHandlerCallback;
}

export type MibProvider = MibScalarProvider | MibTableProvider;

export interface MibScalarProvider extends MibBaseProvider {
  type: MibProviderType.Scalar;
  scalarType: ObjectType;
  constraints?: MibConstraints;
  createHandler: ((createRequest: MibScalarCreateRequest) => any) | null;
}

// TODO: Check, circular reference
export interface MibScalarCreateRequest {
  provider: MibScalarProvider;
}

export interface MibTableProvider extends MibBaseProvider {
  type: MibProviderType.Table;
  tableColumns: MibTableProviderColumn[];
  tableIndex?: MibTableProviderIndexEntry[]; // TODO: Check number[]?
  tableAugments?: string;
  createHandler: ((createRequest: MibTableCreateRequest) => any) | null;
}

// TODO: Check, circular reference
export interface MibTableCreateRequest {
  provider: MibTableProvider;
  action: string; // TODO: 'createAndGo' | 'createAndWait';
  row: any;
}

export interface MibTableProviderColumn {
  number: number;
  name: string;
  type: ObjectType;
  maxAccess: MaxAccess;
  constraints?: MibConstraints;
  defVal?: any;
  rowStatus?: any; //TODO: Added due to Agent tryCreateInstance
}

export interface MibTableProviderIndexEntry {
  columnName?: string;
  columnNumber?: number;
  foreign?: string;
  type?: ObjectType;
  implied?: boolean;
}
