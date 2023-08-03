/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var ModuleStore = function () {
  this.parser = mibparser();
};

ModuleStore.prototype.getSyntaxTypes = function () {
  var syntaxTypes = {};
  Object.assign(syntaxTypes, ObjectType);
  var entryArray;

  for (var mibModule of Object.values(this.parser.Modules)) {
    entryArray = Object.values(mibModule);
    for (var mibEntry of entryArray) {
      if (mibEntry.MACRO == "TEXTUAL-CONVENTION") {
        if (mibEntry.SYNTAX && !syntaxTypes[mibEntry.ObjectName]) {
          if (typeof mibEntry.SYNTAX == "object") {
            syntaxTypes[mibEntry.ObjectName] = mibEntry.SYNTAX;
          } else {
            syntaxTypes[mibEntry.ObjectName] = syntaxTypes[mibEntry.SYNTAX];
          }
        }
      }
    }
  }
  return syntaxTypes;
};

ModuleStore.prototype.loadFromFile = function (fileName) {
  this.parser.Import(fileName);
  this.parser.Serialize();
};

ModuleStore.prototype.getModule = function (moduleName) {
  return this.parser.Modules[moduleName];
};

ModuleStore.prototype.getModules = function (includeBase) {
  var modules = {};
  for (var moduleName of Object.keys(this.parser.Modules)) {
    if (includeBase || ModuleStore.BASE_MODULES.indexOf(moduleName) == -1) {
      modules[moduleName] = this.parser.Modules[moduleName];
    }
  }
  return modules;
};

ModuleStore.prototype.getModuleNames = function (includeBase) {
  var modules = [];
  for (var moduleName of Object.keys(this.parser.Modules)) {
    if (includeBase || ModuleStore.BASE_MODULES.indexOf(moduleName) == -1) {
      modules.push(moduleName);
    }
  }
  return modules;
};

