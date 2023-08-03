/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
  var CharBuffer = {
    Table: {},
    ModuleName: {},
    Append: function (char) {
      this.builder += char;
    },
    Fill: function (FileName, row, column) {
      if (this.builder.length == 0) {
        return;
      }
      column = column - this.builder.length;
      var symbol = this.builder.toString().trim();
      this.builder = "";
      this.builder.length = 0;
      if (!this.Table[FileName]) {
        this.Table[FileName] = [];
      } else if (this.PreviousRow < row) {
        this.RowIndex++;
        this.ColumnIndex = 0;
        this.PreviousRow = row;
      }
      var R = this.RowIndex;
      var C = this.ColumnIndex;

      if (!this.Table[FileName][R] || C === 0) {
        this.Table[FileName][R] = Object.defineProperty([], "line", {
          enumerable: false,
          value: row + 1,
        });
      }
      this.isEqual = false;
      switch (symbol) {
        case ")":
          this.Table[FileName][R][C] = symbol;
          this.ColumnIndex++;
          this.logit = false;
          break;
        case "(":
          this.Table[FileName][R][C] = symbol;
          this.ColumnIndex++;
          this.logit = true;
          break;
        case "DEFINITIONS":
          if (C == 0) {
            this.ModuleName[FileName] = this.Table[FileName][R - 1][C];
          } else {
            this.ModuleName[FileName] = this.Table[FileName][R][C - 1];
          }
          this.Table[FileName][R][C] = symbol;
          this.ColumnIndex++;
          break;
        case "::=":
          this.Table[FileName][R][C] = symbol;
          this.ColumnIndex++;
          this.isEqual = true;
          break;
        case "{":
          if (this.Table[FileName][R][C - 1] != "::=") {
            this.isList = true;
          }
          this.Table[FileName][R][C] = symbol;
          this.ColumnIndex++;
          break;
        case "NOTATION":
          if (
            this.Table[FileName][R][C - 1] == "TYPE" ||
            this.Table[FileName][R][C - 1] == "VALUE"
          ) {
            this.Table[FileName][R][C - 1] += " NOTATION";
          }
          break;

        case "OF":
          if (this.Table[FileName][R][C - 1] == "SEQUENCE") {
            this.Table[FileName][R][C - 1] = "SEQUENCE OF";
          }
          break;
        case "IDENTIFIER":
          if (this.Table[FileName][R][C - 1] == "OBJECT") {
            this.Table[FileName][R][C - 1] = "OBJECT IDENTIFIER";
          }
          break;
        case "STRING":
          if (this.Table[FileName][R][C - 1] == "OCTET") {
            this.Table[FileName][R][C - 1] = "OCTET STRING";
          }
          break;
        default:
          this.Table[FileName][R][C] = symbol;
          this.ColumnIndex++;
          break;
      }
    },
};
```
*/

export interface Table {
  [fileName: string]: any[];
}
export interface ModuleName {
  [fileName: string]: string;
}

export class CharBuffer {
  private _table: Table;
  private _moduleName: ModuleName;

  public logit: boolean;
  public lastChar: string;
  public state: string;
  public open: boolean;
  public currentSymbol: string;
  public nested: number;
  public isComment: boolean;
  public isEqual: boolean;
  public isOID: boolean;
  public isList: boolean;
  public isString: boolean;
  public inComment: boolean;
  public inGroup: number;
  public builder: string;
  public columnIndex: number;
  public rowIndex: number;
  public previousRow: number;

  constructor() {
    this._table = {};
    this._moduleName = {};
  }

  public get table(): Table {
    return this._table;
  }

  public get moduleName(): ModuleName {
    return this._moduleName;
  }

  public append(char: string) {
    this.builder += char;
  }

  public fill(fileName: string, row: number, column: number) {
    if (this.builder.length == 0) {
      return;
    }
    // column = column - this._builder.length;
    const symbol = this.builder.toString().trim();
    this.builder = '';
    // this._builder.length = 0;
    if (!this._table[fileName]) {
      this._table[fileName] = [];
    } else if (this.previousRow < row) {
      this.rowIndex++;
      this.columnIndex = 0;
      this.previousRow = row;
    }
    const R = this.rowIndex;
    const C = this.columnIndex;
    if (!this._table[fileName][R] || C === 0) {
      this._table[fileName][R] = Object.defineProperty([], 'line', {
        enumerable: false,
        value: row + 1,
      });
    }
    this.isEqual = false;
    switch (symbol) {
      case ')':
        this._table[fileName][R][C] = symbol;
        this.columnIndex++;
        this.logit = false;
        break;
      case '(':
        this._table[fileName][R][C] = symbol;
        this.columnIndex++;
        this.logit = true;
        break;
      case 'DEFINITIONS':
        if (C == 0) {
          this._moduleName[fileName] = this._table[fileName][R - 1][C];
        } else {
          this._moduleName[fileName] = this._table[fileName][R][C - 1];
        }
        this._table[fileName][R][C] = symbol;
        this.columnIndex++;
        break;
      case '::=':
        this._table[fileName][R][C] = symbol;
        this.columnIndex++;
        this.isEqual = true;
        break;
      case '{':
        if (this._table[fileName][R][C - 1] != '::=') {
          this.isList = true;
        }
        this._table[fileName][R][C] = symbol;
        this.columnIndex++;
        break;
      case 'NOTATION':
        if (
          this._table[fileName][R][C - 1] == 'TYPE' ||
          this._table[fileName][R][C - 1] == 'VALUE'
        ) {
          this._table[fileName][R][C - 1] += ' NOTATION';
        }
        break;
      case 'OF':
        if (this._table[fileName][R][C - 1] == 'SEQUENCE') {
          this._table[fileName][R][C - 1] = 'SEQUENCE OF';
        }
        break;
      case 'IDENTIFIER':
        if (this._table[fileName][R][C - 1] == 'OBJECT') {
          this._table[fileName][R][C - 1] = 'OBJECT IDENTIFIER';
        }
        break;
      case 'STRING':
        if (this._table[fileName][R][C - 1] == 'OCTET') {
          this._table[fileName][R][C - 1] = 'OCTET STRING';
        }
        break;
      default:
        this._table[fileName][R][C] = symbol;
        this.columnIndex++;
        break;
    }
  }
}
