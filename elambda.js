"use strict";
(function (global) {
  var bigInt = global.bigInt;
  if (!bigInt) {
    alert("require bigInt http://peterolson.github.com/BigInteger.js/BigInteger.min.js");
  }
  function Parser(source) {
    this.index = 0;
    this.line = 0;
    this.lineStart = 0;
    this.input = source;
  }

  function ParserException(line, column, message) {
    this.line = line;
    this.column = column;
    this.message = message;
  }

  ParserException.prototype.toString = function () {
    return "[" + this.line + ":" + this.column + "] " + this.message;
  };

  function EvaluationException(message) {
    this.message = message;
  }

  EvaluationException.prototype.toString = function () {
    return this.message;
  };

  Parser.prototype.parse = function () {
    var expr = this.parseExpr();
    this.consumeWs();
    if (this.index < this.input.length) {
      throw this.parserError("Expecting EOF");
    }
    return expr;
  };

  Parser.prototype.parseExpr = function () {
    if (this.index >= this.input.length) throw this.parserError("Unexpected EOF");
    this.consumeWs();
    var ch = this.input[this.index];
    switch (ch) {
      case '(':
      {
        this.index++;
        var a = this.parseExpr();
        var b = this.parseExpr();
        this.consumeWs();
        if (this.input[this.index] != ')') {
          throw this.parserError("Expects ')'");
        }
        this.index++;
        return ["Apply", a, b];
      }
      case '\\':
      {
        this.index++;
        var name = this.consumeName();
        this.consumeWs();
        if (this.input[this.index] != '.') {
          throw this.parserError("Expects '.'");
        }
        this.index++;
        var body = this.parseExpr();
        return ["Lambda", name, body];
      }
      default:
        if ('0' <= ch && ch <= '9') {
          this.index++;
          return ["Num", +ch];
        }
        if ('a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || '_' == ch) {
          return ["Ident", this.consumeName()];
        }
    }
    throw this.parserError("Parse Error!");
  };

  Parser.prototype.consumeWs = function () {
    var ch;
    while (this.index < this.input.length) {
      ch = this.input[this.index];
      if (ch == ' ' || ch == '\t') {
        this.index++;
      } else if (ch == '\n') {
        this.index++;
        this.line++;
        this.lineStart = this.index;
      } else if (ch == '\r') {
        this.index++;
        this.line++;
        if (this.input[this.index] == '\n') {
          this.index++;
        }
        this.lineStart = this.index;
      } else {
        break;
      }
    }
  };

  Parser.prototype.consumeName = function () {
    this.consumeWs();
    var sb = "", ch;
    {
      ch = this.input[this.index];
      if ('a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || '_' == ch) {
        sb += ch;
        this.index++;
      } else {
        throw this.parserError("Unexpected '" + ch + "'");
      }
    }
    while (this.index < this.input.length) {
      ch = this.input[this.index];
      if ('0' <= ch && ch <= '9' || 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || '_' == ch) {
        sb += ch;
        this.index++;
      } else {
        break;
      }
    }
    return sb.toString();
  };

  Parser.prototype.parserError = function (message) {
    return new ParserException(this.line, this.index - this.lineStart, message);
  };

  function RuntimeContext(ctx) {
    this.bound = Object.create(null);
    this.counter = [0];
    var key;
    if (ctx) {
      for (key in ctx.bound) {
        this.bound[key] = ctx.bound[key];
      }
      this.counter = ctx.counter;
    } else {
      for (key in RuntimeContext.PREDEFINED) {
        if ({}.hasOwnProperty.call(RuntimeContext.PREDEFINED, key)) {
          this.bound[key] = RuntimeContext.PREDEFINED[key];
        }
      }
    }
  }

  RuntimeContext.prototype.get = function (name) {
    return this.bound["$" + name];
  };


  RuntimeContext.prototype.evaluate = function (expr) {
    switch (expr[0]) {
      case "Apply":
        this.counter[0]++;
        if (this.counter[0] > RuntimeContext.LIMIT) {
          throw new EvaluationException("Time Limit Exceeded");
        }
        var v1 = this.evaluate(expr[1]);
        if (typeof v1 === "function") {
          return v1(this.evaluate(expr[2]));
        }
        throw new EvaluationException("Trying to call non-function");
      case "Lambda":
        return function (ctx, name, body) {
          ctx = new RuntimeContext(ctx);
          return function (arg) {
            return ctx.evaluateWith(name, arg, body);
          }
        }(this, expr[1], expr[2]);
      case "Num":
        return bigInt(expr[1]);
      case "Ident":
        if ("$" + expr[1] in this.bound) {
          return this.bound["$" + expr[1]];
        } else {
          throw new EvaluationException("Unbound name '" + expr[1] + "'");
        }
    }
  };

  RuntimeContext.prototype.evaluateWith = function (name, arg, body) {
    this.bound["$" + name] = arg;
    try {
      return this.evaluate(body);
    } finally {
      delete this.bound["$" + name];
    }
  };

  RuntimeContext.LIMIT = 500000;

  RuntimeContext.PREDEFINED = Object.create(null);
  RuntimeContext.PREDEFINED["$true"] = true;
  RuntimeContext.PREDEFINED["$false"] = false;
  RuntimeContext.PREDEFINED["$add"] = function (a) {
    return function (b) {
      return a.add(b);
    };
  };
  RuntimeContext.PREDEFINED["$sub"] = function (a) {
    return function (b) {
      return a.subtract(b);
    };
  };
  RuntimeContext.PREDEFINED["$mul"] = function (a) {
    return function (b) {
      return a.multiply(b);
    };
  };
  RuntimeContext.PREDEFINED["$div"] = function (a) {
    return function (b) {
      return a.divide(b);
    };
  };
  RuntimeContext.PREDEFINED["$less"] = function (a) {
    return function (b) {
      return a.lesser(b);
    };
  };
  RuntimeContext.PREDEFINED["$cond"] = function (a) {
    return function (b) {
      return function (c) {
        return a ? b(false) : c(false);
      };
    };
  };

  global.elambda = {
    Parser: Parser,
    RuntimeContext: RuntimeContext
  };
})(this);