ModuleStore.prototype.getProvidersForModule = function (moduleName) {
  var mibModule = this.parser.Modules[moduleName];
  var scalars = [];
  var tables = [];
  var mibEntry;
  var syntaxTypes;
  var entryArray;
  var currentTableProvider;
  var parentOid;
  var constraintsResults;
  var constraints;

  if (!mibModule) {
    throw new ReferenceError("MIB module " + moduleName + " not loaded");
  }
  syntaxTypes = this.getSyntaxTypes();
  entryArray = Object.values(mibModule);
  for (var i = 0; i < entryArray.length; i++) {
    mibEntry = entryArray[i];
    var syntax = mibEntry.SYNTAX;
    var access = mibEntry["ACCESS"];
    var maxAccess =
      typeof mibEntry["MAX-ACCESS"] != "undefined"
        ? mibEntry["MAX-ACCESS"]
        : access
        ? AccessToMaxAccess[access]
        : "not-accessible";
    var defVal = mibEntry["DEFVAL"];

    if (syntax) {
      constraintsResults = ModuleStore.getConstraintsFromSyntax(
        syntax,
        syntaxTypes
      );
      syntax = constraintsResults.syntax;
      constraints = constraintsResults.constraints;

      if (syntax.startsWith("SEQUENCE OF")) {
        // start of table
        currentTableProvider = {
          tableName: mibEntry.ObjectName,
          type: MibProviderType.Table,
          //oid: mibEntry.OID,
          tableColumns: [],
          tableIndex: [1], // default - assume first column is index
        };
        currentTableProvider.maxAccess = MaxAccess[maxAccess];

        // read table to completion
        while (currentTableProvider || i >= entryArray.length) {
          i++;
          mibEntry = entryArray[i];
          if (!mibEntry) {
            tables.push(currentTableProvider);
            currentTableProvider = null;
            i--;
            break;
          }
          syntax = mibEntry.SYNTAX;
          access = mibEntry["ACCESS"];
          maxAccess =
            typeof mibEntry["MAX-ACCESS"] != "undefined"
              ? mibEntry["MAX-ACCESS"]
              : access
              ? AccessToMaxAccess[access]
              : "not-accessible";
          defVal = mibEntry["DEFVAL"];

          constraintsResults = ModuleStore.getConstraintsFromSyntax(
            syntax,
            syntaxTypes
          );
          syntax = constraintsResults.syntax;
          constraints = constraintsResults.constraints;

          if (mibEntry.MACRO == "SEQUENCE") {
            // table entry sequence - ignore
          } else if (!mibEntry["OBJECT IDENTIFIER"]) {
            // unexpected
          } else {
            parentOid = mibEntry["OBJECT IDENTIFIER"].split(" ")[0];
            if (parentOid == currentTableProvider.tableName) {
              // table entry
              currentTableProvider.name = mibEntry.ObjectName;
              currentTableProvider.oid = mibEntry.OID;
              if (mibEntry.INDEX) {
                currentTableProvider.tableIndex = [];
                for (var indexEntry of mibEntry.INDEX) {
                  indexEntry = indexEntry.trim();
                  if (indexEntry.includes(" ")) {
                    if (indexEntry.split(" ")[0] == "IMPLIED") {
                      currentTableProvider.tableIndex.push({
                        columnName: indexEntry.split(" ")[1],
                        implied: true,
                      });
                    } else {
                      // unknown condition - guess that last token is name
                      currentTableProvider.tableIndex.push({
                        columnName: indexEntry.split(" ").slice(-1)[0],
                      });
                    }
                  } else {
                    currentTableProvider.tableIndex.push({
                      columnName: indexEntry,
                    });
                  }
                }
              }
              if (mibEntry.AUGMENTS) {
                currentTableProvider.tableAugments =
                  mibEntry.AUGMENTS[0].trim();
                currentTableProvider.tableIndex = null;
              }
            } else if (parentOid == currentTableProvider.name) {
              // table column
              var columnDefinition = {
                number: parseInt(mibEntry["OBJECT IDENTIFIER"].split(" ")[1]),
                name: mibEntry.ObjectName,
                type: syntaxTypes[syntax],
                maxAccess: MaxAccess[maxAccess],
              };
              if (constraints) {
                columnDefinition.constraints = constraints;
              }
              if (defVal) {
                columnDefinition.defVal = defVal;
              }
              // If this column has syntax RowStatus and
              // the MIB module imports RowStatus from
              // SNMPv2-TC, mark this column as the
              // rowStatus column so we can act on it.
              // (See lib/mibs/SNMPv2-TC.mib#L186.)
              if (
                syntax == "RowStatus" &&
                "IMPORTS" in mibModule &&
                Array.isArray(mibModule.IMPORTS["SNMPv2-TC"]) &&
                mibModule.IMPORTS["SNMPv2-TC"].includes("RowStatus")
              ) {
                // Mark this column as being rowStatus
                columnDefinition.rowStatus = true;
              }
              currentTableProvider.tableColumns.push(columnDefinition);
            } else {
              // table finished
              tables.push(currentTableProvider);
              // console.log ("Table: " + currentTableProvider.name);
              currentTableProvider = null;
              i--;
            }
          }
        }
      } else if (mibEntry.MACRO == "OBJECT-TYPE") {
        // OBJECT-TYPE entries not in a table are scalars
        let scalarType = syntaxTypes[syntax];
        if (typeof scalarType === "object")
          scalarType = syntaxTypes[Object.keys(scalarType)[0]];
        var scalarDefinition = {
          name: mibEntry.ObjectName,
          type: MibProviderType.Scalar,
          oid: mibEntry.OID,
          scalarType: scalarType,
          maxAccess: MaxAccess[maxAccess],
        };

        if (defVal) {
          scalarDefinition.defVal = defVal;
        }

        if (constraints) {
          scalarDefinition.constraints = constraints;
        }
        scalars.push(scalarDefinition);
        // console.log ("Scalar: " + mibEntry.ObjectName);
      }
    }
  }
  return scalars.concat(tables);
};

