/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var Mib = function () {
  var providersByOid;
  this.root = new MibNode([], null);
  this.providerNodes = {};

  // this.providers will be modified throughout this code.
  // Keep this.providersByOid in sync with it
  providersByOid = this.providersByOid = {};
  this.providers = new Proxy(
    {},
    {
      set: function (target, key, value) {
        target[key] = value;
        providersByOid[value.oid] = value;
      },

      deleteProperty: function (target, key) {
        delete providersByOid[target[key].oid];
        delete target[key];
      },
    }
  );
};

Mib.prototype.addNodesForOid = function (oidString) {
  var address = Mib.convertOidToAddress(oidString);
  return this.addNodesForAddress(address);
};

Mib.prototype.addNodesForAddress = function (address) {
  var node;
  var i;

  node = this.root;

  for (i = 0; i < address.length; i++) {
    if (!node.children.hasOwnProperty(address[i])) {
      node.children[address[i]] = new MibNode(address.slice(0, i + 1), node);
    }
    node = node.children[address[i]];
  }

  return node;
};

Mib.prototype.lookup = function (oid) {
  var address;

  address = Mib.convertOidToAddress(oid);
  return this.lookupAddress(address);
};

Mib.prototype.lookupAddress = function (address) {
  var i;
  var node;

  node = this.root;
  for (i = 0; i < address.length; i++) {
    if (!node.children.hasOwnProperty(address[i])) {
      return null;
    }
    node = node.children[address[i]];
  }

  return node;
};

Mib.prototype.getTreeNode = function (oid) {
  var address = Mib.convertOidToAddress(oid);
  var node;

  node = this.lookupAddress(address);
  // OID already on tree
  if (node) {
    return node;
  }

  while (address.length > 0) {
    var last = address.pop();
    var parent = this.lookupAddress(address);
    if (parent) {
      node = parent.findChildImmediatelyBefore(last);
      if (!node) return parent;
      while (true) {
        // Find the last descendant
        var childrenAddresses = Object.keys(node.children).sort(
          (a, b) => a - b
        );
        if (childrenAddresses.length == 0) return node;
        node = node.children[childrenAddresses[childrenAddresses.length - 1]];
      }
    }
  }
  return this.root;
};

Mib.prototype.getProviderNodeForInstance = function (instanceNode) {
  if (instanceNode.provider) {
    // throw new ReferenceError ("Instance node has provider which should never happen");
    return null;
  }
  return instanceNode.getAncestorProvider();
};

Mib.prototype.addProviderToNode = function (provider) {
  var node = this.addNodesForOid(provider.oid);

  node.provider = provider;
  if (provider.type == MibProviderType.Table) {
    if (!provider.tableIndex) {
      provider.tableIndex = [1];
    }
  }
  this.providerNodes[provider.name] = node;
  return node;
};

Mib.prototype.getColumnFromProvider = function (provider, indexEntry) {
  var column = null;
  if (indexEntry.columnName) {
    column = provider.tableColumns.filter(
      (column) => column.name == indexEntry.columnName
    )[0];
  } else if (
    indexEntry.columnNumber !== undefined &&
    indexEntry.columnNumber !== null
  ) {
    column = provider.tableColumns.filter(
      (column) => column.number == indexEntry.columnNumber
    )[0];
  }
  return column;
};

Mib.prototype.populateIndexEntryFromColumn = function (
  localProvider,
  indexEntry,
  i
) {
  var column = null;
  var tableProviders;
  if (!indexEntry.columnName && !indexEntry.columnNumber) {
    throw new Error(
      "Index entry " +
        i +
        ": does not have either a columnName or columnNumber"
    );
  }
  if (indexEntry.foreign) {
    // Explicit foreign table is first to search
    column = this.getColumnFromProvider(
      this.providers[indexEntry.foreign],
      indexEntry
    );
  } else {
    // If foreign table isn't given, search the local table next
    column = this.getColumnFromProvider(localProvider, indexEntry);
    if (!column) {
      // as a last resort, try to find the column in a foreign table
      tableProviders = Object.values(this.providers).filter(
        (prov) => prov.type == MibProviderType.Table
      );
      for (var provider of tableProviders) {
        column = this.getColumnFromProvider(provider, indexEntry);
        if (column) {
          indexEntry.foreign = provider.name;
          break;
        }
      }
    }
  }
  if (!column) {
    throw new Error(
      "Could not find column for index entry with column " +
        indexEntry.columnName
    );
  }
  if (indexEntry.columnName && indexEntry.columnName != column.name) {
    throw new Error(
      "Index entry " +
        i +
        ": Calculated column name " +
        column.name +
        "does not match supplied column name " +
        indexEntry.columnName
    );
  }
  if (indexEntry.columnNumber && indexEntry.columnNumber != column.number) {
    throw new Error(
      "Index entry " +
        i +
        ": Calculated column number " +
        column.number +
        " does not match supplied column number " +
        indexEntry.columnNumber
    );
  }
  if (!indexEntry.columnName) {
    indexEntry.columnName = column.name;
  }
  if (!indexEntry.columnNumber) {
    indexEntry.columnNumber = column.number;
  }
  indexEntry.type = column.type;
};

Mib.prototype.registerProvider = function (provider) {
  this.providers[provider.name] = provider;
  if (provider.type == MibProviderType.Table) {
    if (provider.tableAugments) {
      if (provider.tableAugments == provider.name) {
        throw new Error("Table " + provider.name + " cannot augment itself");
      }
      var augmentProvider = this.providers[provider.tableAugments];
      if (!augmentProvider) {
        throw new Error(
          "Cannot find base table " + provider.tableAugments + " to augment"
        );
      }
      provider.tableIndex = JSON.parse(
        JSON.stringify(augmentProvider.tableIndex)
      );
      provider.tableIndex.map(
        (index) => (index.foreign = augmentProvider.name)
      );
    } else {
      if (!provider.tableIndex) {
        provider.tableIndex = [1]; // default to first column index
      }
      for (var i = 0; i < provider.tableIndex.length; i++) {
        var indexEntry = provider.tableIndex[i];
        if (typeof indexEntry == "number") {
          provider.tableIndex[i] = {
            columnNumber: indexEntry,
          };
        } else if (typeof indexEntry == "string") {
          provider.tableIndex[i] = {
            columnName: indexEntry,
          };
        }
        indexEntry = provider.tableIndex[i];
        this.populateIndexEntryFromColumn(provider, indexEntry, i);
      }
    }
  }
};

