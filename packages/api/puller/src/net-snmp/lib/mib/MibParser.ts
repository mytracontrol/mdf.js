/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var fs = require("fs");

var MIB = function (dir) {
  var initializeBuffer = function (buffer) {
    return Object.assign(buffer, {
      logit: false,
      lastChar: "",
      state: "",
      open: false,
      CurrentSymbol: "",
      nested: 0,
      isComment: false,
      isEqual: false,
      isOID: false,
      isList: false,
      isString: false,
      inComment: false,
      inGroup: 0,
      builder: "",
      ColumnIndex: 0,
      RowIndex: 0,
      PreviousRow: 0,
    });
  };

  var newMIB = {
    directory: dir ? dir : "",
    SymbolBuffer: {},
    StringBuffer: "",
    Modules: {},
    Objects: {},
    MACROS: [],
    CurrentObject: null,
    TempObject: {},
    CurrentClause: "",
    WaitFor: "",
    CharBuffer: {
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
    },
    Import: function (FileName) {
      this.ParseModule(
        FileName.split("/")[FileName.split("/").length - 1].split(".")[0],
        fs.readFileSync(FileName).toString()
      );
    },
    ParseModule: function (FileName, Contents) {
      initializeBuffer(this.CharBuffer);

      var lines = Contents.split("\n");
      var line = "";
      var i = 0;
      while ((line = lines[i]) != null && i <= lines.length) {
        this.ParseLine(FileName, line, i);
        i++;
      }
    },
    ParseLine: function (FileName, line, row) {
      let len = line.length;
      if (line[len - 1] === "\r") --len;
      for (var i = 0; i < len; i++) {
        var char = line.charAt(i);
        this.ParseChar(FileName, char, row, i);
      }
      this.ParseChar(FileName, "\n", row, len);
    },
    ParseChar: function (FileName, char, row, column) {
      switch (char) {
        case "\r":
        case "\n":
          if (!this.CharBuffer.isString) {
            this.CharBuffer.Fill(FileName, row, column);
            this.CharBuffer.isComment = false;
            this.CharBuffer.inGroup = 0; //IGNORE GROUPINGS ACROSS COMMENTS
          } else if (this.CharBuffer.isString && this.CharBuffer.isComment) {
            this.CharBuffer.Append(char);
          }
          break;
        case "{":
          if (!this.CharBuffer.isComment && this.CharBuffer.isEqual) {
            this.CharBuffer.isOID = true;
          }
        case "[":
        case "(":
          if (!this.CharBuffer.isComment && !this.CharBuffer.isString) {
            this.CharBuffer.nested++;
            if (char == "(" || char == "{") {
              // Emit the previous token if this is the start of an outer group
              if (this.CharBuffer.nested === 1) {
                this.CharBuffer.Fill(FileName, row, column);
              }
              this.CharBuffer.inGroup++;
            }
          }
          if (
            this.CharBuffer.isComment ||
            ((this.CharBuffer.isOID || this.CharBuffer.nested > 0) &&
              (!this.CharBuffer.isList || this.CharBuffer.inGroup > 0))
          ) {
            this.CharBuffer.Append(char);
          } else {
            this.CharBuffer.Fill(FileName, row, column);
            this.CharBuffer.Append(char);
            this.CharBuffer.Fill(FileName, row, column);
          }
          break;
        case "}":
        case "]":
        case ")":
          if (!this.CharBuffer.isComment && !this.CharBuffer.isString) {
            this.CharBuffer.nested--;
            if (this.CharBuffer.nested < 0) {
              this.CharBuffer.nested = 0;
            }
            if (char == ")") {
              this.CharBuffer.inGroup--;
              if (this.CharBuffer.inGroup < 0) {
                this.CharBuffer.inGroup = 0; // ignore grouping across comments
              }
            }
          }
          if (
            this.CharBuffer.isComment ||
            ((this.CharBuffer.isOID || this.CharBuffer.nested >= 0) &&
              (!this.CharBuffer.isList || this.CharBuffer.inGroup >= 0))
          ) {
            this.CharBuffer.Append(char);
          } else {
            this.CharBuffer.Fill(FileName, row, column);
            this.CharBuffer.Append(char);
            this.CharBuffer.Fill(FileName, row, column);
          }
          if (char == "}") {
            this.CharBuffer.isOID = false;
            this.CharBuffer.isList = false;
          }
          break;
        case ",":
          if (this.CharBuffer.isComment) {
            this.CharBuffer.Append(char);
          } else {
            this.CharBuffer.Fill(FileName, row, column);
            this.CharBuffer.Append(char);
            this.CharBuffer.Fill(FileName, row, column);
          }
          break;
        case ";":
          if (this.CharBuffer.isComment) {
            this.CharBuffer.Append(char);
          } else {
            this.CharBuffer.Fill(FileName, row, column);
            this.CharBuffer.Append(char);
            this.CharBuffer.Fill(FileName, row, column);
          }
          break;
        case " ":
        case "\t":
          if (
            this.CharBuffer.isComment ||
            ((this.CharBuffer.isOID || this.CharBuffer.nested > 0) &&
              (!this.CharBuffer.isList || this.CharBuffer.inGroup > 0))
          ) {
            this.CharBuffer.Append(char);
          } else {
            this.CharBuffer.Fill(FileName, row, column);
          }
          break;
        case "-":
          this.CharBuffer.Append(char);
          if (!this.CharBuffer.isString && this.CharBuffer.lastChar == "-") {
            this.CharBuffer.isComment = true;
            this.CharBuffer.builder = this.CharBuffer.builder.split("--")[0];
            this.CharBuffer.Fill(FileName, row, column);
            this.CharBuffer.builder = "--";
          }

          break;
        case '"':
          if (
            this.CharBuffer.isComment &&
            !this.CharBuffer.isString &&
            !this.CharBuffer.inComment
          ) {
            //011 = COMMENT
            //IF 011 SET 101
            this.CharBuffer.isComment = true;
            this.CharBuffer.isString = false;
            this.CharBuffer.inComment = true;
          } else if (
            !this.CharBuffer.isComment &&
            !this.CharBuffer.isString &&
            !this.CharBuffer.inComment
          ) {
            //000 = STRING
            //IF 000 SET 110
            this.CharBuffer.isComment = true;
            this.CharBuffer.isString = true;
            this.CharBuffer.inComment = false;
            this.CharBuffer.Fill(FileName, row, column); //new string
          } else if (
            this.CharBuffer.isComment &&
            this.CharBuffer.isString &&
            !this.CharBuffer.inComment
          ) {
            //110 = END STRING
            //IF 110 SET 000
            this.CharBuffer.isComment = false;
            this.CharBuffer.isString = false;
            this.CharBuffer.inComment = false;
          } else if (
            this.CharBuffer.isComment &&
            !this.CharBuffer.isString &&
            this.CharBuffer.inComment
          ) {
            //101 = END COMMENT
            //IF 101 SET 000
            this.CharBuffer.isComment = true;
            this.CharBuffer.isString = false;
            this.CharBuffer.inComment = false;
          }

          if (this.CharBuffer.isComment) {
            this.CharBuffer.Append(char);
          } else {
            this.CharBuffer.Append(char);
            this.CharBuffer.Fill(FileName, row, column);
          }
          break;
        default:
          this.CharBuffer.Append(char);
          break;
      }
      this.CharBuffer.lastChar = char;
    },
    Serialize: function () {
      var Table = this.CharBuffer.Table;
      var ModuleName = "";
      for (var FileName in Table) {
        ModuleName = this.CharBuffer.ModuleName[FileName];
        this.SymbolBuffer[ModuleName] = [];
        var foundTheEnd = false;
        var lastGoodDeclaration = ["none"];
        var file = Table[FileName];
        for (var r = 0; r < file.length; r++) {
          var row = file[r];
          for (var c = 0; c < row.length; c++) {
            var symbol = row[c];
            var addSymbol = true;
            switch (symbol) {
              case "END":
                foundTheEnd = true;
                break;
              case "::=":
                foundTheEnd = false;
                lastGoodDeclaration = row;
                break;
              default:
                if (symbol.startsWith("--")) {
                  //REMOVE COMMENTS
                  //console.log(ModuleName, symbol);
                  addSymbol = false;
                } else {
                  foundTheEnd = false;
                }
            }
            if (addSymbol) {
              this.SymbolBuffer[ModuleName].push(symbol);
            }
          }
        }
        if (!foundTheEnd) {
          // Warn that the contents are malformed
          console.warn(
            '[%s]: Incorrect formatting: no END statement found - last good declaration "%s" (line %s)',
            ModuleName,
            lastGoodDeclaration.join(" "),
            lastGoodDeclaration.line
          );
        }
      }
      this.Compile();
    },
    Compile: function () {
      for (var ModuleName in this.SymbolBuffer) {
        if (this.SymbolBuffer.hasOwnProperty(ModuleName)) {
          if (!this.Modules[ModuleName]) {
            this.Modules[ModuleName] = {};
          }
          var Module = this.Modules[ModuleName];
          var Symbols = this.SymbolBuffer[ModuleName];
          var Object = Module;
          var MACROName = "";
          for (var i = 0; i < Symbols.length; i++) {
            switch (Symbols[i]) {
              case "::=": //new OBJECT to define
                //if OBJECT IDENTIFIER tag IS NEXT, FIND MARCO TO CALL...
                if (Symbols[i + 1].indexOf("{") == 0) {
                  var r = i - 1;
                  var found = false;
                  //Go back and find the MACRO to call
                  while (!found && r > 0) {
                    r--;
                    for (var m = 0; m < this.MACROS.length; m++) {
                      if (Symbols[r] == this.MACROS[m]) {
                        found = true;
                        break;
                      }
                    }
                  }
                  if (Symbols[i - 1] == "OBJECT IDENTIFIER") {
                    Object[Symbols[i - 2]] = {};
                    Object[Symbols[i - 2]]["ObjectName"] = Symbols[i - 2];
                    Object[Symbols[i - 2]]["ModuleName"] = ModuleName;
                    Object[Symbols[i - 2]]["OBJECT IDENTIFIER"] = Symbols[i + 1]
                      .replace("{", "")
                      .replace("}", "")
                      .trim()
                      .replace(/\s+/, " ");
                    if (Object[Symbols[i - 2]]["OBJECT IDENTIFIER"] == "0 0") {
                      Object[Symbols[i - 2]]["OID"] = "0.0";
                      Object[Symbols[i - 2]]["NameSpace"] = "null";
                    } else {
                      this.OID(
                        Object[Symbols[i - 2]]["OBJECT IDENTIFIER"],
                        "",
                        Symbols[i - 2],
                        "",
                        function (ID, OD) {
                          Object[Symbols[i - 2]]["OID"] = ID;
                          Object[Symbols[i - 2]]["NameSpace"] = OD;
                          //Object[Symbols[i - 2]]['ModuleName'] = ModuleName;
                          // Object[Symbols[i - 2]]['ObjectName'] = Symbols[i - 2];
                        }
                      );
                    }
                  } else {
                    var ObjectName = Symbols[r - 1];
                    Object[ObjectName] = {};
                    Object[ObjectName]["ObjectName"] = ObjectName;
                    Object[ObjectName]["ModuleName"] = ModuleName;
                    Object[ObjectName]["MACRO"] = Symbols[r];
                    //BUILD OBJECT FROM MACRO TYPE NOTATION
                    var MARCO = this[Symbols[r]];
                    if (!MARCO) {
                      //HACK IF MARCO IS NOT FOUND
                      //MARCO = {};
                      //return;
                    }
                    var c1 = r;
                    var keychain = [];
                    keychain.push("DESCRIPTION");
                    var key;
                    for (var notation in MARCO["TYPE NOTATION"]) {
                      key = notation;
                      //if TYPE NOTATION does not have a value
                      if (MARCO["TYPE NOTATION"][notation] == null) {
                        //then look up the value from the MACRO Root
                        key = MARCO[notation]["MACRO"].replace(/"/g, "");
                      }
                      keychain.push(key);
                    }
                    while (c1 < i - 1) {
                      c1++;
                      key = Symbols[c1]; //Parse TYPE NOTATION. ex: SYNTAX, ACCESS, STATUS, DESCRIPTION.....

                      //key == 'DESCRIPTION' ? console.log(keychain.indexOf(key), key, Symbols[c1 + 1]) : false;

                      var regExp = /\(([^)]+)\)/; //in parentheses ex: "ethernet-csmacd (6)"

                      if (keychain.indexOf(key) > -1 || key == "REVISION") {
                        var val = Symbols[c1 + 1].replace(/"/g, "");
                        //if value array.
                        if (val.indexOf("{") == 0) {
                          c1++;
                          while (Symbols[c1].indexOf("}") == -1) {
                            c1++;
                            val += Symbols[c1];
                          }
                          if (key == "DEFVAL") {
                            // DEFVAL { 1500 } is not an array
                            val = val
                              .replace(/^{/, "")
                              .replace(/}$/, "")
                              .trim();
                          } else {
                            // build value array
                            val = val
                              .replace("{", "")
                              .replace("}", "")
                              .split(",");
                          }
                        }

                        switch (key) {
                          case "SYNTAX":
                            switch (val) {
                              case "BITS":
                              case "INTEGER":
                              case "Integer32":
                                // integer value array e.g. INTEGER {...rfc877-x25 (5), ethernet-csmacd (6)...}
                                if (Symbols[c1 + 2].indexOf("{") == 0) {
                                  var valObj = val;
                                  val = {};
                                  val[valObj] = {};
                                  c1 = c1 + 1;
                                  var integer;
                                  var syntax;
                                  while (Symbols[c1].indexOf("}") == -1) {
                                    c1++;
                                    var ok = false;
                                    if (
                                      Symbols[c1].indexOf("(") == 0 &&
                                      Symbols[c1].length > 1
                                    ) {
                                      integer = regExp.exec(Symbols[c1]);
                                      syntax = Symbols[c1 - 1];
                                      ok = true;
                                    } else if (Symbols[c1].indexOf("(") > 0) {
                                      integer = regExp.exec(Symbols[c1]);
                                      syntax = Symbols[c1].split("(")[0];
                                      ok = true;
                                    }
                                    if (syntax && syntax.indexOf("{") == 0) {
                                      syntax = syntax.split("{")[1].trim();
                                    }
                                    if (ok) {
                                      val[valObj][integer[1]] = syntax;
                                    }
                                  }
                                  // integer range e.g. INTEGER (1..2147483647)
                                } else if (Symbols[c1 + 2].indexOf("(") == 0) {
                                  let valObj = val;
                                  val = {};
                                  val[valObj] = {
                                    ranges: this.GetRanges(Symbols[c1 + 2]),
                                  };
                                }
                                break;
                              case "OCTET STRING":
                              case "DisplayString":
                                // string size e.g. OCTET STRING (SIZE (0..127))
                                if (
                                  Symbols[c1 + 2]
                                    .replace(/ g, "")
                                    .startsWith("(SIZE")
                                ) {
                                  let valObj = val;
                                  val = {};
                                  val[valObj] = {
                                    sizes: this.GetRanges(Symbols[c1 + 2]),
                                  };
                                }
                                break;
                              case "SEQUENCE OF":
                                val += " " + Symbols[c1 + 2];
                                c1 = c1 + 2;
                                break;
                              default:
                                break;
                            }
                            //SYNTAX value
                            Object[ObjectName][key] = val;
                            break;
                          case "DESCRIPTION":
                            if (!Object[ObjectName][key]) {
                              Object[ObjectName][key] = val;
                            }
                            if (!Object[ObjectName]["REVISIONS-DESCRIPTIONS"]) {
                              Object[ObjectName]["REVISIONS-DESCRIPTIONS"] = [];
                            }
                            Object[ObjectName]["REVISIONS-DESCRIPTIONS"].push({
                              type: "DESCRIPTION",
                              value: val,
                            });
                            break;
                          case "REVISION":
                            if (!Object[ObjectName]["REVISIONS-DESCRIPTIONS"]) {
                              Object[ObjectName]["REVISIONS-DESCRIPTIONS"] = [];
                            }
                            Object[ObjectName]["REVISIONS-DESCRIPTIONS"].push({
                              type: "REVISION",
                              value: val,
                            });
                            break;
                          default:
                            Object[ObjectName][key] = val;
                            break;
                        }
                      }
                    }
                    Object[Symbols[r - 1]]["ObjectName"] = Symbols[r - 1];
                    Object[Symbols[r - 1]]["ModuleName"] = ModuleName;
                    Object[Symbols[r - 1]]["OBJECT IDENTIFIER"] = Symbols[i + 1]
                      .replace("{", "")
                      .replace("}", "")
                      .trim()
                      .replace(/\s+/, " ");

                    if (Object[Symbols[r - 1]]["OBJECT IDENTIFIER"] == "0 0") {
                      Object[Symbols[r - 1]]["OID"] = "0.0";
                      Object[Symbols[r - 1]]["NameSpace"] = "null";
                    } else {
                      this.OID(
                        Object[Symbols[r - 1]]["OBJECT IDENTIFIER"],
                        "",
                        Symbols[r - 1],
                        "",
                        function (ID, OD) {
                          Object[Symbols[r - 1]]["OID"] = ID;
                          Object[Symbols[r - 1]]["NameSpace"] = OD;
                          //Object[Symbols[r - 1]]['ModuleName'] = ModuleName;
                          //Object[Symbols[r - 1]]['ObjectName'] = Symbols[r - 1];
                        }
                      );
                    }
                    if (
                      Object[Symbols[r - 1]]["REVISIONS-DESCRIPTIONS"] &&
                      Object[Symbols[r - 1]]["REVISIONS-DESCRIPTIONS"].length ==
                        1 &&
                      Object[Symbols[r - 1]]["REVISIONS-DESCRIPTIONS"][0][
                        "type"
                      ] == "DESCRIPTION"
                    ) {
                      delete Object[Symbols[r - 1]]["REVISIONS-DESCRIPTIONS"];
                    }
                  }
                } else {
                  //if OBJECT IDENTIFIER tag is NOT NEXT, check prior symbol for processing instructions / MARCO creation.
                  switch (Symbols[i - 1]) {
                    case "DEFINITIONS":
                      break;
                    case "OBJECT IDENTIFIER":
                      break;
                    case "MACRO":
                      Object = Object[Symbols[i - 2]] = {};
                      MACROName = Symbols[i - 2];
                      break;
                    case "VALUE NOTATION":
                    case "TYPE NOTATION":
                      Object[Symbols[i - 1]] = {};
                      var j = i + 1;
                      while (
                        Symbols[j + 1] != "::=" &&
                        Symbols[j + 1] != "END"
                      ) {
                        if (Symbols[j].indexOf('"') == 0) {
                          var value = Symbols[j + 1];
                          var t = j + 1;
                          if (Symbols[j + 2].indexOf("(") == 0) {
                            value = Symbols[j + 2];
                            t = j + 2;
                          }
                          Object[Symbols[i - 1]][Symbols[j].replace(/"/g, "")] =
                            value;
                          j = t;
                        } else {
                          Object[Symbols[i - 1]][Symbols[j]] = null;
                          if (Symbols[j + 1].indexOf("(") == 0) {
                            Object[Symbols[i - 1]][Symbols[j]] = Symbols[j + 1];
                            j++;
                          }
                        }
                        j++;
                      }
                      // Workaround for lack of INDEX, AUGMENTS and ACCESS in OBJECT-TYPE MACRO "TYPE NOTATION"
                      if (ModuleName == "SNMPv2-SMI") {
                        Object["TYPE NOTATION"].INDEX = "Index";
                        Object["TYPE NOTATION"].AUGMENTS = "Augments";
                        Object["TYPE NOTATION"].ACCESS = "Access";
                      } else if (ModuleName == "RFC-1212") {
                        Object["TYPE NOTATION"].INDEX = "Index";
                        Object["TYPE NOTATION"].ACCESS = "Access";
                      }
                      // End INDEX/AUGMENTS workaround
                      break;
                    default:
                      //new object
                      Object[Symbols[i - 1]] = {};
                      Object[Symbols[i - 1]]["ObjectName"] = Symbols[i - 1];
                      Object[Symbols[i - 1]]["ModuleName"] = ModuleName;
                      Object[Symbols[i - 1]]["MACRO"] = Symbols[i + 1];
                      this.BuildObject(
                        Object,
                        Symbols[i - 1],
                        Symbols[i + 1],
                        i,
                        Symbols
                      );
                      break;
                  }
                }
                break;
              case "END":
                if (MACROName != "") {
                  //ADD macros to root for easier processing
                  //Still need Import feature
                  this[MACROName] = Object;
                  this.MACROS.push(MACROName);
                }
                //reset Object to Module root;
                Object = Module;
                MACROName = "";
                break;
              case "IMPORTS":
                //console.log(ModuleName, 'IMPORTS');
                //i++;
                Module["IMPORTS"] = {};
                var tmp = i + 1;
                var IMPORTS = [];
                while (Symbols[tmp] != ";") {
                  if (Symbols[tmp] == "FROM") {
                    var ImportModule = Symbols[tmp + 1];
                    if (!this.Modules[ImportModule]) {
                      console.log(
                        ModuleName +
                          ": Can not find " +
                          ImportModule +
                          "!!!!!!!!!!!!!!!!!!!!!"
                      );
                      console.log(ModuleName + ": Can not import ", IMPORTS);
                    }
                    Module["IMPORTS"][ImportModule] = IMPORTS;
                    tmp++;
                    IMPORTS = [];
                  } else if (Symbols[tmp] != ",") {
                    IMPORTS.push(Symbols[tmp]);
                  }
                  tmp++;
                }
                //console.log(ModuleName, 'IMPORTS', Module['IMPORTS']);
                break;
              case "EXPORTS":
                //console.log(ModuleName, 'EXPORTS');
                break;
              default:
                break;
            }
          }
        }
      }
    },
    GetRanges: function (mibRanges) {
      let rangesString = mibRanges
        .replace(/ g, "")
        .replace(/\(SIZE/, "")
        .replace(/\)/, "")
        .replace(/\(/, "")
        .replace(/\)/, "");
      let rangeStrings = rangesString.split("|");
      let ranges = [];

      for (let rangeString of rangeStrings) {
        if (rangeString.includes("..")) {
          let range = rangeString.split("..");
          ranges.push({
            min: parseInt(range[0], 10),
            max: parseInt(range[1], 10),
          });
        } else {
          ranges.push({
            min: parseInt(rangeString, 10),
            max: parseInt(rangeString, 10),
          });
        }
      }
      return ranges;
    },
    BuildObject: function (Object, ObjectName, macro, i, Symbols) {
      var syntaxKeyword = Symbols.indexOf("SYNTAX", i);
      var m = syntaxKeyword - i;
      var c1 = syntaxKeyword + 1;
      var SYNTAX = Symbols[c1];
      var val = Symbols[c1 + 1];

      if (this.MACROS.indexOf(macro) > -1 && m < 10) {
        if (val[0] === "{") {
          c1++;
          while (Symbols[c1].indexOf("}") == -1) {
            c1++;
            val += Symbols[c1].trim();
          }
          val = val.replace("{", "").replace("}", "").split(",");

          Object[ObjectName]["SYNTAX"] = {};
          Object[ObjectName]["SYNTAX"][SYNTAX] = {};

          for (var TC = 0; TC < val.length; TC++) {
            let openParenSplit = val[TC].split(/\s*\(\s);
            Object[ObjectName]["SYNTAX"][SYNTAX][
              openParenSplit[1].replace(/\s*\)\s*$/, "")
            ] = openParenSplit[0].trimStart();
          }
        } else if (val[0] === "(") {
          const key = val.startsWith("(SIZE") ? "sizes" : "ranges";
          Object[ObjectName]["SYNTAX"] = {};
          Object[ObjectName]["SYNTAX"][SYNTAX] = { [key]: this.GetRanges(val) };
        } else {
          Object[ObjectName]["SYNTAX"] = SYNTAX;
        }
      }
    },
    GetSummary: function (callback) {
      var summary = "";
      for (var ModuleName in this.Modules) {
        if (this.Modules.hasOwnProperty(ModuleName)) {
          for (var ObjectName in this.Modules[ModuleName]) {
            if (this.Modules[ModuleName].hasOwnProperty(ObjectName)) {
              if (this.Modules[ModuleName][ObjectName]["OID"]) {
                //OID
                summary +=
                  this.Modules[ModuleName][ObjectName]["OID"] +
                  " : " +
                  ObjectName +
                  "\r\n";
                //callback(this.Modules[ModuleName][ObjectName]);
                //break;
              }
            }
          }
        }
      }
      callback(summary);
    },
    OID: function (OBJECT_IDENTIFIER, ID, ObjectName, OD, callback) {
      let members = OBJECT_IDENTIFIER.split(" ");
      let parent = members.shift();
      let oid = members.pop();
      if (parent == "iso") {
        let midID = ["1"];
        let midOD = ["iso"];
        for (let entry of members) {
          let match = entry.match(/(.*)\((.+)\)$/);
          midID.push(match[2]);
          midOD.push(match[1]);
        }
        midID.push(oid);
        if (ID != "") {
          midID.push(ID);
        }
        if (OD != "") {
          midOD.push(OD);
        }
        midOD.push(ObjectName);
        callback(midID.join("."), midOD.join("."));
        return;
      }
      ID = ID == "" ? oid : [oid, ID].join(".");
      OD = OD == "" ? parent : [parent, OD].join(".");
      for (var ModuleName in this.Modules) {
        if (this.Modules.hasOwnProperty(ModuleName)) {
          if (this.Modules[ModuleName][parent]) {
            this.OID(
              this.Modules[ModuleName][parent]["OBJECT IDENTIFIER"],
              ID,
              ObjectName,
              OD,
              callback
            );
            break;
          }
        }
      }
    },
  };

  // Complete buffer setup before returning to caller.
  initializeBuffer(newMIB.CharBuffer);

  return newMIB;
};

module.exports = exports = MIB;
exports.MIB = MIB;
exports.native = undefined;
```
*/

import fs from 'fs';
import { CharBuffer } from './CharBuffer';

export interface MibModules {
  [moduleName: string]: MibModuleRepresentation;
}

export interface MibModuleRepresentation {
  [moduleEntryName: string]: MibModuleEntryObject;
}

export interface MibModuleEntryObject {
  ObjectName: string;
  MACRO: string;
  SYNTAX: string;
}

export class MibParser {
  private _directory: string;
  private _symbolBuffer: object;
  private _stringBuffer: string;
  private _modules: MibModules;
  private _objects: any;
  private _macros: any[];
  private _currentObject: any | null;
  private _tempObject: any;
  private _currentClause: string;
  private _waitFor: string;
  private _charBuffer: CharBuffer;

  constructor(dir?: string) {
    this._directory = dir || '';
    this._symbolBuffer = {};
    this._stringBuffer = '';
    this._modules = {};
    this._objects = {};
    this._macros = [];
    this._currentObject = null;
    this._tempObject = {};
    this._currentClause = '';
    this._waitFor = '';
    this._charBuffer = new CharBuffer();
    this._initializeBuffer(this._charBuffer);
  }

  public get modules(): MibModules {
    return this._modules;
  }

  private _initializeBuffer(buffer: CharBuffer): void {
    buffer.logit = false;
    buffer.lastChar = '';
    buffer.state = '';
    buffer.open = false;
    buffer.currentSymbol = '';
    buffer.nested = 0;
    buffer.isComment = false;
    buffer.isEqual = false;
    buffer.isOID = false;
    buffer.isList = false;
    buffer.isString = false;
    buffer.inComment = false;
    buffer.inGroup = 0;
    buffer.builder = '';
    buffer.columnIndex = 0;
    buffer.rowIndex = 0;
    buffer.previousRow = 0;
  }

  public import(fileName: string): void {
    const splittedFilename = fileName.split('/');
    this.parseModule(
      splittedFilename[splittedFilename.length - 1].split('.')[0],
      fs.readFileSync(fileName).toString()
    );
  }

  public parseModule(fileName: string, contents: string): void {
    this._initializeBuffer(this._charBuffer);

    const lines = contents.split('\n');
    let line = '';
    let lineIdx = 0;
    while ((line = lines[lineIdx]) != null && lineIdx <= lines.length) {
      this.parseLine(fileName, line, lineIdx);
      lineIdx++;
    }
  }

  public parseLine(fileName: string, line: string, row: number): void {
    let lineLength = line.length;
    if (line[lineLength - 1] === '\r') {
      --lineLength;
    }

    for (let pos = 0; pos < lineLength; pos++) {
      const char = line.charAt(pos);
      this.parseChar(fileName, char, row, pos);
    }
    this.parseChar(fileName, '\n', row, lineLength);
  }

  public parseChar(fileName: string, char: string, row: number, column: number): void {
    switch (char) {
      case '\r':
      case '\n':
        if (!this._charBuffer.isString) {
          this._charBuffer.fill(fileName, row, column);
          this._charBuffer.isComment = false;
          this._charBuffer.inGroup = 0; //IGNORE GROUPINGS ACROSS COMMENTS
        } else if (this._charBuffer.isString && this._charBuffer.isComment) {
          this._charBuffer.append(char);
        }
        break;
      case '{':
        if (!this._charBuffer.isComment && this._charBuffer.isEqual) {
          this._charBuffer.isOID = true;
        }
      case '[':
      case '(':
        if (!this._charBuffer.isComment && !this._charBuffer.isString) {
          this._charBuffer.nested++;
          if (char == '(' || char == '{') {
            // Emit the previous token if this is the start of an outer group
            if (this._charBuffer.nested === 1) {
              this._charBuffer.fill(fileName, row, column);
            }
            this._charBuffer.inGroup++;
          }
        }
        if (
          this._charBuffer.isComment ||
          ((this._charBuffer.isOID || this._charBuffer.nested > 0) &&
            (!this._charBuffer.isList || this._charBuffer.inGroup > 0))
        ) {
          this._charBuffer.append(char);
        } else {
          this._charBuffer.fill(fileName, row, column);
          this._charBuffer.append(char);
          this._charBuffer.fill(fileName, row, column);
        }
        break;
      case '}':
      case ']':
      case ')':
        if (!this._charBuffer.isComment && !this._charBuffer.isString) {
          this._charBuffer.nested--;
          if (this._charBuffer.nested < 0) {
            this._charBuffer.nested = 0;
          }
          if (char == ')') {
            this._charBuffer.inGroup--;
            if (this._charBuffer.inGroup < 0) {
              this._charBuffer.inGroup = 0; // ignore grouping across comments
            }
          }
        }
        if (
          this._charBuffer.isComment ||
          ((this._charBuffer.isOID || this._charBuffer.nested >= 0) &&
            (!this._charBuffer.isList || this._charBuffer.inGroup >= 0))
        ) {
          this._charBuffer.append(char);
        } else {
          this._charBuffer.fill(fileName, row, column);
          this._charBuffer.append(char);
          this._charBuffer.fill(fileName, row, column);
        }
        if (char == '}') {
          this._charBuffer.isOID = false;
          this._charBuffer.isList = false;
        }
        break;
      case ',':
        if (this._charBuffer.isComment) {
          this._charBuffer.append(char);
        } else {
          this._charBuffer.fill(fileName, row, column);
          this._charBuffer.append(char);
          this._charBuffer.fill(fileName, row, column);
        }
        break;
      case ';':
        if (this._charBuffer.isComment) {
          this._charBuffer.append(char);
        } else {
          this._charBuffer.fill(fileName, row, column);
          this._charBuffer.append(char);
          this._charBuffer.fill(fileName, row, column);
        }
        break;
      case ' ':
      case '\t':
        if (
          this._charBuffer.isComment ||
          ((this._charBuffer.isOID || this._charBuffer.nested > 0) &&
            (!this._charBuffer.isList || this._charBuffer.inGroup > 0))
        ) {
          this._charBuffer.append(char);
        } else {
          this._charBuffer.fill(fileName, row, column);
        }
        break;
      case '-':
        this._charBuffer.append(char);
        if (!this._charBuffer.isString && this._charBuffer.lastChar == '-') {
          this._charBuffer.isComment = true;
          this._charBuffer.builder = this._charBuffer.builder.split('--')[0];
          this._charBuffer.fill(fileName, row, column);
          this._charBuffer.builder = '--';
        }
        break;
      case '"':
        if (
          this._charBuffer.isComment &&
          !this._charBuffer.isString &&
          !this._charBuffer.inComment
        ) {
          //011 = COMMENT
          //IF 011 SET 101
          this._charBuffer.isComment = true;
          this._charBuffer.isString = false;
          this._charBuffer.inComment = true;
        } else if (
          !this._charBuffer.isComment &&
          !this._charBuffer.isString &&
          !this._charBuffer.inComment
        ) {
          //000 = STRING
          //IF 000 SET 110
          this._charBuffer.isComment = true;
          this._charBuffer.isString = true;
          this._charBuffer.inComment = false;
          this._charBuffer.fill(fileName, row, column); //new string
        } else if (
          this._charBuffer.isComment &&
          this._charBuffer.isString &&
          !this._charBuffer.inComment
        ) {
          //110 = END STRING
          //IF 110 SET 000
          this._charBuffer.isComment = false;
          this._charBuffer.isString = false;
          this._charBuffer.inComment = false;
        } else if (
          this._charBuffer.isComment &&
          !this._charBuffer.isString &&
          this._charBuffer.inComment
        ) {
          //101 = END COMMENT
          //IF 101 SET 000
          this._charBuffer.isComment = true;
          this._charBuffer.isString = false;
          this._charBuffer.inComment = false;
        }

        if (this._charBuffer.isComment) {
          this._charBuffer.append(char);
        } else {
          this._charBuffer.append(char);
          this._charBuffer.fill(fileName, row, column);
        }
        break;
      default:
        this._charBuffer.append(char);
        break;
    }
    this._charBuffer.lastChar = char;
  }

  public serialize(): void {
    const table = this._charBuffer.table;
    let moduleName = '';
    for (const fileName in table) {
      moduleName = this._charBuffer.moduleName[fileName];
      this._symbolBuffer[moduleName] = [];
      let foundTheEnd = false;
      let lastGoodDeclaration = ['none'];
      let lastGoodDeclarationLine = -1;
      const file = table[fileName];
      for (let rowIdx = 0; rowIdx < file.length; rowIdx++) {
        const row = file[rowIdx];
        for (const symbol of row) {
          let addSymbol = true;
          switch (symbol) {
            case 'END':
              foundTheEnd = true;
              break;
            case '::=':
              foundTheEnd = false;
              lastGoodDeclaration = row;
              lastGoodDeclarationLine = rowIdx;
              break;
            default:
              if (symbol.startsWith('--')) {
                //REMOVE COMMENTS
                //console.log(ModuleName, symbol);
                addSymbol = false;
              } else {
                foundTheEnd = false;
              }
          }
          if (addSymbol) {
            this._symbolBuffer[moduleName].push(symbol);
          }
        }
      }

      if (!foundTheEnd) {
        // Warn that the contents are malformed
        console.warn(
          `[${moduleName}]: Incorrect formatting: no END statement found - last good declaration "${lastGoodDeclaration.join(
            ' '
            // TODO: Check, error doing original lastGoodDeclaration.line
            // )}" (line ${lastGoodDeclaration.line})`
          )}" (line ${lastGoodDeclarationLine + 1})`
        );
      }
    }
    this.compile();
  }

  public compile(): void {
    for (const moduleName in this._symbolBuffer) {
      // TODO: First check needed since we are using for..in with moduleName?
      if (this._symbolBuffer.hasOwnProperty(moduleName)) {
        if (!this._modules[moduleName]) {
          this._modules[moduleName] = {};
        }
        const module = this._modules[moduleName];
        const symbols = this._symbolBuffer[moduleName];
        let object = module;
        let macroName = '';
        for (let symbolIdx = 0; symbolIdx < symbols.length; symbolIdx++) {
          const symbol = symbols[symbolIdx];
          switch (symbol) {
            case '::=': //new OBJECT to define
              //if OBJECT IDENTIFIER tag IS NEXT, FIND MACRO TO CALL...
              if (symbols[symbolIdx + 1].indexOf('{') === 0) {
                let previousSymbolIdx = symbolIdx - 1;
                let found = false;
                //Go back and find the MACRO to call
                while (!found && previousSymbolIdx > 0) {
                  previousSymbolIdx--;
                  for (const macro of this._macros) {
                    if (symbols[previousSymbolIdx] === macro) {
                      found = true;
                      break;
                    }
                  }
                }
                if (symbols[symbolIdx - 1] === 'OBJECT IDENTIFIER') {
                  object[symbols[symbolIdx - 2]] = {};
                  object[symbols[symbolIdx - 2]]['ObjectName'] = symbols[symbolIdx - 2];
                  object[symbols[symbolIdx - 2]]['ModuleName'] = moduleName;
                  object[symbols[symbolIdx - 2]]['OBJECT IDENTIFIER'] = symbols[symbolIdx + 1]
                    .replace('{', '')
                    .replace('}', '')
                    .trim()
                    .replace(/\s+/, ' ');
                  if (object[symbols[symbolIdx - 2]]['OBJECT IDENTIFIER'] === '0 0') {
                    object[symbols[symbolIdx - 2]]['OID'] = '0.0';
                    object[symbols[symbolIdx - 2]]['NameSpace'] = 'null';
                  } else {
                    this._oid(
                      object[symbols[symbolIdx - 2]]['OBJECT IDENTIFIER'],
                      '',
                      symbols[symbolIdx - 2],
                      '',
                      (ID, OD) => {
                        object[symbols[symbolIdx - 2]]['OID'] = ID;
                        object[symbols[symbolIdx - 2]]['NameSpace'] = OD;
                        //object[symbols[symbolIdx - 2]]['ModuleName'] = moduleName;
                        //object[symbols[symbolIdx - 2]]['ObjectName'] = symbols[symbolIdx - 2];
                      }
                    );
                  }
                } else {
                  const objectName = symbols[previousSymbolIdx - 1];
                  object[objectName] = {};
                  object[objectName]['ObjectName'] = objectName;
                  object[objectName]['ModuleName'] = moduleName;
                  object[objectName]['MACRO'] = symbols[previousSymbolIdx];
                  //BUILD OBJECT FROM MACRO TYPE NOTATION
                  const MARCO = this[symbols[previousSymbolIdx]];
                  if (!MARCO) {
                    //HACK IF MARCO IS NOT FOUND
                    //MARCO = {};
                    //return;
                  }
                  let c1 = previousSymbolIdx;
                  const keychain: string[] = [];
                  keychain.push('DESCRIPTION');
                  let key: string;
                  for (const notation in MARCO['TYPE NOTATION']) {
                    key = notation;
                    //if TYPE NOTATION does not have a value
                    if (MARCO['TYPE NOTATION'][notation] == null) {
                      //then look up the value from the MACRO Root
                      key = MARCO[notation]['MACRO'].replace(/"/g, '');
                    }
                    keychain.push(key);
                  }
                  while (c1 < symbolIdx - 1) {
                    c1++;
                    key = symbols[c1]; //Parse TYPE NOTATION. ex: SYNTAX, ACCESS, STATUS, DESCRIPTION.....

                    //key == 'DESCRIPTION' ? console.log(keychain.indexOf(key), key, symbols[c1 + 1]) : false;

                    const regExp = /\(([^)]+)\)/; //in parentheses ex: "ethernet-csmacd (6)"

                    if (keychain.indexOf(key) > -1 || key == 'REVISION') {
                      let val = symbols[c1 + 1].replace(/"/g, '');
                      //if value array.
                      if (val.indexOf('{') == 0) {
                        c1++;
                        while (symbols[c1].indexOf('}') == -1) {
                          c1++;
                          val += symbols[c1];
                        }
                        if (key == 'DEFVAL') {
                          // DEFVAL { 1500 } is not an array
                          val = val.replace(/^{/, '').replace(/}$/, '').trim();
                        } else {
                          // build value array
                          val = val.replace('{', '').replace('}', '').split(',');
                        }
                      }

                      switch (key) {
                        case 'SYNTAX':
                          switch (val) {
                            case 'BITS':
                            case 'INTEGER':
                            case 'Integer32':
                              // integer value array e.g. INTEGER {...rfc877-x25 (5), ethernet-csmacd (6)...}
                              if (symbols[c1 + 2].indexOf('{') == 0) {
                                const valObj = {};
                                valObj[val] = {};
                                c1 = c1 + 1;
                                let integer;
                                let syntax;
                                while (symbols[c1].indexOf('}') == -1) {
                                  c1++;
                                  let ok = false;
                                  if (symbols[c1].indexOf('(') == 0 && symbols[c1].length > 1) {
                                    integer = regExp.exec(symbols[c1]);
                                    syntax = symbols[c1 - 1];
                                    ok = true;
                                  } else if (symbols[c1].indexOf('(') > 0) {
                                    integer = regExp.exec(symbols[c1]);
                                    syntax = symbols[c1].split('(')[0];
                                    ok = true;
                                  }
                                  if (syntax && syntax.indexOf('{') == 0) {
                                    syntax = syntax.split('{')[1].trim();
                                  }
                                  if (ok) {
                                    valObj[val][integer[1]] = syntax;
                                  }
                                }
                                // integer range e.g. INTEGER (1..2147483647)
                              } else if (symbols[c1 + 2].indexOf('(') == 0) {
                                const valObj = {};
                                valObj[val] = { ranges: this._getRanges(symbols[c1 + 2]) };
                              }
                              break;
                            case 'OCTET STRING':
                            case 'DisplayString':
                              // string size e.g. OCTET STRING (SIZE (0..127))
                              if (symbols[c1 + 2].replace(/ */g, '').startsWith('(SIZE')) {
                                const valObj = {};
                                valObj[val] = { sizes: this._getRanges(symbols[c1 + 2]) };
                              }
                              break;
                            case 'SEQUENCE OF':
                              val += ' ' + symbols[c1 + 2];
                              c1 = c1 + 2;
                              break;
                            default:
                              break;
                          }
                          //SYNTAX value
                          // TODO: Check, val passed to be {} on some previous cases.
                          // See val and valObj
                          object[objectName][key] = val;
                          break;
                        case 'DESCRIPTION':
                          if (!object[objectName][key]) {
                            object[objectName][key] = val;
                          }
                          if (!object[objectName]['REVISIONS-DESCRIPTIONS']) {
                            object[objectName]['REVISIONS-DESCRIPTIONS'] = [];
                          }
                          object[objectName]['REVISIONS-DESCRIPTIONS'].push({
                            type: 'DESCRIPTION',
                            value: val,
                          });
                          break;
                        case 'REVISION':
                          if (!object[objectName]['REVISIONS-DESCRIPTIONS']) {
                            object[objectName]['REVISIONS-DESCRIPTIONS'] = [];
                          }
                          object[objectName]['REVISIONS-DESCRIPTIONS'].push({
                            type: 'REVISION',
                            value: val,
                          });
                          break;
                        default:
                          object[objectName][key] = val;
                          break;
                      }
                    }
                  }
                  const prevSymbol = symbols[previousSymbolIdx - 1];
                  object[prevSymbol]['ObjectName'] = prevSymbol;
                  object[prevSymbol]['ModuleName'] = moduleName;
                  object[prevSymbol]['OBJECT IDENTIFIER'] = symbols[symbolIdx + 1]
                    .replace('{', '')
                    .replace('}', '')
                    .trim()
                    .replace(/\s+/, ' ');
                  if (object[prevSymbol]['OBJECT IDENTIFIER'] == '0 0') {
                    object[prevSymbol]['OID'] = '0.0';
                    object[prevSymbol]['NameSpace'] = 'null';
                  } else {
                    this._oid(
                      object[prevSymbol]['OBJECT IDENTIFIER'],
                      '',
                      prevSymbol,
                      '',
                      (ID, OD) => {
                        object[prevSymbol]['OID'] = ID;
                        object[prevSymbol]['NameSpace'] = OD;
                        //object[prevSymbol]['ModuleName'] = moduleName;
                        //object[prevSymbol]['ObjectName'] = prevSymbol;
                      }
                    );
                  }
                  if (
                    object[prevSymbol]['REVISIONS-DESCRIPTIONS'] &&
                    object[prevSymbol]['REVISIONS-DESCRIPTIONS'].length == 1 &&
                    object[prevSymbol]['REVISIONS-DESCRIPTIONS'][0]['type'] == 'DESCRIPTION'
                  ) {
                    delete object[prevSymbol]['REVISIONS-DESCRIPTIONS'];
                  }
                }
              } else {
                // if OBJECT IDENTIFIER tag is NOT NEXT, check prior symbol for
                // processing instructions / MARCO creation.S
                switch (symbols[symbolIdx - 1]) {
                  case 'DEFINITIONS':
                    break;
                  case 'OBJECT IDENTIFIER':
                    break;
                  case 'MACRO':
                    object = object[symbols[symbolIdx - 2]] = {};
                    macroName = symbols[symbolIdx - 2];
                    break;
                  case 'VALUE NOTATION':
                  case 'TYPE NOTATION':
                    object[symbols[symbolIdx - 1]] = {};
                    let j = symbolIdx + 1;
                    while (symbols[j + 1] != '::=' && symbols[j + 1] != 'END') {
                      if (symbols[j].indexOf('"') == 0) {
                        let value = symbols[j + 1];
                        let t = j + 1;
                        if (symbols[j + 2].indexOf('(') == 0) {
                          value = symbols[j + 2];
                          t = j + 2;
                        }
                        object[symbols[symbolIdx - 1]][symbols[j].replace(/"/g, '')] = value;
                        j = t;
                      } else {
                        object[symbols[symbolIdx - 1]][symbols[j]] = null;
                        if (symbols[j + 1].indexOf('(') == 0) {
                          object[symbols[symbolIdx - 1]][symbols[j]] = symbols[j + 1];
                          j++;
                        }
                      }
                      j++;
                    }
                    // Workaround for lack of INDEX, AUGMENTS and ACCESS in
                    // OBJECT-TYPE MACRO "TYPE NOTATION"
                    if (moduleName == 'SNMPv2-SMI') {
                      object['TYPE NOTATION'].INDEX = 'Index';
                      object['TYPE NOTATION'].AUGMENTS = 'Augments';
                      object['TYPE NOTATION'].ACCESS = 'Access';
                    } else if (moduleName == 'RFC-1212') {
                      object['TYPE NOTATION'].INDEX = 'Index';
                      object['TYPE NOTATION'].ACCESS = 'Access';
                    }
                    // End INDEX/AUGMENTS workaround
                    break;
                  default:
                    //new object
                    object[symbols[symbolIdx - 1]] = {};
                    object[symbols[symbolIdx - 1]]['ObjectName'] = symbols[symbolIdx - 1];
                    object[symbols[symbolIdx - 1]]['ModuleName'] = moduleName;
                    object[symbols[symbolIdx - 1]]['MACRO'] = symbols[symbolIdx + 1];
                    this.buildObject(
                      object,
                      symbols[symbolIdx - 1],
                      symbols[symbolIdx + 1],
                      symbolIdx,
                      symbols
                    );
                    break;
                }
              }
              break;
            case 'END':
              if (macroName != '') {
                //ADD macros to root for easier processing
                //Still need Import feature
                this[macroName] = object;
                this._macros.push(macroName);
              }
              //reset object to module root;
              object = module;
              macroName = '';
              break;
            case 'IMPORTS':
              //console.log(moduleName, 'IMPORTS');
              //i++;
              module['IMPORTS'] = {};
              let tmp = symbolIdx + 1;
              let imports: string[] = [];
              while (symbols[tmp] != ';') {
                if (symbols[tmp] == 'FROM') {
                  const importModule = symbols[tmp + 1];
                  if (!this._modules[importModule]) {
                    // TODO: Check. Leave console.log?
                    console.log(`${moduleName}: Can not find ${importModule}!!!!!!!!!!!!!!!!!!!!!`);
                    console.log(`${moduleName}: Can not import `, imports);
                  }
                  module['IMPORTS'][importModule] = imports;
                  tmp++;
                  imports = [];
                } else if (symbols[tmp] != ',') {
                  imports.push(symbols[tmp]);
                }
                tmp++;
              }
              //console.log(moduleName, 'IMPORTS', module['IMPORTS']);
              break;
            case 'EXPORTS':
              //console.log(moduleName, 'EXPORTS');
              break;
            default:
              break;
          }
        }
      }
    }
  }

  public getRanges(mibRanges: string): MibRange[] {
    const rangesString = mibRanges
      .replace(/ */g, '')
      .replace(/\(SIZE/, '')
      .replace(/\)/, '')
      .replace(/\(/, '')
      .replace(/\)/, '');
    const rangeStrings = rangesString.split('|');
    const ranges: MibRange[] = [];

    for (const rangeString of rangeStrings) {
      if (rangeString.includes('..')) {
        const range = rangeString.split('..');
        ranges.push({
          min: parseInt(range[0], 10),
          max: parseInt(range[1], 10),
        });
      } else {
        ranges.push({
          min: parseInt(rangeString, 10),
          max: parseInt(rangeString, 10),
        });
      }
    }
    return ranges;
  }

  public buildObject(
    object: any,
    objectName: string,
    macro: string,
    i: number,
    symbols: string[]
  ): void {
    const syntaxKeyword = symbols.indexOf('SYNTAX', i);
    const m = syntaxKeyword - i;
    let c1 = syntaxKeyword + 1;
    const SYNTAX = symbols[c1];
    let val = symbols[c1 + 1];
    let valParts: string[];

    if (this._macros.indexOf(macro) > -1 && m < 10) {
      if (val[0] === '{') {
        c1++;
        while (symbols[c1].indexOf('}') == -1) {
          c1++;
          val += symbols[c1].trim();
        }
        // TODO: Check
        // val = val.replace('{', '').replace('}', '').split(',');
        valParts = val.replace('{', '').replace('}', '').split(',');

        object[objectName]['SYNTAX'] = {};
        object[objectName]['SYNTAX'][SYNTAX] = {};

        for (const valPart of valParts) {
          const openParenSplit = valPart.split(/\s*\(\s*/);
          object[objectName]['SYNTAX'][SYNTAX][openParenSplit[1].replace(/\s*\)\s*$/, '')] =
            openParenSplit[0].trimStart();
        }
      } else if (val[0] === '(') {
        const key = val.startsWith('(SIZE') ? 'sizes' : 'ranges';
        object[objectName]['SYNTAX'] = {};
        object[objectName]['SYNTAX'][SYNTAX] = { [key]: this.getRanges(val) };
      } else {
        object[objectName]['SYNTAX'] = SYNTAX;
      }
    }
  }

  public getSummary(callback: (summary: string) => void): void {
    let summary = '';
    for (const moduleName in this._modules) {
      if (this._modules.hasOwnProperty(moduleName)) {
        for (const objectName in this._modules[moduleName]) {
          if (this._modules[moduleName].hasOwnProperty(objectName)) {
            if (this._modules[moduleName][objectName]['OID']) {
              //OID
              summary += `${this._modules[moduleName][objectName]['OID']} : ${objectName}\r\n`;
              //callback(this._modules[ModuleName][ObjectName]);
              //break;
            }
          }
        }
      }
    }
    callback(summary);
  }

  public oid(
    objectIdentifier: string,
    id: string,
    objectName: string,
    od: string,
    callback: (id: string, od: string) => void
  ): void {
    const members = objectIdentifier.split(' ');
    const parent = members.shift();
    const oid = members.pop();
    // TODO: Added check for undefined (!)
    if (parent && oid) {
      if (parent == 'iso') {
        const midID = ['1'];
        const midOD = ['iso'];
        for (const entry of members) {
          const match = entry.match(/(.*)\((.+)\)$/);
          // TODO: Added check for undefined (!)
          if (match) {
            midID.push(match[2]);
            midOD.push(match[1]);
          }
        }

        midID.push(oid);
        if (id != '') {
          midID.push(id);
        }
        if (od != '') {
          midOD.push(od);
        }
        midOD.push(objectName);
        callback(midID.join('.'), midOD.join('.'));
        return;
      }
      id = id == '' ? oid : [oid, id].join('.');
      od = od == '' ? parent : [parent, od].join('.');
      for (const moduleName in this._modules) {
        // TODO: If needed??
        if (this._modules.hasOwnProperty(moduleName)) {
          if (this._modules[moduleName][parent]) {
            // TODO: Recursive call, test
            this.oid(
              this._modules[moduleName][parent]['OBJECT IDENTIFIER'],
              id,
              objectName,
              od,
              callback
            );
            break;
          }
        }
      }
    }
  }
}