ModuleStore.prototype.loadBaseModules = function () {
  for (var mibModule of ModuleStore.BASE_MODULES) {
    this.parser.Import(__dirname + "/lib/mibs/" + mibModule + ".mib");
  }
  this.parser.Serialize();
};

ModuleStore.getConstraintsFromSyntax = function (syntax, syntaxTypes) {
  let constraints;
  if (typeof syntaxTypes[syntax] === "object") {
    syntax = syntaxTypes[syntax];
  }
  // detect INTEGER ranges, OCTET STRING sizes, and INTEGER enumerations
  if (typeof syntax == "object") {
    let firstSyntaxKey = syntax[Object.keys(syntax)[0]];
    if (firstSyntaxKey.ranges) {
      constraints = {
        ranges: firstSyntaxKey.ranges,
      };
      syntax = Object.keys(syntax)[0];
    } else if (firstSyntaxKey.sizes) {
      constraints = {
        sizes: firstSyntaxKey.sizes,
      };
      syntax = Object.keys(syntax)[0];
    } else {
      constraints = {
        enumeration: syntax.INTEGER,
      };
      syntax = "INTEGER";
    }
  } else {
    constraints = null;
  }
  return {
    constraints: constraints,
    syntax: syntax,
  };
};

ModuleStore.create = function () {
  var store = new ModuleStore();
  store.loadBaseModules();
  return store;
};