Mib.prototype.setScalarDefaultValue = function (name, value) {
  let provider = this.getProvider(name);
  provider.defVal = value;
};

Mib.prototype.setTableRowDefaultValues = function (name, values) {
  let provider = this.getProvider(name);
  let tc = provider.tableColumns;

  // We must be given an array of exactly the right number of columns
  if (values.length != tc.length) {
    throw new Error(
      `Incorrect values length: got ${values.length}; expected ${tc.length}`
    );
  }

  // Add defVal to each table column.
  tc.forEach((entry, i) => {
    if (typeof values[i] != "undefined") {
      entry.defVal = values[i];
    }
  });
};

Mib.prototype.setScalarRanges = function (name, ranges) {
  let provider = this.getProvider(name);
  provider.constraints = { ranges };
};

Mib.prototype.setTableColumnRanges = function (name, column, ranges) {
  let provider = this.getProvider(name);
  let tc = provider.tableColumns;
  tc[column].constraints = { ranges };
};

Mib.prototype.setScalarSizes = function (name, sizes) {
  let provider = this.getProvider(name);
  provider.constraints = { sizes };
};

Mib.prototype.setTableColumnSizes = function (name, column, sizes) {
  let provider = this.getProvider(name);
  let tc = provider.tableColumns;
  tc[column].constraints = { sizes };
};

Mib.prototype.registerProviders = function (providers) {
  for (var provider of providers) {
    this.registerProvider(provider);
  }
};

Mib.prototype.unregisterProvider = function (name) {
  var providerNode = this.providerNodes[name];
  if (providerNode) {
    var providerNodeParent = providerNode.parent;
    providerNode.delete();
    providerNodeParent.pruneUpwards();
    delete this.providerNodes[name];
  }
  delete this.providers[name];
};

Mib.prototype.getProvider = function (name) {
  return this.providers[name];
};

Mib.prototype.getProviders = function () {
  return this.providers;
};

Mib.prototype.dumpProviders = function () {
  var extraInfo;
  for (var provider of Object.values(this.providers)) {
    extraInfo =
      provider.type == MibProviderType.Scalar
        ? ObjectType[provider.scalarType]
        : "Columns = " + provider.tableColumns.length;
    console.log(
      MibProviderType[provider.type] +
        ": " +
        provider.name +
        " (" +
        provider.oid +
        "): " +
        extraInfo
    );
  }
};

Mib.prototype.getScalarValue = function (scalarName) {
  var providerNode = this.providerNodes[scalarName];
  if (
    !providerNode ||
    !providerNode.provider ||
    providerNode.provider.type != MibProviderType.Scalar
  ) {
    throw new ReferenceError(
      "Failed to get node for registered MIB provider " + scalarName
    );
  }
  var instanceAddress = providerNode.address.concat([0]);
  if (!this.lookup(instanceAddress)) {
    throw new Error(
      "Failed created instance node for registered MIB provider " + scalarName
    );
  }
  var instanceNode = this.lookup(instanceAddress);
  return instanceNode.value;
};

Mib.prototype.setScalarValue = function (scalarName, newValue) {
  var providerNode;
  var instanceNode;
  var provider;

  if (!this.providers[scalarName]) {
    throw new ReferenceError(
      "Provider " + scalarName + " not registered with this MIB"
    );
  }

  providerNode = this.providerNodes[scalarName];
  if (!providerNode) {
    providerNode = this.addProviderToNode(this.providers[scalarName]);
  }
  provider = providerNode.provider;
  if (!providerNode || !provider || provider.type != MibProviderType.Scalar) {
    throw new ReferenceError(
      "Could not find MIB node for registered provider " + scalarName
    );
  }
  var instanceAddress = providerNode.address.concat([0]);
  instanceNode = this.lookup(instanceAddress);
  if (!instanceNode) {
    this.addNodesForAddress(instanceAddress);
    instanceNode = this.lookup(instanceAddress);
    instanceNode.valueType = provider.scalarType;
  }
  instanceNode.value = newValue;
  // return instanceNode.setValue (newValue);
};

Mib.prototype.getProviderNodeForTable = function (table) {
  var providerNode;
  var provider;

  providerNode = this.providerNodes[table];
  if (!providerNode) {
    throw new ReferenceError("No MIB provider registered for " + table);
  }
  provider = providerNode.provider;
  if (!providerNode) {
    throw new ReferenceError(
      "No MIB provider definition for registered provider " + table
    );
  }
  if (provider.type != MibProviderType.Table) {
    throw new TypeError(
      "Registered MIB provider " +
        table +
        " is not of the correct type (is type " +
        MibProviderType[provider.type] +
        ")"
    );
  }
  return providerNode;
};

Mib.prototype.getOidAddressFromValue = function (value, indexPart) {
  var oidComponents;
  switch (indexPart.type) {
    case ObjectType.OID:
      oidComponents = value.split(".");
      break;
    case ObjectType.OctetString:
      if (value instanceof Buffer) {
        // Buffer
        oidComponents = Array.prototype.slice.call(value);
      } else {
        // string
        oidComponents = [...value].map((c) => c.charCodeAt());
      }
      break;
    case ObjectType.IpAddress:
      return value.split(".");
    default:
      return [value];
  }
  if (!indexPart.implied && !indexPart.length) {
    oidComponents.unshift(oidComponents.length);
  }
  return oidComponents;
};

//    What is this empty function here for?
// Mib.prototype.getValueFromOidAddress = function (oid, indexPart) {

// };


