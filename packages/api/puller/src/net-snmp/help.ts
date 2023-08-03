import * as fs from 'fs';

interface Table {
  [FileName: string]: (string | symbol)[][];
}

interface ModuleNameTable {
  [FileName: string]: string;
}

export class MIB {
  directory: string;
  SymbolBuffer: any; // Not sure about the type, please replace it accordingly
  StringBuffer: string;
  Modules: any; // Not sure about the type, please replace it accordingly
  Objects: any; // Not sure about the type, please replace it accordingly
  MACROS: string[];
  CurrentObject: any; // Not sure about the type, please replace it accordingly
  TempObject: any; // Not sure about the type, please replace it accordingly
  CurrentClause: string;
  WaitFor: string;
  CharBuffer: {
    Table: Table;
    ModuleName: ModuleNameTable;
    Append: (char: string) => void;
    Fill: (FileName: string, row: number, column: number) => void;
    builder: string;
    isEqual: boolean;
    isList: boolean;
    logit: boolean;
    PreviousRow: number;
    RowIndex: number;
    ColumnIndex: number;
  };

  constructor(dir?: string) {
    this.directory = dir || '';
    this.SymbolBuffer = {};
    this.StringBuffer = '';
    this.Modules = {};
    this.Objects = {};
    this.MACROS = [];
    this.CurrentObject = null;
    this.TempObject = {};
    this.CurrentClause = '';
    this.WaitFor = '';
    this.CharBuffer = {
      Table: {},
      ModuleName: {},
      builder: '',
      isEqual: false,
      isList: false,
      logit: false,
      PreviousRow: 0,
      RowIndex: 0,
      ColumnIndex: 0,
      Append(char: string) {
        this.builder += char;
      },
      Fill(FileName: string, row: number, column: number) {
        if (this.builder.length == 0) {
          return;
        }
        column = column - this.builder.length;
        const symbol = this.builder.toString().trim();
        this.builder = '';
        this.builder.length = 0;
        if (!this.Table[FileName]) {
          this.Table[FileName] = [];
        } else if (this.PreviousRow < row) {
          this.RowIndex++;
          this.ColumnIndex = 0;
          this.PreviousRow = row;
        }
        const R = this.RowIndex;
        const C = this.ColumnIndex;
        if (!this.Table[FileName][R] || C === 0) {
          this.Table[FileName][R] = Object.defineProperty([], 'line', {
            enumerable: false,
            value: row + 1,
          });
        }
        this.isEqual = false;
        switch (symbol) {
          case ')':
            this.Table[FileName][R][C] = symbol;
            this.ColumnIndex++;
            this.logit = false;
            break;
          case '(':
            this.Table[FileName][R][C] = symbol;
            this.ColumnIndex++;
            this.logit = true;
            break;
          case 'DEFINITIONS':
            if (C == 0) {
              this.ModuleName[FileName] = this.Table[FileName][R - 1][C];
            } else {
              this.ModuleName[FileName] = this.Table[FileName][R][C - 1];
            }
            this.Table[FileName][R][C] = symbol;
            this.ColumnIndex++;
            break;
          case '::=':
            this.Table[FileName][R][C] = symbol;
            this.ColumnIndex++;
            this.isEqual = true;
            break;
          case '{':
            if (this.Table[FileName][R][C - 1] != '::=') {
              this.isList = true;
            }
            this.Table[FileName][R][C] = symbol;
            this.ColumnIndex++;
            break;
          case 'NOTATION':
            if (
              this.Table[FileName][R][C - 1] == 'TYPE' ||
              this.Table[FileName][R][C - 1] == 'VALUE'
            ) {
              this.Table[FileName][R][C - 1] += ' NOTATION';
            }
            break;
          case 'OF':
            if (this.Table[FileName][R][C - 1] == 'SEQUENCE') {
              this.Table[FileName][R][C - 1] = 'SEQUENCE OF';
            }
            break;
          case 'IDENTIFIER':
            if (this.Table[FileName][R][C - 1] == 'OBJECT') {
              this.Table[FileName][R][C - 1] = 'OBJECT IDENTIFIER';
            }
            break;
          case 'STRING':
            if (this.Table[FileName][R][C - 1] == 'OCTET') {
              this.Table[FileName][R][C - 1] = 'OCTET STRING';
            }
            break;
          default:
            this.Table[FileName][R][C] = symbol;
            this.ColumnIndex++;
            break;
        }
      },
    };

    // Complete buffer setup before returning to caller.
    this.initializeBuffer(this.CharBuffer);
  }

  private initializeBuffer(buffer: any): void {
    Object.assign(buffer, {
      logit: false,
      lastChar: '',
      state: '',
      open: false,
      CurrentSymbol: '',
      nested: 0,
      isComment: false,
      isEqual: false,
      isOID: false,
      isList: false,
      isString: false,
      inComment: false,
      inGroup: 0,
      builder: '',
      ColumnIndex: 0,
      RowIndex: 0,
      PreviousRow: 0,
    });
  }

  private newMIB(FileName: string, Contents: string): void {
    this.initializeBuffer(this.CharBuffer);
    const lines = Contents.split('\n');
    let line = '';
    for (let i = 0; i < lines.length; i++) {
      line = lines[i];
      this.parseLine(FileName, line, i);
    }
  }

  private parseLine(FileName: string, line: string, row: number): void {
    const len = line.length;
    for (let i = 0; i < len; i++) {
      const char = line.charAt(i);
      this.parseChar(FileName, char, row, i);
    }
    this.parseChar(FileName, '\n', row, len);
  }

  private parseChar(FileName: string, char: string, row: number, column: number): void {
    this.CharBuffer.Append(char);
    this.CharBuffer.Fill(FileName, row, column);
  }

  Import(FileName: string): void {
    this.ParseModule(
      FileName.split('/')[FileName.split('/').length - 1].split('.')[0],
      fs.readFileSync(FileName).toString()
    );
  }

  ParseModule(FileName: string, Contents: string): void {
    this.newMIB(FileName, Contents);
  }

  ParseChar(FileName: string, char: string, row: number, column: number): void {
    this.parseChar(FileName, char, row, column);
  }
}