ModuleStore.BASE_MODULES = [
  "RFC1155-SMI",
  "RFC1158-MIB",
  "RFC-1212",
  "RFC1213-MIB",
  "SNMPv2-SMI",
  "SNMPv2-CONF",
  "SNMPv2-TC",
  "SNMPv2-MIB",
];
```
*/

import { AccessToMaxAccess, MaxAccess, MibProviderType, ObjectType } from '../constants';
import { MibModuleRepresentation, MibModules, MibParser } from '../lib';

export class ModuleStore {
  private _mibParser: MibParser;
  public static BASE_MODULES: string[] = [
    'RFC1155-SMI',
    'RFC1158-MIB',
    'RFC-1212',
    'RFC1213-MIB',
    'SNMPv2-SMI',
    'SNMPv2-CONF',
    'SNMPv2-TC',
    'SNMPv2-MIB',
  ];

  constructor() {
    this._mibParser = new MibParser();
  }

  public getSyntaxTypes(): any {
    // TODO: Check. Why?
    const syntaxTypes = {};
    Object.assign(syntaxTypes, ObjectType);
    let entryArray;

    // TODO: { moduleName: { entry1: {MACRO: 'macro', SYNTAX: 'syntax'|{}}, entry2: {}}, ... }
    for (const mibModule of Object.values(this._mibParser.modules)) {
      entryArray = Object.values(mibModule);
      for (const mibEntry of entryArray) {
        if (mibEntry.MACRO == 'TEXTUAL-CONVENTION') {
          if (mibEntry.SYNTAX && !syntaxTypes[mibEntry.ObjectName]) {
            if (typeof mibEntry.SYNTAX == 'object') {
              syntaxTypes[mibEntry.ObjectName] = mibEntry.SYNTAX;
            } else {
              syntaxTypes[mibEntry.ObjectName] = syntaxTypes[mibEntry.SYNTAX];
            }
          }
        }
      }
    }
    return syntaxTypes;
  }

  public loadFromFile(fileName: string): void {
    this._mibParser.import(fileName);
    this._mibParser.serialize();
  }

  public getModule(moduleName: string): MibModuleRepresentation {
    return this._mibParser.modules[moduleName];
  }

  public getModules(includeBase: boolean): MibModules {
    const modules: MibModules = {};
    for (const moduleName of Object.keys(this._mibParser.modules)) {
      if (includeBase || ModuleStore.BASE_MODULES.indexOf(moduleName) == -1) {
        modules[moduleName] = this._mibParser.modules[moduleName];
      }
    }
    return modules;
  }

  public getModuleNames(includeBase: boolean): string[] {
    const modules: string[] = [];
    for (const moduleName of Object.keys(this._mibParser.modules)) {
      if (includeBase || ModuleStore.BASE_MODULES.indexOf(moduleName) == -1) {
        modules.push(moduleName);
      }
    }
    return modules;
  }

  public getProvidersForModule(moduleName: string): any {
    const mibModule = this._mibParser.modules[moduleName];
    const scalars: any[] = [];
    const tables: any[] = [];
    let mibEntry;
    let currentTableProvider;
    let parentOid;
    let constraintsResults;
    let constraints;

    if (!mibModule) {
      throw new ReferenceError(`MIB module ${moduleName} not loaded`);
    }
    const syntaxTypes = this.getSyntaxTypes();
    const entryArray = Object.values(mibModule);
    for (let i = 0; i < entryArray.length; i++) {
      mibEntry = entryArray[i];
      let syntax = mibEntry.SYNTAX;
      let access = mibEntry['ACCESS'];
      let maxAccess =
        typeof mibEntry['MAX-ACCESS'] != 'undefined'
          ? mibEntry['MAX-ACCESS']
          : access
          ? AccessToMaxAccess[access]
          : 'not-accessible';
      let defVal = mibEntry['DEFVAL'];

      if (syntax) {
        constraintsResults = ModuleStore.getConstraintsFromSyntax(syntax, syntaxTypes);
        syntax = constraintsResults.syntax;
        constraints = constraintsResults.constraints;

        if (syntax.startsWith('SEQUENCE OF')) {
          // start of table
          currentTableProvider = {
            tableName: mibEntry.ObjectName,
            type: MibProviderType.Table,
            //oid: mibEntry.OID,
            tableColumns: [],
            tableIndex: [1], // default - assume first column is index
          };
          currentTableProvider.maxAccess = MaxAccess[maxAccess];

          // read table to completion
          while (currentTableProvider || i >= entryArray.length) {
            i++;
            mibEntry = entryArray[i];
            if (!mibEntry) {
              tables.push(currentTableProvider);
              currentTableProvider = null;
              i--;
              break;
            }
            syntax = mibEntry.SYNTAX;
            access = mibEntry['ACCESS'];
            maxAccess =
              typeof mibEntry['MAX-ACCESS'] != 'undefined'
                ? mibEntry['MAX-ACCESS']
                : access
                ? AccessToMaxAccess[access]
                : 'not-accessible';
            defVal = mibEntry['DEFVAL'];

            constraintsResults = ModuleStore.getConstraintsFromSyntax(syntax, syntaxTypes);
            syntax = constraintsResults.syntax;
            constraints = constraintsResults.constraints;

            if (mibEntry.MACRO == 'SEQUENCE') {
              // table entry sequence - ignore
            } else if (!mibEntry['OBJECT IDENTIFIER']) {
              // unexpected
            } else {
              parentOid = mibEntry['OBJECT IDENTIFIER'].split(' ')[0];
              if (parentOid == currentTableProvider.tableName) {
                // table entry
                currentTableProvider.name = mibEntry.ObjectName;
                currentTableProvider.oid = mibEntry.OID;
                if (mibEntry.INDEX) {
                  currentTableProvider.tableIndex = [];
                  for (const indexEntry of mibEntry.INDEX) {
                    if (indexEntry.includes(' ')) {
                      if (indexEntry.split(' ')[0] == 'IMPLIED') {
                        currentTableProvider.tableIndex.push({
                          columnName: indexEntry.split(' ')[1],
                          implied: true,
                        });
                      } else {
                        // unknown condition - guess that last token is name
                        currentTableProvider.tableIndex.push({
                          columnName: indexEntry.split(' ').slice(-1)[0],
                        });
                      }
                    } else {
                      currentTableProvider.tableIndex.push({
                        columnName: indexEntry,
                      });
                    }
                  }
                }
                if (mibEntry.AUGMENTS) {
                  currentTableProvider.tableAugments = mibEntry.AUGMENTS[0].trim();
                  currentTableProvider.tableIndex = null;
                }
              } else if (parentOid == currentTableProvider.name) {
                // table column
                const columnDefinition = {
                  number: parseInt(mibEntry['OBJECT IDENTIFIER'].split(' ')[1]),
                  name: mibEntry.ObjectName,
                  type: syntaxTypes[syntax],
                  maxAccess: MaxAccess[maxAccess],
                };
                if (constraints) {
                  columnDefinition['constraints'] = constraints;
                }
                if (defVal) {
                  columnDefinition['defVal'] = defVal;
                }
                // If this column has syntax RowStatus and
                // the MIB module imports RowStatus from
                // SNMPv2-TC, mark this column as the
                // rowStatus column so we can act on it.
                // (See lib/mibs/SNMPv2-TC.mib#L186.)
                if (
                  syntax == 'RowStatus' &&
                  'IMPORTS' in mibModule &&
                  Array.isArray(mibModule.IMPORTS['SNMPv2-TC']) &&
                  mibModule.IMPORTS['SNMPv2-TC'].includes('RowStatus')
                ) {
                  // Mark this column as being rowStatus
                  columnDefinition['rowStatus'] = true;
                }
                currentTableProvider.tableColumns.push(columnDefinition);
              } else {
                // table finished
                tables.push(currentTableProvider);
                // console.log ("Table: " + currentTableProvider.name);
                currentTableProvider = null;
                i--;
              }
            }
          }
        } else if (mibEntry.MACRO == 'OBJECT-TYPE') {
          // OBJECT-TYPE entries not in a table are scalars
          let scalarType = syntaxTypes[syntax];
          if (typeof scalarType === 'object') scalarType = syntaxTypes[Object.keys(scalarType)[0]];
          const scalarDefinition = {
            name: mibEntry.ObjectName,
            type: MibProviderType.Scalar,
            oid: mibEntry.OID,
            scalarType: scalarType,
            maxAccess: MaxAccess[maxAccess],
          };

          if (defVal) {
            scalarDefinition['defVal'] = defVal;
          }

          if (constraints) {
            scalarDefinition['constraints'] = constraints;
          }
          scalars.push(scalarDefinition);
          // console.log ("Scalar: " + mibEntry.ObjectName);
        }
      }
    }
    return scalars.concat(tables);
  }

  public loadBaseModules(): void {
    for (const mibModule of ModuleStore.BASE_MODULES) {
      // TODO: Check path, not in __dirname now
      this._mibParser.import(__dirname + '/lib/mibs/' + mibModule + '.mib');
    }
    this._mibParser.serialize();
  }

  public static getConstraintsFromSyntax(syntax: string, syntaxTypes: any): any {
    let constraints;
    if (typeof syntaxTypes[syntax] === 'object') {
      syntax = syntaxTypes[syntax];
    }
    // detect INTEGER ranges, OCTET STRING sizes, and INTEGER enumerations
    if (typeof syntax == 'object') {
      const firstSyntaxKey: any = syntax[Object.keys(syntax)[0]];
      if (firstSyntaxKey.ranges) {
        constraints = {
          ranges: firstSyntaxKey.ranges,
        };
        syntax = Object.keys(syntax)[0];
      } else if (firstSyntaxKey.sizes) {
        constraints = {
          sizes: firstSyntaxKey.sizes,
        };
        syntax = Object.keys(syntax)[0];
      } else {
        constraints = {
          enumeration: syntax['INTEGER'],
        };
        syntax = 'INTEGER';
      }
    } else {
      constraints = null;
    }
    return {
      constraints: constraints,
      syntax: syntax,
    };
  }

  public static create(): ModuleStore {
    const store = new ModuleStore();
    store.loadBaseModules();
    return store;
  }
}