Mib.prototype.getTableRowInstanceFromRow = function (provider, row) {
var rowIndex = [];
var foreignColumnParts;
var localColumnParts;
var localColumnPosition;
var oidArrayForValue;

// foreign columns are first in row
foreignColumnParts = provider.tableIndex.filter(
  (indexPart) => indexPart.foreign
);
for (var i = 0; i < foreignColumnParts.length; i++) {
  //rowIndex.push (row[i]);
  oidArrayForValue = this.getOidAddressFromValue(
    row[i],
    foreignColumnParts[i]
  );
  rowIndex = rowIndex.concat(oidArrayForValue);
}
// then local columns
localColumnParts = provider.tableIndex.filter(
  (indexPart) => !indexPart.foreign
);
for (var localColumnPart of localColumnParts) {
  localColumnPosition = provider.tableColumns.findIndex(
    (column) => column.number == localColumnPart.columnNumber
  );
  oidArrayForValue = this.getOidAddressFromValue(
    row[foreignColumnParts.length + localColumnPosition],
    localColumnPart
  );
  rowIndex = rowIndex.concat(oidArrayForValue);
}
return rowIndex;
};

Mib.getRowIndexFromOid = function (oid, index) {
var addressRemaining = oid.split(".");
var length = 0;
var values = [];
var value;
for (var indexPart of index) {
  switch (indexPart.type) {
    case ObjectType.OID:
      if (indexPart.implied) {
        length = addressRemaining.length;
      } else {
        length = addressRemaining.shift();
      }
      value = addressRemaining.splice(0, length);
      values.push(value.join("."));
      break;
    case ObjectType.IpAddress:
      length = 4;
      value = addressRemaining.splice(0, length);
      values.push(value.join("."));
      break;
    case ObjectType.OctetString:
      if (indexPart.implied) {
        length = addressRemaining.length;
      } else {
        length = addressRemaining.shift();
      }
      value = addressRemaining.splice(0, length);
      value = value.map((c) => String.fromCharCode(c)).join("");
      values.push(value);
      break;
    default:
      values.push(parseInt(addressRemaining.shift()));
  }
}
return values;
};

Mib.prototype.getTableRowInstanceFromRowIndex = function (
provider,
rowIndex
) {
var rowIndexOid = [];
var indexPart;
var keyPart;
for (var i = 0; i < provider.tableIndex.length; i++) {
  indexPart = provider.tableIndex[i];
  keyPart = rowIndex[i];
  rowIndexOid = rowIndexOid.concat(
    this.getOidAddressFromValue(keyPart, indexPart)
  );
}
return rowIndexOid;
};

Mib.prototype.addTableRow = function (table, row) {
var providerNode;
var provider;
var instance = [];
var instanceAddress;
var instanceNode;
var rowValueOffset;

if (this.providers[table] && !this.providerNodes[table]) {
  this.addProviderToNode(this.providers[table]);
}
providerNode = this.getProviderNodeForTable(table);
provider = providerNode.provider;
rowValueOffset = provider.tableIndex.filter(
  (indexPart) => indexPart.foreign
).length;
instance = this.getTableRowInstanceFromRow(provider, row);
for (var i = 0; i < provider.tableColumns.length; i++) {
  var column = provider.tableColumns[i];
  var isColumnIndex = provider.tableIndex.some(
    (indexPart) => indexPart.columnNumber == column.number
  );
  // prevent not-accessible and accessible-for-notify index entries from being added as columns in the row
  if (
    !isColumnIndex ||
    !(
      column.maxAccess === MaxAccess["not-accessible"] ||
      column.maxAccess === MaxAccess["accessible-for-notify"]
    )
  ) {
    instanceAddress = providerNode.address
      .concat(column.number)
      .concat(instance);
    this.addNodesForAddress(instanceAddress);
    instanceNode = this.lookup(instanceAddress);
    instanceNode.valueType = column.type;
    instanceNode.value = row[rowValueOffset + i];
  }
}
};

Mib.prototype.getTableColumnDefinitions = function (table) {
var providerNode;
var provider;

providerNode = this.getProviderNodeForTable(table);
provider = providerNode.provider;
return provider.tableColumns;
};

Mib.prototype.getTableColumnCells = function (
table,
columnNumber,
includeInstances
) {
var provider = this.providers[table];
var providerIndex = provider.tableIndex;
var providerNode = this.getProviderNodeForTable(table);
var columnNode = providerNode.children[columnNumber];
if (!columnNode) {
  return null;
}
var instanceNodes = columnNode.getInstanceNodesForColumn();
var instanceOid;
var indexValues = [];
var columnValues = [];

for (var instanceNode of instanceNodes) {
  instanceOid = Mib.getSubOidFromBaseOid(instanceNode.oid, columnNode.oid);
  indexValues.push(Mib.getRowIndexFromOid(instanceOid, providerIndex));
  columnValues.push(instanceNode.value);
}
if (includeInstances) {
  return [indexValues, columnValues];
} else {
  return columnValues;
}
};

Mib.prototype.getTableRowCells = function (table, rowIndex) {
var provider;
var providerNode;
var columnNode;
var instanceAddress;
var instanceNode;
var row = [];
var rowFound = false;

provider = this.providers[table];
providerNode = this.getProviderNodeForTable(table);
instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
for (var columnNumber of Object.keys(providerNode.children)) {
  columnNode = providerNode.children[columnNumber];
  if (columnNode) {
    instanceNode =
      columnNode.getInstanceNodeForTableRowIndex(instanceAddress);
    if (instanceNode) {
      row.push(instanceNode.value);
      rowFound = true;
    } else {
      row.push(null);
    }
  } else {
    row.push(null);
  }
}
if (rowFound) {
  return row;
} else {
  return null;
}
};

Mib.prototype.getTableCells = function (table, byRows, includeInstances) {
var providerNode;
var column;
var data = [];

providerNode = this.getProviderNodeForTable(table);
for (var columnNumber of Object.keys(providerNode.children)) {
  column = this.getTableColumnCells(table, columnNumber, includeInstances);
  if (includeInstances) {
    data.push(...column);
    includeInstances = false;
  } else {
    data.push(column);
  }
}

if (byRows) {
  return Object.keys(data[0]).map(function (c) {
    return data.map(function (r) {
      return r[c];
    });
  });
} else {
  return data;
}
};

Mib.prototype.getTableSingleCell = function (table, columnNumber, rowIndex) {
var provider;
var providerNode;
var instanceAddress;
var columnNode;
var instanceNode;

provider = this.providers[table];
providerNode = this.getProviderNodeForTable(table);
instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
columnNode = providerNode.children[columnNumber];
instanceNode = columnNode.getInstanceNodeForTableRowIndex(instanceAddress);
return instanceNode.value;
};

Mib.prototype.setTableSingleCell = function (
table,
columnNumber,
rowIndex,
value
) {
var provider;
var providerNode;
var columnNode;
var instanceNode;
var instanceAddress;

provider = this.providers[table];
providerNode = this.getProviderNodeForTable(table);
instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
columnNode = providerNode.children[columnNumber];
instanceNode = columnNode.getInstanceNodeForTableRowIndex(instanceAddress);
instanceNode.value = value;
// return instanceNode.setValue (value);
};

Mib.prototype.deleteTableRow = function (table, rowIndex) {
var provider;
var providerNode;
var instanceAddress;
var columnNode;
var instanceNode;
var instanceParentNode;

provider = this.providers[table];
providerNode = this.getProviderNodeForTable(table);
instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
for (var columnNumber of Object.keys(providerNode.children)) {
  columnNode = providerNode.children[columnNumber];
  instanceNode =
    columnNode.getInstanceNodeForTableRowIndex(instanceAddress);
  if (instanceNode) {
    instanceParentNode = instanceNode.parent;
    instanceNode.delete();
    instanceParentNode.pruneUpwards();
  } else {
    throw new ReferenceError(
      "Cannot find row for index " +
        rowIndex +
        " at registered provider " +
        table
    );
  }
}
if (Object.keys(this.providerNodes[table].children).length === 0) {
  delete this.providerNodes[table];
}
return true;
};

Mib.prototype.dump = function (options) {
if (!options) {
  options = {};
}
var completedOptions = {
  leavesOnly: options.leavesOnly === undefined ? true : options.leavesOnly,
  showProviders:
    options.showProviders === undefined ? true : options.showProviders,
  showValues: options.showValues === undefined ? true : options.showValues,
  showTypes: options.showTypes === undefined ? true : options.showTypes,
};
this.root.dump(completedOptions);
};

Mib.convertOidToAddress = function (oid) {
var address;
var oidArray;
var i;

if (typeof oid === "object" && util.isArray(oid)) {
  address = oid;
} else if (typeof oid === "string") {
  address = oid.split(".");
} else {
  throw new TypeError("oid (string or array) is required");
}

if (address.length < 1)
  throw new RangeError("object identifier is too short");

oidArray = [];
for (i = 0; i < address.length; i++) {
  var n;

  if (address[i] === "") continue;

  if (address[i] === true || address[i] === false) {
    throw new TypeError(
      "object identifier component " + address[i] + " is malformed"
    );
  }

  n = Number(address[i]);

  if (isNaN(n)) {
    throw new TypeError(
      "object identifier component " + address[i] + " is malformed"
    );
  }
  if (n % 1 !== 0) {
    throw new TypeError(
      "object identifier component " + address[i] + " is not an integer"
    );
  }
  if (i === 0 && n > 2) {
    throw new RangeError(
      "object identifier does not " + "begin with 0, 1, or 2"
    );
  }
  if (i === 1 && n > 39) {
    throw new RangeError(
      "object identifier second " +
        "component " +
        n +
        " exceeds encoding limit of 39"
    );
  }
  if (n < 0) {
    throw new RangeError(
      "object identifier component " + address[i] + " is negative"
    );
  }
  if (n > MAX_SIGNED_INT32) {
    throw new RangeError(
      "object identifier component " + address[i] + " is too large"
    );
  }
  oidArray.push(n);
}

return oidArray;
};

Mib.getSubOidFromBaseOid = function (oid, base) {
return oid.substring(base.length + 1);
};

Mib.create = function () {
return new Mib();
};
```
*/

import { MAX_SIGNED_INT32, MaxAccess, MibProviderType, ObjectType } from '../constants';
import {
  DumpOptions,
  MibNode,
  MibRange,
  MibScalarProvider,
  MibSize,
  MibTableProvider,
  MibTableProviderColumn,
  MibTableProviderIndexEntry,
} from '../mibNode';

export class Mib {
  private root: MibNode;
  private providerNodes: { [key: string]: MibNode };
  public providersByOid: { [key: string]: MibScalarProvider | MibTableProvider };
  private providers: { [key: string]: MibScalarProvider | MibTableProvider };

  constructor() {
    this.root = new MibNode([], null);
    this.providerNodes = {};
    this.providersByOid = {};
    this.providers = new Proxy(
      {},
      {
        set: (target, key, value) => {
          target[key] = value;
          this.providersByOid[value.oid] = value;
          // TODO: Added to avoid error
          return true;
        },

        deleteProperty: (target, key) => {
          delete this.providersByOid[target[key].oid];
          delete target[key];
          // TODO: Added to avoid error
          return true;
        },
      }
    );
  }

  public addNodesForOid(oidString: string): MibNode {
    const address = Mib.convertOidToAddress(oidString);
    return this.addNodesForAddress(address);
  }

  public addNodesForAddress(address: number[]): MibNode {
    let node = this.root;
    for (let i = 0; i < address.length; i++) {
      if (!node.children.hasOwnProperty(address[i])) {
        node.children[address[i]] = new MibNode(address.slice(0, i + 1), node);
      }
      node = node.children[address[i]];
    }

    return node;
  }

  public lookup(oid: string): MibNode | null {
    const address = Mib.convertOidToAddress(oid);
    return this.lookupAddress(address);
  }

  public lookupAddress(address: number[]): MibNode | null {
    let node = this.root;
    for (let i = 0; i < address.length; i++) {
      if (!node.children.hasOwnProperty(address[i])) {
        return null;
      }
      node = node.children[address[i]];
    }
    return node;
  }

  public getTreeNode(oid: string): MibNode {
    const address = Mib.convertOidToAddress(oid);
    let node = this.lookupAddress(address);
    // OID already on tree
    if (node) {
      return node;
    }

    while (address.length > 0) {
      const last = address.pop();
      const parent = this.lookupAddress(address);
      if (parent) {
        node = parent.findChildImmediatelyBefore(last);
        if (!node) {
          return parent;
        }
        while (true) {
          // Find the last descendant
          const childrenAddresses = Object.keys(node.children).sort((a, b) => +a - +b);
          if (childrenAddresses.length == 0) {
            return node;
          }
          node = node.children[childrenAddresses[childrenAddresses.length - 1]];
        }
      }
    }
    return this.root;
  }

  public getProviderNodeForInstance(instanceNode: MibNode): MibNode | null {
    if (instanceNode.provider) {
      // throw new ReferenceError ("Instance node has provider which should never happen");
      return null;
    }
    return instanceNode.getAncestorProvider();
  }

  public addProviderToNode(provider: MibScalarProvider | MibTableProvider): MibNode {
    const node = this.addNodesForOid(provider.oid);
    node.provider = provider;
    if (provider.type == MibProviderType.Table) {
      if (!provider.tableIndex) {
        // TODO: Check, table index can receive number? En doc example also columnNumber field
        provider.tableIndex = [1];
      }
    }
    this.providerNodes[provider.name] = node;
    return node;
  }

  public getColumnFromProvider(
    provider: MibTableProvider,
    indexEntry: MibTableProviderIndexEntry
  ): MibTableProviderColumn | null {
    let column: MibTableProviderColumn | null = null;
    if (indexEntry.columnName) {
      column = provider.tableColumns.filter(column => column.name == indexEntry.columnName)[0];
    } else if (indexEntry.columnNumber !== undefined && indexEntry.columnNumber !== null) {
      column = provider.tableColumns.filter(column => column.number == indexEntry.columnNumber)[0];
    }
    return column;
  }

  public populateIndexEntryFromColumn(
    localProvider: MibTableProvider,
    indexEntry: MibTableProviderIndexEntry,
    indexEntryNumber: number
  ): void {
    let column: MibTableProviderColumn | null = null;
    let tableProviders: MibTableProvider[];
    if (!indexEntry.columnName && !indexEntry.columnNumber) {
      throw new Error(
        `Index entry ${indexEntryNumber}: does not have either a columnName or columnNumber`
      );
    }

    if (indexEntry.foreign) {
      // Explicit foreign table is first to search
      const foreignTableProvider = this.providers[indexEntry.foreign];
      // TODO: Check added. Needed?
      if (foreignTableProvider.type != MibProviderType.Table) {
        throw new Error(
          `Index entry ${indexEntryNumber}: foreign provider ${indexEntry.foreign} is not a table provider`
        );
      } else {
        column = this.getColumnFromProvider(
          this.providers[indexEntry.foreign] as MibTableProvider,
          indexEntry
        );
      }
    } else {
      // If foreign table isn't given, search the local table next
      column = this.getColumnFromProvider(localProvider, indexEntry);
      if (!column) {
        // as a last resort, try to find the column in a foreign table
        tableProviders = Object.values(this.providers).filter(
          prov => prov.type == MibProviderType.Table
        ) as MibTableProvider[];
        for (const provider of tableProviders) {
          column = this.getColumnFromProvider(provider, indexEntry);
          if (column) {
            indexEntry.foreign = provider.name;
            break;
          }
        }
      }
    }
    if (!column) {
      throw new Error(`Could not find column for index entry with column ${indexEntry.columnName}`);
    }
    if (indexEntry.columnName && indexEntry.columnName != column.name) {
      throw new Error(
        `Index entry ${indexEntryNumber}: Calculated column name ${column.name} does not match supplied column name ${indexEntry.columnName}`
      );
    }
    if (indexEntry.columnNumber && indexEntry.columnNumber != column.number) {
      throw new Error(
        `Index entry ${indexEntryNumber}: Calculated column number ${column.number} does not match supplied column number ${indexEntry.columnNumber}`
      );
    }
    if (!indexEntry.columnName) {
      indexEntry.columnName = column.name;
    }
    if (!indexEntry.columnNumber) {
      indexEntry.columnNumber = column.number;
    }
    indexEntry.type = column.type;
  }

  public registerProvider(provider: MibScalarProvider | MibTableProvider): void {
    this.providers[provider.name] = provider;
    if (provider.type == MibProviderType.Table) {
      if (provider.tableAugments) {
        if (provider.tableAugments == provider.name) {
          throw new Error(`Table ${provider.name} cannot augment itself`);
        }
        const augmentProvider = this.providers[provider.tableAugments] as MibTableProvider;
        if (!augmentProvider) {
          throw new Error(`Cannot find base table ${provider.tableAugments} to augment`);
        }
        provider.tableIndex = JSON.parse(JSON.stringify(augmentProvider.tableIndex));
        // TODO: Check added. Needed?
        if (provider.tableIndex) {
          provider.tableIndex.map(index => (index.foreign = augmentProvider.name));
        }
      } else {
        if (!provider.tableIndex) {
          provider.tableIndex = [1]; // default to first column index
        }
        for (let i = 0; i < provider.tableIndex.length; i++) {
          let indexEntry = provider.tableIndex[i];
          if (typeof indexEntry == 'number') {
            provider.tableIndex[i] = {
              columnNumber: indexEntry,
            };
            // TODO: Check, tableIndex can also be string[]?
          } else if (typeof indexEntry == 'string') {
            provider.tableIndex[i] = {
              columnName: indexEntry,
            };
          }
          indexEntry = provider.tableIndex[i] as MibTableProviderIndexEntry;
          this.populateIndexEntryFromColumn(provider, indexEntry, i);
        }
      }
    }
  }

  public setScalarDefaultValue(name: string, value: any): void {
    const provider = this.getProvider(name) as MibScalarProvider;
    provider.defVal = value;
  }

  public setTableRowDefaultValues(name: string, values: any[]): void {
    const provider = this.getProvider(name) as MibTableProvider;
    const tableColumns = provider.tableColumns;

    // We must be given an array of exactly the right number of columns
    if (values.length != tableColumns.length) {
      throw new Error(
        `Incorrect values length: got ${values.length}; expected ${tableColumns.length}`
      );
    }

    // Add defVal to each table column.
    tableColumns.forEach((entry, i) => {
      if (typeof values[i] != 'undefined') {
        entry.defVal = values[i];
      }
    });
  }

  public setScalarRanges(name: string, ranges: MibRange[]): void {
    const provider = this.getProvider(name) as MibScalarProvider;
    provider.constraints = { ranges };
  }

  public setTableColumnRanges(name: string, column: number, ranges: MibRange[]): void {
    const provider = this.getProvider(name) as MibTableProvider;
    const tableColumns = provider.tableColumns;
    tableColumns[column].constraints = { ranges };
  }

  public setScalarSizes(name: string, sizes: MibSize[]): void {
    const provider = this.getProvider(name) as MibScalarProvider;
    provider.constraints = { sizes };
  }

  public setTableColumnSizes(name: string, column: number, sizes: MibSize[]): void {
    const provider = this.getProvider(name) as MibTableProvider;
    const tableColumns = provider.tableColumns;
    tableColumns[column].constraints = { sizes };
  }

  public registerProviders(providers: (MibScalarProvider | MibTableProvider)[]): void {
    for (const provider of providers) {
      this.registerProvider(provider);
    }
  }

  public unregisterProvider(name: string): void {
    const providerNode = this.providerNodes[name];
    if (providerNode) {
      const providerNodeParent = providerNode.parent;
      providerNode.delete();
      if (providerNodeParent) {
        providerNodeParent.pruneUpwards();
      }
      delete this.providerNodes[name];
    }
    delete this.providers[name];
  }

  public getProvider(name: string): MibScalarProvider | MibTableProvider {
    return this.providers[name];
  }

  public getProviders(): { [key: string]: MibScalarProvider | MibTableProvider } {
    return this.providers;
  }

  public dumpProviders(): void {
    let extraInfo: number | string;
    for (const provider of Object.values(this.providers)) {
      extraInfo =
        provider.type == MibProviderType.Scalar
          ? provider.scalarType
          : 'Columns = ' + provider.tableColumns.length;
      console.log(
        `${MibProviderType[provider.type]}: ${provider.name} (${provider.oid}): ${extraInfo}`
      );
    }
  }

  public getScalarValue(scalarName: string): any {
    const providerNode = this.providerNodes[scalarName];
    if (
      !providerNode ||
      !providerNode.provider ||
      providerNode.provider.type != MibProviderType.Scalar
    ) {
      throw new ReferenceError(`Failed to get node for registered MIB provider ${scalarName}`);
    }
    const instanceAddress = providerNode.address.concat([0]);
    // TODO: Change bc of error on original
    // if (!this.lookup(instanceAddress)) {
    const instanceNode = this.lookupAddress(instanceAddress);
    if (!instanceNode) {
      throw new Error(`Failed created instance node for registered MIB provider ${scalarName}`);
    }
    return instanceNode.value;
  }

  public setScalarValue(scalarName: string, newValue: any): void {
    if (!this.providers[scalarName]) {
      throw new ReferenceError(`Provider ${scalarName} not registered with this MIB`);
    }

    let providerNode = this.providerNodes[scalarName];
    if (!providerNode) {
      providerNode = this.addProviderToNode(this.providers[scalarName]);
    }

    const provider = providerNode.provider;
    if (!providerNode || !provider || provider.type != MibProviderType.Scalar) {
      throw new ReferenceError(`Could not find MIB node for registered provider ${scalarName}`);
    }

    const instanceAddress = providerNode.address.concat([0]);
    let instanceNode = this.lookupAddress(instanceAddress);
    if (!instanceNode) {
      // TODO: addNodesForAddress already returns MibNode, check if second lookupAddress is needed.
      this.addNodesForAddress(instanceAddress);
      instanceNode = this.lookupAddress(instanceAddress);
      // TODO: Check, second checking for same thing added
      if (instanceNode) {
        instanceNode.valueType = provider.scalarType;
      }
    }

    // TODO: Check, third checking for same thing added
    if (instanceNode) {
      instanceNode.value = newValue;
    }
  }

  public getProviderNodeForTable(table: string): MibNode {
    const providerNode = this.providerNodes[table];
    if (!providerNode) {
      throw new ReferenceError(`No MIB provider registered for ${table}`);
    }
    const provider = providerNode.provider;
    // TODO: Check, why to check same thing again? Should it check provider?
    if (!providerNode) {
      throw new ReferenceError(`No MIB provider definition for registered provider ${table}`);
    }
    // TODO: Added check for provided
    if (provider && provider.type != MibProviderType.Table) {
      throw new TypeError(
        `Registered MIB provider ${table} is not of the correct type (is type ${
          MibProviderType[provider.type]
        })`
      );
    }
    return providerNode;
  }

  // TODO: Check later to define value types
  public getOidAddressFromValue(value: any, indexPart: MibTableProviderIndexEntry): number[] {
    let oidComponents: string[];
    switch (indexPart.type) {
      case ObjectType.OID:
        oidComponents = value.split('.');
        break;
      case ObjectType.OctetString:
        if (value instanceof Buffer) {
          // Buffer
          oidComponents = Array.prototype.slice.call(value);
        } else {
          // string
          oidComponents = [...value].map(c => c.charCodeAt(0).toString());
        }
        break;
      case ObjectType.IpAddress:
        return value.split('.').map(c => c.toString());
      default:
        return [value];
    }

    // TODO: Check, Index has also implied and length?
    if (!indexPart.implied && !indexPart.length) {
      oidComponents.unshift(oidComponents.length.toString());
    }
    return oidComponents.map(c => parseInt(c));
  }

  public getTableRowInstanceFromRow(provider: MibTableProvider, row: any[]): number[] {
    const rowIndex: number[] = [];
    // TODO: Added check for tableIndex and forced type to be MibTableProviderIndex[]
    if (!provider.tableIndex) {
      throw new Error(`Table provider ${provider.name} does not have index definition`);
    }

    const foreignColumnParts = (provider.tableIndex as MibTableProviderIndexEntry[]).filter(
      indexPart => indexPart.foreign
    );
    for (let i = 0; i < foreignColumnParts.length; i++) {
      const oidArrayForValue = this.getOidAddressFromValue(row[i], foreignColumnParts[i]);
      rowIndex.push(...oidArrayForValue);
    }

    const localColumnParts = (provider.tableIndex as MibTableProviderIndexEntry[]).filter(
      indexPart => !indexPart.foreign
    );
    for (const localColumnPart of localColumnParts) {
      const localColumnPosition = provider.tableColumns.findIndex(
        column => column.number == localColumnPart.columnNumber
      );
      const oidArrayForValue = this.getOidAddressFromValue(
        row[foreignColumnParts.length + localColumnPosition],
        localColumnPart
      );
      rowIndex.push(...oidArrayForValue);
    }
    return rowIndex;
  }

  public static getRowIndexFromOid(oid: string, index: MibTableProviderIndexEntry[]): any[] {
    const addressRemaining = oid.split('.');
    let length = 0;
    const values: (string | number)[] = [];
    for (const indexPart of index) {
      switch (indexPart.type) {
        case ObjectType.OID:
          if (indexPart.implied) {
            length = addressRemaining.length;
          } else {
            // TODO: Added check, shift can return undefined. Length stays 0
            const valueLength = addressRemaining.shift();
            if (valueLength !== undefined) {
              length = parseInt(valueLength);
            }
          }
          const oidValue = addressRemaining.splice(0, length).join('.');
          values.push(oidValue);
          break;
        case ObjectType.IpAddress:
          length = 4;
          const ipValue = addressRemaining.splice(0, length).join('.');
          values.push(ipValue);
          break;
        case ObjectType.OctetString:
          if (indexPart.implied) {
            length = addressRemaining.length;
          } else {
            // TODO: Added check, shift can return undefined. Length stays 0
            const valueLength = addressRemaining.shift();
            if (valueLength !== undefined) {
              length = parseInt(valueLength);
            }
          }
          const octetStrValue = addressRemaining
            .splice(0, length)
            .map(c => String.fromCharCode(parseInt(c))) // TODO: Added parse int
            .join('');
          values.push(octetStrValue);
          break;
        default:
          // TODO: Added check for value
          const intValue = addressRemaining.shift();
          if (intValue) {
            values.push(parseInt(intValue));
          }
      }
    }
    return values;
  }

  public getTableRowInstanceFromRowIndex(provider: MibTableProvider, rowIndex: any[]): number[] {
    let rowIndexOid: number[] = [];
    let indexPart: MibTableProviderIndexEntry;
    let keyPart: any;
    if (!provider.tableIndex) {
      throw new Error(`Table provider ${provider.name} does not have index definition`);
    }

    for (let i = 0; i < provider.tableIndex.length; i++) {
      indexPart = provider.tableIndex[i] as MibTableProviderIndexEntry; // TODO: Check, Added cast
      keyPart = rowIndex[i];
      rowIndexOid = rowIndexOid.concat(this.getOidAddressFromValue(keyPart, indexPart));
    }
    return rowIndexOid;
  }

  public addTableRow(table: string, row: any[]): void {
    let instanceAddress: number[];
    let instanceNode: MibNode | null;

    if (this.providers[table] && !this.providerNodes[table]) {
      this.addProviderToNode(this.providers[table]);
    }

    const providerNode = this.getProviderNodeForTable(table);
    const provider = providerNode.provider as MibTableProvider;
    const rowValueOffset = (provider.tableIndex as MibTableProviderIndexEntry[]).filter(
      indexPart => indexPart.foreign
    ).length;
    const instance = this.getTableRowInstanceFromRow(provider, row);
    for (let i = 0; i < provider.tableColumns.length; i++) {
      const column = provider.tableColumns[i];
      const isColumnIndex = (provider.tableIndex as MibTableProviderIndexEntry[]).some(
        indexPart => indexPart.columnNumber == column.number
      );
      // prevent not-accessible and accessible-for-notify index entries from being
      // added as columns in the row
      if (
        !isColumnIndex ||
        !(
          column.maxAccess === MaxAccess['not-accessible'] ||
          column.maxAccess === MaxAccess['accessible-for-notify']
        )
      ) {
        instanceAddress = providerNode.address.concat([column.number]).concat(instance);
        this.addNodesForAddress(instanceAddress);
        instanceNode = this.lookupAddress(instanceAddress);
        // TODO: Check added
        if (instanceNode) {
          instanceNode.valueType = column.type;
          instanceNode.value = row[rowValueOffset + i];
        }
      }
    }
  }

  public getTableColumnDefinitions(table: string): MibTableProviderColumn[] {
    const providerNode = this.getProviderNodeForTable(table);
    const provider = providerNode.provider as MibTableProvider;
    return provider.tableColumns;
  }

  public getTableColumnCells(
    table: string,
    columnNumber: number,
    includeInstances: boolean
  ): any[] | null {
    const provider = this.providers[table] as MibTableProvider;
    const providerIndex = provider.tableIndex as MibTableProviderIndexEntry[];
    const providerNode = this.getProviderNodeForTable(table);
    const columnNode = providerNode.children[columnNumber];
    if (!columnNode) {
      return null;
    }

    const instanceNodes = columnNode.getInstanceNodesForColumn();
    let instanceOid: string;
    const indexValues: any[] = [];
    const columnValues: any[] = [];
    for (const instanceNode of instanceNodes) {
      instanceOid = Mib.getSubOidFromBaseOid(instanceNode.oid, columnNode.oid);
      indexValues.push(Mib.getRowIndexFromOid(instanceOid, providerIndex));
      columnValues.push(instanceNode.value);
    }

    if (includeInstances) {
      return [indexValues, columnValues];
    } else {
      return columnValues;
    }
  }

  public getTableRowCells(table: string, rowIndex: any[]): any[] | null {
    const provider = this.providers[table] as MibTableProvider;
    const providerNode = this.getProviderNodeForTable(table);
    const instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
    const row: any[] = [];
    let rowFound = false;
    let columnNode: MibNode;
    let instanceNode: MibNode | null | undefined;

    for (const columnNumber of Object.keys(providerNode.children)) {
      columnNode = providerNode.children[columnNumber];
      if (columnNode) {
        instanceNode = columnNode.getInstanceNodeForTableRowIndex(instanceAddress);
        if (instanceNode) {
          row.push(instanceNode.value);
          rowFound = true;
        } else {
          row.push(null);
        }
      } else {
        row.push(null);
      }
    }

    if (rowFound) {
      return row;
    } else {
      return null;
    }
  }

  public getTableCells(table: string, byRows: boolean, includeInstances: boolean): any[] {
    const providerNode = this.getProviderNodeForTable(table);
    const data: any[] = [];
    let column: any[] | null;

    for (const columnNumber of Object.keys(providerNode.children)) {
      column = this.getTableColumnCells(table, parseInt(columnNumber), includeInstances);
      // TODO: Check added
      if (column !== null) {
        if (includeInstances) {
          data.push(...column);
          includeInstances = false;
        } else {
          data.push(column);
        }
      }
    }

    if (byRows) {
      // TODO: Test
      return Object.keys(data[0]).map(key => data.map(row => row[key]));
    } else {
      return data;
    }
  }

  public getTableSingleCell(table: string, columnNumber: number, rowIndex: any[]): any {
    const provider = this.providers[table] as MibTableProvider;
    const providerNode = this.getProviderNodeForTable(table);
    const columnNode = providerNode.children[columnNumber];
    const instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
    const instanceNode = columnNode.getInstanceNodeForTableRowIndex(instanceAddress);

    // TODO: CHeck added. Could return null instead?
    if (!instanceNode) {
      throw new Error(
        `Table ${table} does not have cell with row index ${rowIndex} and column number ${columnNumber}`
      );
    }
    return instanceNode.value;
  }

  public setTableSingleCell(
    table: string,
    columnNumber: number,
    rowIndex: any[],
    value: any
  ): void {
    const provider = this.providers[table] as MibTableProvider;
    const providerNode = this.getProviderNodeForTable(table);
    const instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
    const columnNode = providerNode.children[columnNumber];
    const instanceNode = columnNode.getInstanceNodeForTableRowIndex(instanceAddress);

    // TODO: CHeck added. Could return null instead?
    if (!instanceNode) {
      throw new Error(
        `Table ${table} does not have cell with row index ${rowIndex} and column number ${columnNumber}`
      );
    }
    instanceNode.value = value;
  }

  public deleteTableRow(table: string, rowIndex: any[]): boolean {
    const provider = this.providers[table] as MibTableProvider;
    const providerNode = this.getProviderNodeForTable(table);
    const instanceAddress = this.getTableRowInstanceFromRowIndex(provider, rowIndex);
    let columnNode: MibNode;
    let instanceNode: MibNode | null | undefined;
    let instanceParentNode: MibNode | null;
    for (const columnNumber of Object.keys(providerNode.children)) {
      columnNode = providerNode.children[columnNumber];
      instanceNode = columnNode.getInstanceNodeForTableRowIndex(instanceAddress);
      if (instanceNode) {
        instanceParentNode = instanceNode.parent;
        instanceNode.delete();
        instanceParentNode?.pruneUpwards();
      } else {
        throw new Error(`Cannot find row for index ${rowIndex} at registered provider ${table}`);
      }
    }

    if (Object.keys(this.providerNodes[table].children).length === 0) {
      delete this.providerNodes[table];
    }
    // TODO: Always returns true. Needed?
    return true;
  }

  public dump(options?: DumpOptions): void {
    if (!options) {
      options = {};
    }

    const completedOptions: DumpOptions = {
      leavesOnly: options.leavesOnly === undefined ? true : options.leavesOnly,
      showProviders: options.showProviders === undefined ? true : options.showProviders,
      showValues: options.showValues === undefined ? true : options.showValues,
      showTypes: options.showTypes === undefined ? true : options.showTypes,
    };

    this.root.dump(completedOptions);
  }

  public static convertOidToAddress(oid: string | string[]): number[] {
    let address: string[];
    const oidArray: number[] = [];

    if (typeof oid === 'object' && Array.isArray(oid)) {
      address = oid;
    } else if (typeof oid === 'string') {
      address = oid.split('.');
    } else {
      throw new TypeError(`oid (string or array) is required`);
    }

    if (address.length < 1) {
      throw new RangeError(`object identifier is too short`);
    }

    for (let i = 0; i < address.length; i++) {
      const addressPart = address[i];

      if (addressPart === '') {
        throw new RangeError(`object identifier contains empty string`);
      }

      // TODO: Check, error due to address is string[], no boolean[]
      // if (addressPart === true || addressPart === false) {
      //   throw new TypeError(`object identifier component ${addressPart} is malformed`);
      // }

      const addressPartNumber = Number(addressPart);
      if (isNaN(addressPartNumber)) {
        throw new TypeError(`object identifier component ${addressPart} is malformed`);
      }
      if (addressPartNumber % 1 !== 0) {
        throw new RangeError(`object identifier component ${addressPart} is not an integer`);
      }
      if (i === 0 && addressPartNumber > 2) {
        throw new RangeError(`object identifier does not begin with 0, 1, or 2`);
      }
      if (i === 1 && addressPartNumber > 39) {
        throw new RangeError(
          `object identifier second component ${addressPartNumber} exceeds encoding limit of 39`
        );
      }
      if (addressPartNumber < 0) {
        throw new RangeError(`object identifier component ${addressPart} is negative`);
      }
      if (addressPartNumber > MAX_SIGNED_INT32) {
        throw new RangeError(`object identifier component ${addressPart} is too large`);
      }
      oidArray.push(addressPartNumber);
    }

    return oidArray;
  }

  public static getSubOidFromBaseOid(oid: string, base: string): string {
    return oid.substring(base.length + 1);
  }

  public static create(): Mib {
    return new Mib();
  }
}
