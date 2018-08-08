"no use strict";
!(function(window) {
  if (typeof window.window != "undefined" && window.document)
    return;
  if (window.require && window.define)
    return;

  if (!window.console) {
    window.console = function() {
      var msgs = Array.prototype.slice.call(arguments, 0);
      postMessage({type: "log", data: msgs});
    };
    window.console.error =
      window.console.warn =
        window.console.log =
          window.console.trace = window.console;
  }
  window.window = window;
  window.ace = window;

  window.onerror = function(message, file, line, col, err) {
    postMessage({type: "error", data: {
        message: message,
        data: err.data,
        file: file,
        line: line,
        col: col,
        stack: err.stack
      }});
  };

  window.normalizeModule = function(parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf("!") !== -1) {
      var chunks = moduleName.split("!");
      return window.normalizeModule(parentId, chunks[0]) + "!" + window.normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) == ".") {
      var base = parentId.split("/").slice(0, -1).join("/");
      moduleName = (base ? base + "/" : "") + moduleName;

      while (moduleName.indexOf(".") !== -1 && previous != moduleName) {
        var previous = moduleName;
        moduleName = moduleName.replace(/^\.\//, "").replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
      }
    }

    return moduleName;
  };

  window.require = function require(parentId, id) {
    if (!id) {
      id = parentId;
      parentId = null;
    }
    if (!id.charAt)
      throw new Error("worker.js require() accepts only (parentId, id) as arguments");

    id = window.normalizeModule(parentId, id);

    var module = window.require.modules[id];
    if (module) {
      if (!module.initialized) {
        module.initialized = true;
        module.exports = module.factory().exports;
      }
      return module.exports;
    }

    if (!window.require.tlns)
      return console.log("unable to load " + id);

    var path = resolveModuleId(id, window.require.tlns);
    if (path.slice(-3) != ".js") path += ".js";

    window.require.id = id;
    window.require.modules[id] = {}; // prevent infinite loop on broken modules
    importScripts(path);
    return window.require(parentId, id);
  };
  function resolveModuleId(id, paths) {
    var testPath = id, tail = "";
    while (testPath) {
      var alias = paths[testPath];
      if (typeof alias == "string") {
        return alias + tail;
      } else if (alias) {
        return  alias.location.replace(/\/*$/, "/") + (tail || alias.main || alias.name);
      } else if (alias === false) {
        return "";
      }
      var i = testPath.lastIndexOf("/");
      if (i === -1) break;
      tail = testPath.substr(i) + tail;
      testPath = testPath.slice(0, i);
    }
    return id;
  }
  window.require.modules = {};
  window.require.tlns = {};

  window.define = function(id, deps, factory) {
    if (arguments.length == 2) {
      factory = deps;
      if (typeof id != "string") {
        deps = id;
        id = window.require.id;
      }
    } else if (arguments.length == 1) {
      factory = id;
      deps = [];
      id = window.require.id;
    }

    if (typeof factory != "function") {
      window.require.modules[id] = {
        exports: factory,
        initialized: true
      };
      return;
    }

    if (!deps.length)
    // If there is no dependencies, we inject "require", "exports" and
    // "module" as dependencies, to provide CommonJS compatibility.
      deps = ["require", "exports", "module"];

    var req = function(childId) {
      return window.require(id, childId);
    };

    window.require.modules[id] = {
      exports: {},
      factory: function() {
        var module = this;
        var returnExports = factory.apply(this, deps.map(function(dep) {
          switch (dep) {
            // Because "require", "exports" and "module" aren't actual
            // dependencies, we must handle them seperately.
            case "require": return req;
            case "exports": return module.exports;
            case "module":  return module;
            // But for all other dependencies, we can just go ahead and
            // require them.
            default:        return req(dep);
          }
        }));
        if (returnExports)
          module.exports = returnExports;
        return module;
      }
    };
  };
  window.define.amd = {};
  require.tlns = {};
  window.initBaseUrls  = function initBaseUrls(topLevelNamespaces) {
    for (var i in topLevelNamespaces)
      require.tlns[i] = topLevelNamespaces[i];
  };

  window.initSender = function initSender() {

    var EventEmitter = window.require("ace/lib/event_emitter").EventEmitter;
    var oop = window.require("ace/lib/oop");

    var Sender = function() {};

    (function() {

      oop.implement(this, EventEmitter);

      this.callback = function(data, callbackId) {
        postMessage({
          type: "call",
          id: callbackId,
          data: data
        });
      };

      this.emit = function(name, data) {
        postMessage({
          type: "event",
          name: name,
          data: data
        });
      };

    }).call(Sender.prototype);

    return new Sender();
  };

  var main = window.main = null;
  var sender = window.sender = null;

  window.onmessage = function(e) {
    var msg = e.data;
    if (msg.event && sender) {
      sender._signal(msg.event, msg.data);
    }
    else if (msg.command) {
      if (main[msg.command])
        main[msg.command].apply(main, msg.args);
      else if (window[msg.command])
        window[msg.command].apply(window, msg.args);
      else
        throw new Error("Unknown command:" + msg.command);
    }
    else if (msg.init) {
      window.initBaseUrls(msg.tlns);
      require("ace/lib/es5-shim");
      sender = window.sender = window.initSender();
      var clazz = require(msg.module)[msg.classname];
      main = window.main = new clazz(sender);
    }
  };
})(this);

ace.define("ace/lib/oop",[], function(require, exports, module) {
  "use strict";

  exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };

  exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
      obj[key] = mixin[key];
    }
    return obj;
  };

  exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
  };

});

ace.define("ace/range",[], function(require, exports, module) {
  "use strict";
  var comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
  };
  var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
      row: startRow,
      column: startColumn
    };

    this.end = {
      row: endRow,
      column: endColumn
    };
  };

  (function() {
    this.isEqual = function(range) {
      return this.start.row === range.start.row &&
        this.end.row === range.end.row &&
        this.start.column === range.start.column &&
        this.end.column === range.end.column;
    };
    this.toString = function() {
      return ("Range: [" + this.start.row + "/" + this.start.column +
        "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
      return this.compare(row, column) == 0;
    };
    this.compareRange = function(range) {
      var cmp,
        end = range.end,
        start = range.start;

      cmp = this.compare(end.row, end.column);
      if (cmp == 1) {
        cmp = this.compare(start.row, start.column);
        if (cmp == 1) {
          return 2;
        } else if (cmp == 0) {
          return 1;
        } else {
          return 0;
        }
      } else if (cmp == -1) {
        return -2;
      } else {
        cmp = this.compare(start.row, start.column);
        if (cmp == -1) {
          return -1;
        } else if (cmp == 1) {
          return 42;
        } else {
          return 0;
        }
      }
    };
    this.comparePoint = function(p) {
      return this.compare(p.row, p.column);
    };
    this.containsRange = function(range) {
      return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function(range) {
      var cmp = this.compareRange(range);
      return (cmp == -1 || cmp == 0 || cmp == 1);
    };
    this.isEnd = function(row, column) {
      return this.end.row == row && this.end.column == column;
    };
    this.isStart = function(row, column) {
      return this.start.row == row && this.start.column == column;
    };
    this.setStart = function(row, column) {
      if (typeof row == "object") {
        this.start.column = row.column;
        this.start.row = row.row;
      } else {
        this.start.row = row;
        this.start.column = column;
      }
    };
    this.setEnd = function(row, column) {
      if (typeof row == "object") {
        this.end.column = row.column;
        this.end.row = row.row;
      } else {
        this.end.row = row;
        this.end.column = column;
      }
    };
    this.inside = function(row, column) {
      if (this.compare(row, column) == 0) {
        if (this.isEnd(row, column) || this.isStart(row, column)) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    this.insideStart = function(row, column) {
      if (this.compare(row, column) == 0) {
        if (this.isEnd(row, column)) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    this.insideEnd = function(row, column) {
      if (this.compare(row, column) == 0) {
        if (this.isStart(row, column)) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    this.compare = function(row, column) {
      if (!this.isMultiLine()) {
        if (row === this.start.row) {
          return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
        }
      }

      if (row < this.start.row)
        return -1;

      if (row > this.end.row)
        return 1;

      if (this.start.row === row)
        return column >= this.start.column ? 0 : -1;

      if (this.end.row === row)
        return column <= this.end.column ? 0 : 1;

      return 0;
    };
    this.compareStart = function(row, column) {
      if (this.start.row == row && this.start.column == column) {
        return -1;
      } else {
        return this.compare(row, column);
      }
    };
    this.compareEnd = function(row, column) {
      if (this.end.row == row && this.end.column == column) {
        return 1;
      } else {
        return this.compare(row, column);
      }
    };
    this.compareInside = function(row, column) {
      if (this.end.row == row && this.end.column == column) {
        return 1;
      } else if (this.start.row == row && this.start.column == column) {
        return -1;
      } else {
        return this.compare(row, column);
      }
    };
    this.clipRows = function(firstRow, lastRow) {
      if (this.end.row > lastRow)
        var end = {row: lastRow + 1, column: 0};
      else if (this.end.row < firstRow)
        var end = {row: firstRow, column: 0};

      if (this.start.row > lastRow)
        var start = {row: lastRow + 1, column: 0};
      else if (this.start.row < firstRow)
        var start = {row: firstRow, column: 0};

      return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function(row, column) {
      var cmp = this.compare(row, column);

      if (cmp == 0)
        return this;
      else if (cmp == -1)
        var start = {row: row, column: column};
      else
        var end = {row: row, column: column};

      return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
      return (this.start.row === this.end.row && this.start.column === this.end.column);
    };
    this.isMultiLine = function() {
      return (this.start.row !== this.end.row);
    };
    this.clone = function() {
      return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function() {
      if (this.end.column == 0)
        return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0);
      else
        return new Range(this.start.row, 0, this.end.row, 0);
    };
    this.toScreenRange = function(session) {
      var screenPosStart = session.documentToScreenPosition(this.start);
      var screenPosEnd = session.documentToScreenPosition(this.end);

      return new Range(
        screenPosStart.row, screenPosStart.column,
        screenPosEnd.row, screenPosEnd.column
      );
    };
    this.moveBy = function(row, column) {
      this.start.row += row;
      this.start.column += column;
      this.end.row += row;
      this.end.column += column;
    };

  }).call(Range.prototype);
  Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
  };
  Range.comparePoints = comparePoints;

  Range.comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
  };


  exports.Range = Range;
});

ace.define("ace/apply_delta",[], function(require, exports, module) {
  "use strict";

  function throwDeltaError(delta, errorText){
    console.log("Invalid Delta:", delta);
    throw "Invalid Delta: " + errorText;
  }

  function positionInDocument(docLines, position) {
    return position.row    >= 0 && position.row    <  docLines.length &&
      position.column >= 0 && position.column <= docLines[position.row].length;
  }

  function validateDelta(docLines, delta) {
    if (delta.action != "insert" && delta.action != "remove")
      throwDeltaError(delta, "delta.action must be 'insert' or 'remove'");
    if (!(delta.lines instanceof Array))
      throwDeltaError(delta, "delta.lines must be an Array");
    if (!delta.start || !delta.end)
      throwDeltaError(delta, "delta.start/end must be an present");
    var start = delta.start;
    if (!positionInDocument(docLines, delta.start))
      throwDeltaError(delta, "delta.start must be contained in document");
    var end = delta.end;
    if (delta.action == "remove" && !positionInDocument(docLines, end))
      throwDeltaError(delta, "delta.end must contained in document for 'remove' actions");
    var numRangeRows = end.row - start.row;
    var numRangeLastLineChars = (end.column - (numRangeRows == 0 ? start.column : 0));
    if (numRangeRows != delta.lines.length - 1 || delta.lines[numRangeRows].length != numRangeLastLineChars)
      throwDeltaError(delta, "delta.range must match delta lines");
  }

  exports.applyDelta = function(docLines, delta, doNotValidate) {
    var row = delta.start.row;
    var startColumn = delta.start.column;
    var line = docLines[row] || "";
    switch (delta.action) {
      case "insert":
        var lines = delta.lines;
        if (lines.length === 1) {
          docLines[row] = line.substring(0, startColumn) + delta.lines[0] + line.substring(startColumn);
        } else {
          var args = [row, 1].concat(delta.lines);
          docLines.splice.apply(docLines, args);
          docLines[row] = line.substring(0, startColumn) + docLines[row];
          docLines[row + delta.lines.length - 1] += line.substring(startColumn);
        }
        break;
      case "remove":
        var endColumn = delta.end.column;
        var endRow = delta.end.row;
        if (row === endRow) {
          docLines[row] = line.substring(0, startColumn) + line.substring(endColumn);
        } else {
          docLines.splice(
            row, endRow - row + 1,
            line.substring(0, startColumn) + docLines[endRow].substring(endColumn)
          );
        }
        break;
    }
  };
});

ace.define("ace/lib/event_emitter",[], function(require, exports, module) {
  "use strict";

  var EventEmitter = {};
  var stopPropagation = function() { this.propagationStopped = true; };
  var preventDefault = function() { this.defaultPrevented = true; };

  EventEmitter._emit =
    EventEmitter._dispatchEvent = function(eventName, e) {
      this._eventRegistry || (this._eventRegistry = {});
      this._defaultHandlers || (this._defaultHandlers = {});

      var listeners = this._eventRegistry[eventName] || [];
      var defaultHandler = this._defaultHandlers[eventName];
      if (!listeners.length && !defaultHandler)
        return;

      if (typeof e != "object" || !e)
        e = {};

      if (!e.type)
        e.type = eventName;
      if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
      if (!e.preventDefault)
        e.preventDefault = preventDefault;

      listeners = listeners.slice();
      for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
          break;
      }

      if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
    };


  EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
      return;
    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++)
      listeners[i](e, this);
  };

  EventEmitter.once = function(eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
      _self.removeEventListener(eventName, newCallback);
      callback.apply(null, arguments);
    });
  };


  EventEmitter.setDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers;
    if (!handlers)
      handlers = this._defaultHandlers = {_disabled_: {}};

    if (handlers[eventName]) {
      var old = handlers[eventName];
      var disabled = handlers._disabled_[eventName];
      if (!disabled)
        handlers._disabled_[eventName] = disabled = [];
      disabled.push(old);
      var i = disabled.indexOf(callback);
      if (i != -1)
        disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
  };
  EventEmitter.removeDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers;
    if (!handlers)
      return;
    var disabled = handlers._disabled_[eventName];

    if (handlers[eventName] == callback) {
      var old = handlers[eventName];
      if (disabled)
        this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
      var i = disabled.indexOf(callback);
      if (i != -1)
        disabled.splice(i, 1);
    }
  };

  EventEmitter.on =
    EventEmitter.addEventListener = function(eventName, callback, capturing) {
      this._eventRegistry = this._eventRegistry || {};

      var listeners = this._eventRegistry[eventName];
      if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

      if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
      return callback;
    };

  EventEmitter.off =
    EventEmitter.removeListener =
      EventEmitter.removeEventListener = function(eventName, callback) {
        this._eventRegistry = this._eventRegistry || {};

        var listeners = this._eventRegistry[eventName];
        if (!listeners)
          return;

        var index = listeners.indexOf(callback);
        if (index !== -1)
          listeners.splice(index, 1);
      };

  EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
  };

  exports.EventEmitter = EventEmitter;

});

ace.define("ace/anchor",[], function(require, exports, module) {
  "use strict";

  var oop = require("./lib/oop");
  var EventEmitter = require("./lib/event_emitter").EventEmitter;

  var Anchor = exports.Anchor = function(doc, row, column) {
    this.$onChange = this.onChange.bind(this);
    this.attach(doc);

    if (typeof column == "undefined")
      this.setPosition(row.row, row.column);
    else
      this.setPosition(row, column);
  };

  (function() {

    oop.implement(this, EventEmitter);
    this.getPosition = function() {
      return this.$clipPositionToDocument(this.row, this.column);
    };
    this.getDocument = function() {
      return this.document;
    };
    this.$insertRight = false;
    this.onChange = function(delta) {
      if (delta.start.row == delta.end.row && delta.start.row != this.row)
        return;

      if (delta.start.row > this.row)
        return;

      var point = $getTransformedPoint(delta, {row: this.row, column: this.column}, this.$insertRight);
      this.setPosition(point.row, point.column, true);
    };

    function $pointsInOrder(point1, point2, equalPointsInOrder) {
      var bColIsAfter = equalPointsInOrder ? point1.column <= point2.column : point1.column < point2.column;
      return (point1.row < point2.row) || (point1.row == point2.row && bColIsAfter);
    }

    function $getTransformedPoint(delta, point, moveIfEqual) {
      var deltaIsInsert = delta.action == "insert";
      var deltaRowShift = (deltaIsInsert ? 1 : -1) * (delta.end.row    - delta.start.row);
      var deltaColShift = (deltaIsInsert ? 1 : -1) * (delta.end.column - delta.start.column);
      var deltaStart = delta.start;
      var deltaEnd = deltaIsInsert ? deltaStart : delta.end; // Collapse insert range.
      if ($pointsInOrder(point, deltaStart, moveIfEqual)) {
        return {
          row: point.row,
          column: point.column
        };
      }
      if ($pointsInOrder(deltaEnd, point, !moveIfEqual)) {
        return {
          row: point.row + deltaRowShift,
          column: point.column + (point.row == deltaEnd.row ? deltaColShift : 0)
        };
      }
      return {
        row: deltaStart.row,
        column: deltaStart.column
      };
    }
    this.setPosition = function(row, column, noClip) {
      var pos;
      if (noClip) {
        pos = {
          row: row,
          column: column
        };
      } else {
        pos = this.$clipPositionToDocument(row, column);
      }

      if (this.row == pos.row && this.column == pos.column)
        return;

      var old = {
        row: this.row,
        column: this.column
      };

      this.row = pos.row;
      this.column = pos.column;
      this._signal("change", {
        old: old,
        value: pos
      });
    };
    this.detach = function() {
      this.document.removeEventListener("change", this.$onChange);
    };
    this.attach = function(doc) {
      this.document = doc || this.document;
      this.document.on("change", this.$onChange);
    };
    this.$clipPositionToDocument = function(row, column) {
      var pos = {};

      if (row >= this.document.getLength()) {
        pos.row = Math.max(0, this.document.getLength() - 1);
        pos.column = this.document.getLine(pos.row).length;
      }
      else if (row < 0) {
        pos.row = 0;
        pos.column = 0;
      }
      else {
        pos.row = row;
        pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
      }

      if (column < 0)
        pos.column = 0;

      return pos;
    };

  }).call(Anchor.prototype);

});

ace.define("ace/document",[], function(require, exports, module) {
  "use strict";

  var oop = require("./lib/oop");
  var applyDelta = require("./apply_delta").applyDelta;
  var EventEmitter = require("./lib/event_emitter").EventEmitter;
  var Range = require("./range").Range;
  var Anchor = require("./anchor").Anchor;

  var Document = function(textOrLines) {
    this.$lines = [""];
    if (textOrLines.length === 0) {
      this.$lines = [""];
    } else if (Array.isArray(textOrLines)) {
      this.insertMergedLines({row: 0, column: 0}, textOrLines);
    } else {
      this.insert({row: 0, column:0}, textOrLines);
    }
  };

  (function() {

    oop.implement(this, EventEmitter);
    this.setValue = function(text) {
      var len = this.getLength() - 1;
      this.remove(new Range(0, 0, len, this.getLine(len).length));
      this.insert({row: 0, column: 0}, text);
    };
    this.getValue = function() {
      return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function(row, column) {
      return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length === 0) {
      this.$split = function(text) {
        return text.replace(/\r\n|\r/g, "\n").split("\n");
      };
    } else {
      this.$split = function(text) {
        return text.split(/\r\n|\r|\n/);
      };
    }


    this.$detectNewLine = function(text) {
      var match = text.match(/^.*?(\r\n|\r|\n)/m);
      this.$autoNewLine = match ? match[1] : "\n";
      this._signal("changeNewLineMode");
    };
    this.getNewLineCharacter = function() {
      switch (this.$newLineMode) {
        case "windows":
          return "\r\n";
        case "unix":
          return "\n";
        default:
          return this.$autoNewLine || "\n";
      }
    };

    this.$autoNewLine = "";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
      if (this.$newLineMode === newLineMode)
        return;

      this.$newLineMode = newLineMode;
      this._signal("changeNewLineMode");
    };
    this.getNewLineMode = function() {
      return this.$newLineMode;
    };
    this.isNewLine = function(text) {
      return (text == "\r\n" || text == "\r" || text == "\n");
    };
    this.getLine = function(row) {
      return this.$lines[row] || "";
    };
    this.getLines = function(firstRow, lastRow) {
      return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function() {
      return this.getLines(0, this.getLength());
    };
    this.getLength = function() {
      return this.$lines.length;
    };
    this.getTextRange = function(range) {
      return this.getLinesForRange(range).join(this.getNewLineCharacter());
    };
    this.getLinesForRange = function(range) {
      var lines;
      if (range.start.row === range.end.row) {
        lines = [this.getLine(range.start.row).substring(range.start.column, range.end.column)];
      } else {
        lines = this.getLines(range.start.row, range.end.row);
        lines[0] = (lines[0] || "").substring(range.start.column);
        var l = lines.length - 1;
        if (range.end.row - range.start.row == l)
          lines[l] = lines[l].substring(0, range.end.column);
      }
      return lines;
    };
    this.insertLines = function(row, lines) {
      console.warn("Use of document.insertLines is deprecated. Use the insertFullLines method instead.");
      return this.insertFullLines(row, lines);
    };
    this.removeLines = function(firstRow, lastRow) {
      console.warn("Use of document.removeLines is deprecated. Use the removeFullLines method instead.");
      return this.removeFullLines(firstRow, lastRow);
    };
    this.insertNewLine = function(position) {
      console.warn("Use of document.insertNewLine is deprecated. Use insertMergedLines(position, ['', '']) instead.");
      return this.insertMergedLines(position, ["", ""]);
    };
    this.insert = function(position, text) {
      if (this.getLength() <= 1)
        this.$detectNewLine(text);

      return this.insertMergedLines(position, this.$split(text));
    };
    this.insertInLine = function(position, text) {
      var start = this.clippedPos(position.row, position.column);
      var end = this.pos(position.row, position.column + text.length);

      this.applyDelta({
        start: start,
        end: end,
        action: "insert",
        lines: [text]
      }, true);

      return this.clonePos(end);
    };

    this.clippedPos = function(row, column) {
      var length = this.getLength();
      if (row === undefined) {
        row = length;
      } else if (row < 0) {
        row = 0;
      } else if (row >= length) {
        row = length - 1;
        column = undefined;
      }
      var line = this.getLine(row);
      if (column == undefined)
        column = line.length;
      column = Math.min(Math.max(column, 0), line.length);
      return {row: row, column: column};
    };

    this.clonePos = function(pos) {
      return {row: pos.row, column: pos.column};
    };

    this.pos = function(row, column) {
      return {row: row, column: column};
    };

    this.$clipPosition = function(position) {
      var length = this.getLength();
      if (position.row >= length) {
        position.row = Math.max(0, length - 1);
        position.column = this.getLine(length - 1).length;
      } else {
        position.row = Math.max(0, position.row);
        position.column = Math.min(Math.max(position.column, 0), this.getLine(position.row).length);
      }
      return position;
    };
    this.insertFullLines = function(row, lines) {
      row = Math.min(Math.max(row, 0), this.getLength());
      var column = 0;
      if (row < this.getLength()) {
        lines = lines.concat([""]);
        column = 0;
      } else {
        lines = [""].concat(lines);
        row--;
        column = this.$lines[row].length;
      }
      this.insertMergedLines({row: row, column: column}, lines);
    };
    this.insertMergedLines = function(position, lines) {
      var start = this.clippedPos(position.row, position.column);
      var end = {
        row: start.row + lines.length - 1,
        column: (lines.length == 1 ? start.column : 0) + lines[lines.length - 1].length
      };

      this.applyDelta({
        start: start,
        end: end,
        action: "insert",
        lines: lines
      });

      return this.clonePos(end);
    };
    this.remove = function(range) {
      var start = this.clippedPos(range.start.row, range.start.column);
      var end = this.clippedPos(range.end.row, range.end.column);
      this.applyDelta({
        start: start,
        end: end,
        action: "remove",
        lines: this.getLinesForRange({start: start, end: end})
      });
      return this.clonePos(start);
    };
    this.removeInLine = function(row, startColumn, endColumn) {
      var start = this.clippedPos(row, startColumn);
      var end = this.clippedPos(row, endColumn);

      this.applyDelta({
        start: start,
        end: end,
        action: "remove",
        lines: this.getLinesForRange({start: start, end: end})
      }, true);

      return this.clonePos(start);
    };
    this.removeFullLines = function(firstRow, lastRow) {
      firstRow = Math.min(Math.max(0, firstRow), this.getLength() - 1);
      lastRow  = Math.min(Math.max(0, lastRow ), this.getLength() - 1);
      var deleteFirstNewLine = lastRow == this.getLength() - 1 && firstRow > 0;
      var deleteLastNewLine  = lastRow  < this.getLength() - 1;
      var startRow = ( deleteFirstNewLine ? firstRow - 1                  : firstRow                    );
      var startCol = ( deleteFirstNewLine ? this.getLine(startRow).length : 0                           );
      var endRow   = ( deleteLastNewLine  ? lastRow + 1                   : lastRow                     );
      var endCol   = ( deleteLastNewLine  ? 0                             : this.getLine(endRow).length );
      var range = new Range(startRow, startCol, endRow, endCol);
      var deletedLines = this.$lines.slice(firstRow, lastRow + 1);

      this.applyDelta({
        start: range.start,
        end: range.end,
        action: "remove",
        lines: this.getLinesForRange(range)
      });
      return deletedLines;
    };
    this.removeNewLine = function(row) {
      if (row < this.getLength() - 1 && row >= 0) {
        this.applyDelta({
          start: this.pos(row, this.getLine(row).length),
          end: this.pos(row + 1, 0),
          action: "remove",
          lines: ["", ""]
        });
      }
    };
    this.replace = function(range, text) {
      if (!(range instanceof Range))
        range = Range.fromPoints(range.start, range.end);
      if (text.length === 0 && range.isEmpty())
        return range.start;
      if (text == this.getTextRange(range))
        return range.end;

      this.remove(range);
      var end;
      if (text) {
        end = this.insert(range.start, text);
      }
      else {
        end = range.start;
      }

      return end;
    };
    this.applyDeltas = function(deltas) {
      for (var i=0; i<deltas.length; i++) {
        this.applyDelta(deltas[i]);
      }
    };
    this.revertDeltas = function(deltas) {
      for (var i=deltas.length-1; i>=0; i--) {
        this.revertDelta(deltas[i]);
      }
    };
    this.applyDelta = function(delta, doNotValidate) {
      var isInsert = delta.action == "insert";
      if (isInsert ? delta.lines.length <= 1 && !delta.lines[0]
        : !Range.comparePoints(delta.start, delta.end)) {
        return;
      }

      if (isInsert && delta.lines.length > 20000) {
        this.$splitAndapplyLargeDelta(delta, 20000);
      }
      else {
        applyDelta(this.$lines, delta, doNotValidate);
        this._signal("change", delta);
      }
    };

    this.$splitAndapplyLargeDelta = function(delta, MAX) {
      var lines = delta.lines;
      var l = lines.length - MAX + 1;
      var row = delta.start.row;
      var column = delta.start.column;
      for (var from = 0, to = 0; from < l; from = to) {
        to += MAX - 1;
        var chunk = lines.slice(from, to);
        chunk.push("");
        this.applyDelta({
          start: this.pos(row + from, column),
          end: this.pos(row + to, column = 0),
          action: delta.action,
          lines: chunk
        }, true);
      }
      delta.lines = lines.slice(from);
      delta.start.row = row + from;
      delta.start.column = column;
      this.applyDelta(delta, true);
    };
    this.revertDelta = function(delta) {
      this.applyDelta({
        start: this.clonePos(delta.start),
        end: this.clonePos(delta.end),
        action: (delta.action == "insert" ? "remove" : "insert"),
        lines: delta.lines.slice()
      });
    };
    this.indexToPosition = function(index, startRow) {
      var lines = this.$lines || this.getAllLines();
      var newlineLength = this.getNewLineCharacter().length;
      for (var i = startRow || 0, l = lines.length; i < l; i++) {
        index -= lines[i].length + newlineLength;
        if (index < 0)
          return {row: i, column: index + lines[i].length + newlineLength};
      }
      return {row: l-1, column: index + lines[l-1].length + newlineLength};
    };
    this.positionToIndex = function(pos, startRow) {
      var lines = this.$lines || this.getAllLines();
      var newlineLength = this.getNewLineCharacter().length;
      var index = 0;
      var row = Math.min(pos.row, lines.length);
      for (var i = startRow || 0; i < row; ++i)
        index += lines[i].length + newlineLength;

      return index + pos.column;
    };

  }).call(Document.prototype);

  exports.Document = Document;
});

ace.define("ace/lib/lang",[], function(require, exports, module) {
  "use strict";

  exports.last = function(a) {
    return a[a.length - 1];
  };

  exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
  };

  exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
      if (count & 1)
        result += string;

      if (count >>= 1)
        string += string;
    }
    return result;
  };

  var trimBeginRegexp = /^\s\s*/;
  var trimEndRegexp = /\s\s*$/;

  exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
  };

  exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
  };

  exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
      copy[key] = obj[key];
    }
    return copy;
  };

  exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
      if (array[i] && typeof array[i] == "object")
        copy[i] = this.copyObject(array[i]);
      else
        copy[i] = array[i];
    }
    return copy;
  };

  exports.deepCopy = function deepCopy(obj) {
    if (typeof obj !== "object" || !obj)
      return obj;
    var copy;
    if (Array.isArray(obj)) {
      copy = [];
      for (var key = 0; key < obj.length; key++) {
        copy[key] = deepCopy(obj[key]);
      }
      return copy;
    }
    if (Object.prototype.toString.call(obj) !== "[object Object]")
      return obj;

    copy = {};
    for (var key in obj)
      copy[key] = deepCopy(obj[key]);
    return copy;
  };

  exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
      map[arr[i]] = 1;
    }
    return map;

  };

  exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
      map[i] = props[i];
    }
    return map;
  };
  exports.arrayRemove = function(array, value) {
    for (var i = 0; i <= array.length; i++) {
      if (value === array[i]) {
        array.splice(i, 1);
      }
    }
  };

  exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
  };

  exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
  };

  exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
      matches.push({
        offset: arguments[arguments.length-2],
        length: str.length
      });
    });

    return matches;
  };
  exports.deferredCall = function(fcn) {
    var timer = null;
    var callback = function() {
      timer = null;
      fcn();
    };

    var deferred = function(timeout) {
      deferred.cancel();
      timer = setTimeout(callback, timeout || 0);
      return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
      this.cancel();
      fcn();
      return deferred;
    };

    deferred.cancel = function() {
      clearTimeout(timer);
      timer = null;
      return deferred;
    };

    deferred.isPending = function() {
      return timer;
    };

    return deferred;
  };


  exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
      timer = null;
      fcn();
    };

    var _self = function(timeout) {
      if (timer == null)
        timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
      timer && clearTimeout(timer);
      timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
      this.cancel();
      fcn();
    };

    _self.cancel = function() {
      timer && clearTimeout(timer);
      timer = null;
    };

    _self.isPending = function() {
      return timer;
    };

    return _self;
  };
});

ace.define("ace/worker/mirror",[], function(require, exports, module) {
  "use strict";

  var Range = require("../range").Range;
  var Document = require("../document").Document;
  var lang = require("../lib/lang");

  var Mirror = exports.Mirror = function(sender) {
    this.sender = sender;
    var doc = this.doc = new Document("");

    var deferredUpdate = this.deferredUpdate = lang.delayedCall(this.onUpdate.bind(this));

    var _self = this;
    sender.on("change", function(e) {
      var data = e.data;
      if (data[0].start) {
        doc.applyDeltas(data);
      } else {
        for (var i = 0; i < data.length; i += 2) {
          if (Array.isArray(data[i+1])) {
            var d = {action: "insert", start: data[i], lines: data[i+1]};
          } else {
            var d = {action: "remove", start: data[i], end: data[i+1]};
          }
          doc.applyDelta(d, true);
        }
      }
      if (_self.$timeout)
        return deferredUpdate.schedule(_self.$timeout);
      _self.onUpdate();
    });
  };

  (function() {

    this.$timeout = 500;

    this.setTimeout = function(timeout) {
      this.$timeout = timeout;
    };

    this.setValue = function(value) {
      this.doc.setValue(value);
      this.deferredUpdate.schedule(this.$timeout);
    };

    this.getValue = function(callbackId) {
      this.sender.callback(this.doc.getValue(), callbackId);
    };

    this.onUpdate = function() {
    };

    this.isPending = function() {
      return this.deferredUpdate.isPending();
    };

  }).call(Mirror.prototype);

});

ace.define("ace/mode/json/json_parse",[], function(require, exports, module) {
  "use strict";
  var at,     // The index of the current character
    ch,     // The current character
    escapee = {
      '"':  '"',
      '\\': '\\',
      '/':  '/',
      b:    '\b',
      f:    '\f',
      n:    '\n',
      r:    '\r',
      t:    '\t'
    },
    text,

    error = function (m) {
      throw {
        name:    'SyntaxError',
        message: m,
        at:      at,
        text:    text
      };
    },

    next = function (c) {
      if (c && c !== ch) {
        error("Expected '" + c + "' instead of '" + ch + "'");
      }
      ch = text.charAt(at);
      at += 1;
      return ch;
    },

    number = function () {
      var number,
        string = '';

      if (ch === '-') {
        string = '-';
        next('-');
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
      }
      if (ch === '.') {
        string += '.';
        while (next() && ch >= '0' && ch <= '9') {
          string += ch;
        }
      }
      if (ch === 'e' || ch === 'E') {
        string += ch;
        next();
        if (ch === '-' || ch === '+') {
          string += ch;
          next();
        }
        while (ch >= '0' && ch <= '9') {
          string += ch;
          next();
        }
      }
      number = +string;
      if (isNaN(number)) {
        error("Bad number");
      } else {
        return number;
      }
    },

    string = function () {
      var hex,
        i,
        string = '',
        uffff;
      if (ch === '"') {
        while (next()) {
          if (ch === '"') {
            next();
            return string;
          } else if (ch === '\\') {
            next();
            if (ch === 'u') {
              uffff = 0;
              for (i = 0; i < 4; i += 1) {
                hex = parseInt(next(), 16);
                if (!isFinite(hex)) {
                  break;
                }
                uffff = uffff * 16 + hex;
              }
              string += String.fromCharCode(uffff);
            } else if (typeof escapee[ch] === 'string') {
              string += escapee[ch];
            } else {
              break;
            }
          } else if (ch == "\n" || ch == "\r") {
            break;
          } else {
            string += ch;
          }
        }
      }
      error("Bad string");
    },

    white = function () {
      while (ch && ch <= ' ') {
        next();
      }
    },

    word = function () {
      switch (ch) {
        case 't':
          next('t');
          next('r');
          next('u');
          next('e');
          return true;
        case 'f':
          next('f');
          next('a');
          next('l');
          next('s');
          next('e');
          return false;
        case 'n':
          next('n');
          next('u');
          next('l');
          next('l');
          return null;
      }
      error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {
      var array = [];

      if (ch === '[') {
        next('[');
        white();
        if (ch === ']') {
          next(']');
          return array;   // empty array
        }
        while (ch) {
          array.push(value());
          white();
          if (ch === ']') {
            next(']');
            return array;
          }
          next(',');
          white();
        }
      }
      error("Bad array");
    },

    object = function () {
      var key,
        object = {};

      if (ch === '{') {
        next('{');
        white();
        if (ch === '}') {
          next('}');
          return object;   // empty object
        }
        while (ch) {
          key = string();
          white();
          next(':');
          if (Object.hasOwnProperty.call(object, key)) {
            error('Duplicate key "' + key + '"');
          }
          object[key] = value();
          white();
          if (ch === '}') {
            next('}');
            return object;
          }
          next(',');
          white();
        }
      }
      error("Bad object");
    };

  value = function () {
    white();
    switch (ch) {
      case '{':
        return object();
      case '[':
        return array();
      case '"':
        return string();
      case '-':
        return number();
      default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
  };
  return function (source, reviver) {
    var result;

    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
      error("Syntax error");
    }
    return typeof reviver === 'function' ? function walk(holder, key) {
      var k, v, value = holder[key];
      if (value && typeof value === 'object') {
        for (k in value) {
          if (Object.hasOwnProperty.call(value, k)) {
            v = walk(value, k);
            if (v !== undefined) {
              value[k] = v;
            } else {
              delete value[k];
            }
          }
        }
      }
      return reviver.call(holder, key, value);
    }({'': result}, '') : result;
  };
});

ace.define("ace/mode/aladdin/js-yaml", [], function(require, exports, module) {
  return function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).jsyaml=e()}}(function(){return function o(a,s,c){function u(t,e){if(!s[t]){if(!a[t]){var n="function"==typeof require&&require;if(!e&&n)return n(t,!0);if(l)return l(t,!0);var i=new Error("Cannot find module '"+t+"'");throw i.code="MODULE_NOT_FOUND",i}var r=s[t]={exports:{}};a[t][0].call(r.exports,function(e){return u(a[t][1][e]||e)},r,r.exports,o,a,s,c)}return s[t].exports}for(var l="function"==typeof require&&require,e=0;e<c.length;e++)u(c[e]);return u}({1:[function(e,t,n){"use strict";var i=e("./js-yaml/loader"),r=e("./js-yaml/dumper");function o(e){return function(){throw new Error("Function "+e+" is deprecated and cannot be used.")}}t.exports.Type=e("./js-yaml/type"),t.exports.Schema=e("./js-yaml/schema"),t.exports.FAILSAFE_SCHEMA=e("./js-yaml/schema/failsafe"),t.exports.JSON_SCHEMA=e("./js-yaml/schema/json"),t.exports.CORE_SCHEMA=e("./js-yaml/schema/core"),t.exports.DEFAULT_SAFE_SCHEMA=e("./js-yaml/schema/default_safe"),t.exports.DEFAULT_FULL_SCHEMA=e("./js-yaml/schema/default_full"),t.exports.load=i.load,t.exports.loadAll=i.loadAll,t.exports.safeLoad=i.safeLoad,t.exports.safeLoadAll=i.safeLoadAll,t.exports.dump=r.dump,t.exports.safeDump=r.safeDump,t.exports.YAMLException=e("./js-yaml/exception"),t.exports.MINIMAL_SCHEMA=e("./js-yaml/schema/failsafe"),t.exports.SAFE_SCHEMA=e("./js-yaml/schema/default_safe"),t.exports.DEFAULT_SCHEMA=e("./js-yaml/schema/default_full"),t.exports.scan=o("scan"),t.exports.parse=o("parse"),t.exports.compose=o("compose"),t.exports.addConstructor=o("addConstructor")},{"./js-yaml/dumper":3,"./js-yaml/exception":4,"./js-yaml/loader":5,"./js-yaml/schema":7,"./js-yaml/schema/core":8,"./js-yaml/schema/default_full":9,"./js-yaml/schema/default_safe":10,"./js-yaml/schema/failsafe":11,"./js-yaml/schema/json":12,"./js-yaml/type":13}],2:[function(e,t,n){"use strict";function i(e){return null==e}t.exports.isNothing=i,t.exports.isObject=function(e){return"object"==typeof e&&null!==e},t.exports.toArray=function(e){return Array.isArray(e)?e:i(e)?[]:[e]},t.exports.repeat=function(e,t){var n,i="";for(n=0;n<t;n+=1)i+=e;return i},t.exports.isNegativeZero=function(e){return 0===e&&Number.NEGATIVE_INFINITY===1/e},t.exports.extend=function(e,t){var n,i,r,o;if(t)for(n=0,i=(o=Object.keys(t)).length;n<i;n+=1)e[r=o[n]]=t[r];return e}},{}],3:[function(e,t,n){"use strict";var c=e("./common"),d=e("./exception"),i=e("./schema/default_full"),r=e("./schema/default_safe"),l=Object.prototype.toString,u=Object.prototype.hasOwnProperty,o=9,h=10,a=32,m=33,g=34,y=35,x=37,v=38,A=39,b=42,w=44,C=45,k=58,j=62,S=63,I=64,E=91,O=93,F=96,_=123,N=124,M=125,s={0:"\\0",7:"\\a",8:"\\b",9:"\\t",10:"\\n",11:"\\v",12:"\\f",13:"\\r",27:"\\e",34:'\\"',92:"\\\\",133:"\\N",160:"\\_",8232:"\\L",8233:"\\P"},p=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"];function f(e){var t,n,i;if(t=e.toString(16).toUpperCase(),e<=255)n="x",i=2;else if(e<=65535)n="u",i=4;else{if(!(e<=4294967295))throw new d("code point within a string may not be greater than 0xFFFFFFFF");n="U",i=8}return"\\"+n+c.repeat("0",i-t.length)+t}function T(e){this.schema=e.schema||i,this.indent=Math.max(1,e.indent||2),this.skipInvalid=e.skipInvalid||!1,this.flowLevel=c.isNothing(e.flowLevel)?-1:e.flowLevel,this.styleMap=function(e,t){var n,i,r,o,a,s,c;if(null===t)return{};for(n={},r=0,o=(i=Object.keys(t)).length;r<o;r+=1)a=i[r],s=String(t[a]),"!!"===a.slice(0,2)&&(a="tag:yaml.org,2002:"+a.slice(2)),(c=e.compiledTypeMap.fallback[a])&&u.call(c.styleAliases,s)&&(s=c.styleAliases[s]),n[a]=s;return n}(this.schema,e.styles||null),this.sortKeys=e.sortKeys||!1,this.lineWidth=e.lineWidth||80,this.noRefs=e.noRefs||!1,this.noCompatMode=e.noCompatMode||!1,this.condenseFlow=e.condenseFlow||!1,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function L(e,t){for(var n,i=c.repeat(" ",t),r=0,o=-1,a="",s=e.length;r<s;)-1===(o=e.indexOf("\n",r))?(n=e.slice(r),r=s):(n=e.slice(r,o+1),r=o+1),n.length&&"\n"!==n&&(a+=i),a+=n;return a}function D(e,t){return"\n"+c.repeat(" ",e.indent*t)}function U(e){return e===a||e===o}function q(e){return 32<=e&&e<=126||161<=e&&e<=55295&&8232!==e&&8233!==e||57344<=e&&e<=65533&&65279!==e||65536<=e&&e<=1114111}function Y(e){return q(e)&&65279!==e&&e!==w&&e!==E&&e!==O&&e!==_&&e!==M&&e!==k&&e!==y}function R(e){return/^\n* /.test(e)}var B=1,P=2,W=3,K=4,$=5;function H(e,t,n,i,r){var o,a,s,c=!1,u=!1,l=-1!==i,p=-1,f=q(s=e.charCodeAt(0))&&65279!==s&&!U(s)&&s!==C&&s!==S&&s!==k&&s!==w&&s!==E&&s!==O&&s!==_&&s!==M&&s!==y&&s!==v&&s!==b&&s!==m&&s!==N&&s!==j&&s!==A&&s!==g&&s!==x&&s!==I&&s!==F&&!U(e.charCodeAt(e.length-1));if(t)for(o=0;o<e.length;o++){if(!q(a=e.charCodeAt(o)))return $;f=f&&Y(a)}else{for(o=0;o<e.length;o++){if((a=e.charCodeAt(o))===h)c=!0,l&&(u=u||i<o-p-1&&" "!==e[p+1],p=o);else if(!q(a))return $;f=f&&Y(a)}u=u||l&&i<o-p-1&&" "!==e[p+1]}return c||u?9<n&&R(e)?$:u?K:W:f&&!r(e)?B:P}function G(i,r,o,a){i.dump=function(){if(0===r.length)return"''";if(!i.noCompatMode&&-1!==p.indexOf(r))return"'"+r+"'";var e=i.indent*Math.max(1,o),t=-1===i.lineWidth?-1:Math.max(Math.min(i.lineWidth,40),i.lineWidth-e),n=a||-1<i.flowLevel&&o>=i.flowLevel;switch(H(r,n,i.indent,t,function(e){return function(e,t){var n,i;for(n=0,i=e.implicitTypes.length;n<i;n+=1)if(e.implicitTypes[n].resolve(t))return!0;return!1}(i,e)})){case B:return r;case P:return"'"+r.replace(/'/g,"''")+"'";case W:return"|"+V(r,i.indent)+Z(L(r,e));case K:return">"+V(r,i.indent)+Z(L(function(e,t){var n,i,r=/(\n+)([^\n]*)/g,o=(s=e.indexOf("\n"),s=-1!==s?s:e.length,r.lastIndex=s,z(e.slice(0,s),t)),a="\n"===e[0]||" "===e[0];var s;for(;i=r.exec(e);){var c=i[1],u=i[2];n=" "===u[0],o+=c+(a||n||""===u?"":"\n")+z(u,t),a=n}return o}(r,t),e));case $:return'"'+function(e){for(var t,n,i,r="",o=0;o<e.length;o++)55296<=(t=e.charCodeAt(o))&&t<=56319&&56320<=(n=e.charCodeAt(o+1))&&n<=57343?(r+=f(1024*(t-55296)+n-56320+65536),o++):(i=s[t],r+=!i&&q(t)?e[o]:i||f(t));return r}(r)+'"';default:throw new d("impossible error: invalid scalar style")}}()}function V(e,t){var n=R(e)?String(t):"",i="\n"===e[e.length-1];return n+(i&&("\n"===e[e.length-2]||"\n"===e)?"+":i?"":"-")+"\n"}function Z(e){return"\n"===e[e.length-1]?e.slice(0,-1):e}function z(e,t){if(""===e||" "===e[0])return e;for(var n,i,r=/ [^ ]/g,o=0,a=0,s=0,c="";n=r.exec(e);)t<(s=n.index)-o&&(i=o<a?a:s,c+="\n"+e.slice(o,i),o=i+1),a=s;return c+="\n",e.length-o>t&&o<a?c+=e.slice(o,a)+"\n"+e.slice(a+1):c+=e.slice(o),c.slice(1)}function J(e,t,n){var i,r,o,a,s,c;for(o=0,a=(r=n?e.explicitTypes:e.implicitTypes).length;o<a;o+=1)if(((s=r[o]).instanceOf||s.predicate)&&(!s.instanceOf||"object"==typeof t&&t instanceof s.instanceOf)&&(!s.predicate||s.predicate(t))){if(e.tag=n?s.tag:"?",s.represent){if(c=e.styleMap[s.tag]||s.defaultStyle,"[object Function]"===l.call(s.represent))i=s.represent(t,c);else{if(!u.call(s.represent,c))throw new d("!<"+s.tag+'> tag resolver accepts not "'+c+'" style');i=s.represent[c](t,c)}e.dump=i}return!0}return!1}function Q(e,t,n,i,r,o){e.tag=null,e.dump=n,J(e,n,!1)||J(e,n,!0);var a=l.call(e.dump);i&&(i=e.flowLevel<0||e.flowLevel>t);var s,c,u="[object Object]"===a||"[object Array]"===a;if(u&&(c=-1!==(s=e.duplicates.indexOf(n))),(null!==e.tag&&"?"!==e.tag||c||2!==e.indent&&0<t)&&(r=!1),c&&e.usedDuplicates[s])e.dump="*ref_"+s;else{if(u&&c&&!e.usedDuplicates[s]&&(e.usedDuplicates[s]=!0),"[object Object]"===a)i&&0!==Object.keys(e.dump).length?(!function(e,t,n,i){var r,o,a,s,c,u,l="",p=e.tag,f=Object.keys(n);if(!0===e.sortKeys)f.sort();else if("function"==typeof e.sortKeys)f.sort(e.sortKeys);else if(e.sortKeys)throw new d("sortKeys must be a boolean or a function");for(r=0,o=f.length;r<o;r+=1)u="",i&&0===r||(u+=D(e,t)),s=n[a=f[r]],Q(e,t+1,a,!0,!0,!0)&&((c=null!==e.tag&&"?"!==e.tag||e.dump&&1024<e.dump.length)&&(e.dump&&h===e.dump.charCodeAt(0)?u+="?":u+="? "),u+=e.dump,c&&(u+=D(e,t)),Q(e,t+1,s,!0,c)&&(e.dump&&h===e.dump.charCodeAt(0)?u+=":":u+=": ",l+=u+=e.dump));e.tag=p,e.dump=l||"{}"}(e,t,e.dump,r),c&&(e.dump="&ref_"+s+e.dump)):(!function(e,t,n){var i,r,o,a,s,c="",u=e.tag,l=Object.keys(n);for(i=0,r=l.length;i<r;i+=1)s=e.condenseFlow?'"':"",0!==i&&(s+=", "),a=n[o=l[i]],Q(e,t,o,!1,!1)&&(1024<e.dump.length&&(s+="? "),s+=e.dump+(e.condenseFlow?'"':"")+":"+(e.condenseFlow?"":" "),Q(e,t,a,!1,!1)&&(c+=s+=e.dump));e.tag=u,e.dump="{"+c+"}"}(e,t,e.dump),c&&(e.dump="&ref_"+s+" "+e.dump));else if("[object Array]"===a)i&&0!==e.dump.length?(!function(e,t,n,i){var r,o,a="",s=e.tag;for(r=0,o=n.length;r<o;r+=1)Q(e,t+1,n[r],!0,!0)&&(i&&0===r||(a+=D(e,t)),e.dump&&h===e.dump.charCodeAt(0)?a+="-":a+="- ",a+=e.dump);e.tag=s,e.dump=a||"[]"}(e,t,e.dump,r),c&&(e.dump="&ref_"+s+e.dump)):(!function(e,t,n){var i,r,o="",a=e.tag;for(i=0,r=n.length;i<r;i+=1)Q(e,t,n[i],!1,!1)&&(0!==i&&(o+=","+(e.condenseFlow?"":" ")),o+=e.dump);e.tag=a,e.dump="["+o+"]"}(e,t,e.dump),c&&(e.dump="&ref_"+s+" "+e.dump));else{if("[object String]"!==a){if(e.skipInvalid)return!1;throw new d("unacceptable kind of an object to dump "+a)}"?"!==e.tag&&G(e,e.dump,t,o)}null!==e.tag&&"?"!==e.tag&&(e.dump="!<"+e.tag+"> "+e.dump)}return!0}function X(e,t){var n,i,r=[],o=[];for(function e(t,n,i){var r,o,a;if(null!==t&&"object"==typeof t)if(-1!==(o=n.indexOf(t)))-1===i.indexOf(o)&&i.push(o);else if(n.push(t),Array.isArray(t))for(o=0,a=t.length;o<a;o+=1)e(t[o],n,i);else for(r=Object.keys(t),o=0,a=r.length;o<a;o+=1)e(t[r[o]],n,i)}(e,r,o),n=0,i=o.length;n<i;n+=1)t.duplicates.push(r[o[n]]);t.usedDuplicates=new Array(i)}function ee(e,t){var n=new T(t=t||{});return n.noRefs||X(e,n),Q(n,0,e,!0,!0)?n.dump+"\n":""}t.exports.dump=ee,t.exports.safeDump=function(e,t){return ee(e,c.extend({schema:r},t))}},{"./common":2,"./exception":4,"./schema/default_full":9,"./schema/default_safe":10}],4:[function(e,t,n){"use strict";function i(e,t){Error.call(this),this.name="YAMLException",this.reason=e,this.mark=t,this.message=(this.reason||"(unknown reason)")+(this.mark?" "+this.mark.toString():""),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=(new Error).stack||""}((i.prototype=Object.create(Error.prototype)).constructor=i).prototype.toString=function(e){var t=this.name+": ";return t+=this.reason||"(unknown reason)",!e&&this.mark&&(t+=" "+this.mark.toString()),t},t.exports=i},{}],5:[function(e,t,n){"use strict";var g=e("./common"),i=e("./exception"),r=e("./mark"),o=e("./schema/default_safe"),a=e("./schema/default_full"),y=Object.prototype.hasOwnProperty,x=1,v=2,A=3,b=4,w=1,C=2,k=3,c=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,s=/[\x85\u2028\u2029]/,u=/[,\[\]\{\}]/,l=/^(?:!|!!|![a-z\-]+!)$/i,p=/^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;function j(e){return 10===e||13===e}function S(e){return 9===e||32===e}function I(e){return 9===e||32===e||10===e||13===e}function E(e){return 44===e||91===e||93===e||123===e||125===e}function f(e){return 48===e?"\0":97===e?"":98===e?"\b":116===e?"\t":9===e?"\t":110===e?"\n":118===e?"\v":102===e?"\f":114===e?"\r":101===e?"":32===e?" ":34===e?'"':47===e?"/":92===e?"\\":78===e?"":95===e?" ":76===e?"\u2028":80===e?"\u2029":""}for(var O=new Array(256),F=new Array(256),d=0;d<256;d++)O[d]=f(d)?1:0,F[d]=f(d);function h(e,t){this.input=e,this.filename=t.filename||null,this.schema=t.schema||a,this.onWarning=t.onWarning||null,this.legacy=t.legacy||!1,this.json=t.json||!1,this.listener=t.listener||null,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=e.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.documents=[]}function m(e,t){return new i(t,new r(e.filename,e.input,e.position,e.line,e.position-e.lineStart))}function _(e,t){throw m(e,t)}function N(e,t){e.onWarning&&e.onWarning.call(null,m(e,t))}var M={YAML:function(e,t,n){var i,r,o;null!==e.version&&_(e,"duplication of %YAML directive"),1!==n.length&&_(e,"YAML directive accepts exactly one argument"),null===(i=/^([0-9]+)\.([0-9]+)$/.exec(n[0]))&&_(e,"ill-formed argument of the YAML directive"),r=parseInt(i[1],10),o=parseInt(i[2],10),1!==r&&_(e,"unacceptable YAML version of the document"),e.version=n[0],e.checkLineBreaks=o<2,1!==o&&2!==o&&N(e,"unsupported YAML version of the document")},TAG:function(e,t,n){var i,r;2!==n.length&&_(e,"TAG directive accepts exactly two arguments"),i=n[0],r=n[1],l.test(i)||_(e,"ill-formed tag handle (first argument) of the TAG directive"),y.call(e.tagMap,i)&&_(e,'there is a previously declared suffix for "'+i+'" tag handle'),p.test(r)||_(e,"ill-formed tag prefix (second argument) of the TAG directive"),e.tagMap[i]=r}};function T(e,t,n,i){var r,o,a,s;if(t<n){if(s=e.input.slice(t,n),i)for(r=0,o=s.length;r<o;r+=1)9===(a=s.charCodeAt(r))||32<=a&&a<=1114111||_(e,"expected valid JSON character");else c.test(s)&&_(e,"the stream contains non-printable characters");e.result+=s}}function L(e,t,n,i){var r,o,a,s;for(g.isObject(n)||_(e,"cannot merge mappings; the provided source object is unacceptable"),a=0,s=(r=Object.keys(n)).length;a<s;a+=1)o=r[a],y.call(t,o)||(t[o]=n[o],i[o]=!0)}function D(e,t,n,i,r,o,a,s){var c,u;if(r=String(r),null===t&&(t={}),"tag:yaml.org,2002:merge"===i)if(Array.isArray(o))for(c=0,u=o.length;c<u;c+=1)L(e,t,o[c],n);else L(e,t,o,n);else e.json||y.call(n,r)||!y.call(t,r)||(e.line=a||e.line,e.position=s||e.position,_(e,"duplicated mapping key")),t[r]=o,delete n[r];return t}function U(e){var t;10===(t=e.input.charCodeAt(e.position))?e.position++:13===t?(e.position++,10===e.input.charCodeAt(e.position)&&e.position++):_(e,"a line break is expected"),e.line+=1,e.lineStart=e.position}function q(e,t,n){for(var i=0,r=e.input.charCodeAt(e.position);0!==r;){for(;S(r);)r=e.input.charCodeAt(++e.position);if(t&&35===r)for(;10!==(r=e.input.charCodeAt(++e.position))&&13!==r&&0!==r;);if(!j(r))break;for(U(e),r=e.input.charCodeAt(e.position),i++,e.lineIndent=0;32===r;)e.lineIndent++,r=e.input.charCodeAt(++e.position)}return-1!==n&&0!==i&&e.lineIndent<n&&N(e,"deficient indentation"),i}function Y(e){var t,n=e.position;return!(45!==(t=e.input.charCodeAt(n))&&46!==t||t!==e.input.charCodeAt(n+1)||t!==e.input.charCodeAt(n+2)||(n+=3,0!==(t=e.input.charCodeAt(n))&&!I(t)))}function R(e,t){1===t?e.result+=" ":1<t&&(e.result+=g.repeat("\n",t-1))}function B(e,t){var n,i,r=e.tag,o=e.anchor,a=[],s=!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=a),i=e.input.charCodeAt(e.position);0!==i&&45===i&&I(e.input.charCodeAt(e.position+1));)if(s=!0,e.position++,q(e,!0,-1)&&e.lineIndent<=t)a.push(null),i=e.input.charCodeAt(e.position);else if(n=e.line,K(e,t,A,!1,!0),a.push(e.result),q(e,!0,-1),i=e.input.charCodeAt(e.position),(e.line===n||e.lineIndent>t)&&0!==i)_(e,"bad indentation of a sequence entry");else if(e.lineIndent<t)break;return!!s&&(e.tag=r,e.anchor=o,e.kind="sequence",e.result=a,!0)}function P(e){var t,n,i,r,o=!1,a=!1;if(33!==(r=e.input.charCodeAt(e.position)))return!1;if(null!==e.tag&&_(e,"duplication of a tag property"),60===(r=e.input.charCodeAt(++e.position))?(o=!0,r=e.input.charCodeAt(++e.position)):33===r?(a=!0,n="!!",r=e.input.charCodeAt(++e.position)):n="!",t=e.position,o){for(;0!==(r=e.input.charCodeAt(++e.position))&&62!==r;);e.position<e.length?(i=e.input.slice(t,e.position),r=e.input.charCodeAt(++e.position)):_(e,"unexpected end of the stream within a verbatim tag")}else{for(;0!==r&&!I(r);)33===r&&(a?_(e,"tag suffix cannot contain exclamation marks"):(n=e.input.slice(t-1,e.position+1),l.test(n)||_(e,"named tag handle cannot contain such characters"),a=!0,t=e.position+1)),r=e.input.charCodeAt(++e.position);i=e.input.slice(t,e.position),u.test(i)&&_(e,"tag suffix cannot contain flow indicator characters")}return i&&!p.test(i)&&_(e,"tag name cannot contain such characters: "+i),o?e.tag=i:y.call(e.tagMap,n)?e.tag=e.tagMap[n]+i:"!"===n?e.tag="!"+i:"!!"===n?e.tag="tag:yaml.org,2002:"+i:_(e,'undeclared tag handle "'+n+'"'),!0}function W(e){var t,n;if(38!==(n=e.input.charCodeAt(e.position)))return!1;for(null!==e.anchor&&_(e,"duplication of an anchor property"),n=e.input.charCodeAt(++e.position),t=e.position;0!==n&&!I(n)&&!E(n);)n=e.input.charCodeAt(++e.position);return e.position===t&&_(e,"name of an anchor node must contain at least one character"),e.anchor=e.input.slice(t,e.position),!0}function K(e,t,n,i,r){var o,a,s,c,u,l,p,f,d=1,h=!1,m=!1;if(null!==e.listener&&e.listener("open",e),e.tag=null,e.anchor=null,e.kind=null,e.result=null,o=a=s=b===n||A===n,i&&q(e,!0,-1)&&(h=!0,e.lineIndent>t?d=1:e.lineIndent===t?d=0:e.lineIndent<t&&(d=-1)),1===d)for(;P(e)||W(e);)q(e,!0,-1)?(h=!0,s=o,e.lineIndent>t?d=1:e.lineIndent===t?d=0:e.lineIndent<t&&(d=-1)):s=!1;if(s&&(s=h||r),1!==d&&b!==n||(p=x===n||v===n?t:t+1,f=e.position-e.lineStart,1===d?s&&(B(e,f)||function(e,t,n){var i,r,o,a,s,c=e.tag,u=e.anchor,l={},p={},f=null,d=null,h=null,m=!1,g=!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=l),s=e.input.charCodeAt(e.position);0!==s;){if(i=e.input.charCodeAt(e.position+1),o=e.line,a=e.position,63!==s&&58!==s||!I(i)){if(!K(e,n,v,!1,!0))break;if(e.line===o){for(s=e.input.charCodeAt(e.position);S(s);)s=e.input.charCodeAt(++e.position);if(58===s)I(s=e.input.charCodeAt(++e.position))||_(e,"a whitespace character is expected after the key-value separator within a block mapping"),m&&(D(e,l,p,f,d,null),f=d=h=null),r=m=!(g=!0),f=e.tag,d=e.result;else{if(!g)return e.tag=c,e.anchor=u,!0;_(e,"can not read an implicit mapping pair; a colon is missed")}}else{if(!g)return e.tag=c,e.anchor=u,!0;_(e,"can not read a block mapping entry; a multiline key may not be an implicit key")}}else 63===s?(m&&(D(e,l,p,f,d,null),f=d=h=null),r=m=g=!0):m?r=!(m=!1):_(e,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),e.position+=1,s=i;if((e.line===o||e.lineIndent>t)&&(K(e,t,b,!0,r)&&(m?d=e.result:h=e.result),m||(D(e,l,p,f,d,h,o,a),f=d=h=null),q(e,!0,-1),s=e.input.charCodeAt(e.position)),e.lineIndent>t&&0!==s)_(e,"bad indentation of a mapping entry");else if(e.lineIndent<t)break}return m&&D(e,l,p,f,d,null),g&&(e.tag=c,e.anchor=u,e.kind="mapping",e.result=l),g}(e,f,p))||function(e,t){var n,i,r,o,a,s,c,u,l,p,f=!0,d=e.tag,h=e.anchor,m={};if(91===(p=e.input.charCodeAt(e.position)))s=!(r=93),i=[];else{if(123!==p)return!1;r=125,s=!0,i={}}for(null!==e.anchor&&(e.anchorMap[e.anchor]=i),p=e.input.charCodeAt(++e.position);0!==p;){if(q(e,!0,t),(p=e.input.charCodeAt(e.position))===r)return e.position++,e.tag=d,e.anchor=h,e.kind=s?"mapping":"sequence",e.result=i,!0;f||_(e,"missed comma between flow collection entries"),l=null,o=a=!1,63===p&&I(e.input.charCodeAt(e.position+1))&&(o=a=!0,e.position++,q(e,!0,t)),n=e.line,K(e,t,x,!1,!0),u=e.tag,c=e.result,q(e,!0,t),p=e.input.charCodeAt(e.position),!a&&e.line!==n||58!==p||(o=!0,p=e.input.charCodeAt(++e.position),q(e,!0,t),K(e,t,x,!1,!0),l=e.result),s?D(e,i,m,u,c,l):o?i.push(D(e,null,m,u,c,l)):i.push(c),q(e,!0,t),44===(p=e.input.charCodeAt(e.position))?(f=!0,p=e.input.charCodeAt(++e.position)):f=!1}_(e,"unexpected end of the stream within a flow collection")}(e,p)?m=!0:(a&&function(e,t){var n,i,r,o,a,s=w,c=!1,u=!1,l=t,p=0,f=!1;if(124===(o=e.input.charCodeAt(e.position)))i=!1;else{if(62!==o)return!1;i=!0}for(e.kind="scalar",e.result="";0!==o;)if(43===(o=e.input.charCodeAt(++e.position))||45===o)w===s?s=43===o?k:C:_(e,"repeat of a chomping mode identifier");else{if(!(0<=(r=48<=(a=o)&&a<=57?a-48:-1)))break;0===r?_(e,"bad explicit indentation width of a block scalar; it cannot be less than one"):u?_(e,"repeat of an indentation width identifier"):(l=t+r-1,u=!0)}if(S(o)){for(;S(o=e.input.charCodeAt(++e.position)););if(35===o)for(;!j(o=e.input.charCodeAt(++e.position))&&0!==o;);}for(;0!==o;){for(U(e),e.lineIndent=0,o=e.input.charCodeAt(e.position);(!u||e.lineIndent<l)&&32===o;)e.lineIndent++,o=e.input.charCodeAt(++e.position);if(!u&&e.lineIndent>l&&(l=e.lineIndent),j(o))p++;else{if(e.lineIndent<l){s===k?e.result+=g.repeat("\n",c?1+p:p):s===w&&c&&(e.result+="\n");break}for(i?S(o)?(f=!0,e.result+=g.repeat("\n",c?1+p:p)):f?(f=!1,e.result+=g.repeat("\n",p+1)):0===p?c&&(e.result+=" "):e.result+=g.repeat("\n",p):e.result+=g.repeat("\n",c?1+p:p),u=c=!0,p=0,n=e.position;!j(o)&&0!==o;)o=e.input.charCodeAt(++e.position);T(e,n,e.position,!1)}}return!0}(e,p)||function(e,t){var n,i,r;if(39!==(n=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,i=r=e.position;0!==(n=e.input.charCodeAt(e.position));)if(39===n){if(T(e,i,e.position,!0),39!==(n=e.input.charCodeAt(++e.position)))return!0;i=e.position,e.position++,r=e.position}else j(n)?(T(e,i,r,!0),R(e,q(e,!1,t)),i=r=e.position):e.position===e.lineStart&&Y(e)?_(e,"unexpected end of the document within a single quoted scalar"):(e.position++,r=e.position);_(e,"unexpected end of the stream within a single quoted scalar")}(e,p)||function(e,t){var n,i,r,o,a,s,c,u,l,p;if(34!==(s=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,n=i=e.position;0!==(s=e.input.charCodeAt(e.position));){if(34===s)return T(e,n,e.position,!0),e.position++,!0;if(92===s){if(T(e,n,e.position,!0),j(s=e.input.charCodeAt(++e.position)))q(e,!1,t);else if(s<256&&O[s])e.result+=F[s],e.position++;else if(0<(a=120===(p=s)?2:117===p?4:85===p?8:0)){for(r=a,o=0;0<r;r--)s=e.input.charCodeAt(++e.position),l=void 0,0<=(a=48<=(u=s)&&u<=57?u-48:97<=(l=32|u)&&l<=102?l-97+10:-1)?o=(o<<4)+a:_(e,"expected hexadecimal character");e.result+=(c=o)<=65535?String.fromCharCode(c):String.fromCharCode(55296+(c-65536>>10),56320+(c-65536&1023)),e.position++}else _(e,"unknown escape sequence");n=i=e.position}else j(s)?(T(e,n,i,!0),R(e,q(e,!1,t)),n=i=e.position):e.position===e.lineStart&&Y(e)?_(e,"unexpected end of the document within a double quoted scalar"):(e.position++,i=e.position)}_(e,"unexpected end of the stream within a double quoted scalar")}(e,p)?m=!0:!function(e){var t,n,i;if(42!==(i=e.input.charCodeAt(e.position)))return!1;for(i=e.input.charCodeAt(++e.position),t=e.position;0!==i&&!I(i)&&!E(i);)i=e.input.charCodeAt(++e.position);return e.position===t&&_(e,"name of an alias node must contain at least one character"),n=e.input.slice(t,e.position),e.anchorMap.hasOwnProperty(n)||_(e,'unidentified alias "'+n+'"'),e.result=e.anchorMap[n],q(e,!0,-1),!0}(e)?function(e,t,n){var i,r,o,a,s,c,u,l,p=e.kind,f=e.result;if(I(l=e.input.charCodeAt(e.position))||E(l)||35===l||38===l||42===l||33===l||124===l||62===l||39===l||34===l||37===l||64===l||96===l)return!1;if((63===l||45===l)&&(I(i=e.input.charCodeAt(e.position+1))||n&&E(i)))return!1;for(e.kind="scalar",e.result="",r=o=e.position,a=!1;0!==l;){if(58===l){if(I(i=e.input.charCodeAt(e.position+1))||n&&E(i))break}else if(35===l){if(I(e.input.charCodeAt(e.position-1)))break}else{if(e.position===e.lineStart&&Y(e)||n&&E(l))break;if(j(l)){if(s=e.line,c=e.lineStart,u=e.lineIndent,q(e,!1,-1),e.lineIndent>=t){a=!0,l=e.input.charCodeAt(e.position);continue}e.position=o,e.line=s,e.lineStart=c,e.lineIndent=u;break}}a&&(T(e,r,o,!1),R(e,e.line-s),r=o=e.position,a=!1),S(l)||(o=e.position+1),l=e.input.charCodeAt(++e.position)}return T(e,r,o,!1),!!e.result||(e.kind=p,e.result=f,!1)}(e,p,x===n)&&(m=!0,null===e.tag&&(e.tag="?")):(m=!0,null===e.tag&&null===e.anchor||_(e,"alias node should not have any properties")),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):0===d&&(m=s&&B(e,f))),null!==e.tag&&"!"!==e.tag)if("?"===e.tag){for(c=0,u=e.implicitTypes.length;c<u;c+=1)if((l=e.implicitTypes[c]).resolve(e.result)){e.result=l.construct(e.result),e.tag=l.tag,null!==e.anchor&&(e.anchorMap[e.anchor]=e.result);break}}else y.call(e.typeMap[e.kind||"fallback"],e.tag)?(l=e.typeMap[e.kind||"fallback"][e.tag],null!==e.result&&l.kind!==e.kind&&_(e,"unacceptable node kind for !<"+e.tag+'> tag; it should be "'+l.kind+'", not "'+e.kind+'"'),l.resolve(e.result)?(e.result=l.construct(e.result),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):_(e,"cannot resolve a node with !<"+e.tag+"> explicit tag")):_(e,"unknown tag !<"+e.tag+">");return null!==e.listener&&e.listener("close",e),null!==e.tag||null!==e.anchor||m}function $(e){var t,n,i,r,o=e.position,a=!1;for(e.version=null,e.checkLineBreaks=e.legacy,e.tagMap={},e.anchorMap={};0!==(r=e.input.charCodeAt(e.position))&&(q(e,!0,-1),r=e.input.charCodeAt(e.position),!(0<e.lineIndent||37!==r));){for(a=!0,r=e.input.charCodeAt(++e.position),t=e.position;0!==r&&!I(r);)r=e.input.charCodeAt(++e.position);for(i=[],(n=e.input.slice(t,e.position)).length<1&&_(e,"directive name must not be less than one character in length");0!==r;){for(;S(r);)r=e.input.charCodeAt(++e.position);if(35===r){for(;0!==(r=e.input.charCodeAt(++e.position))&&!j(r););break}if(j(r))break;for(t=e.position;0!==r&&!I(r);)r=e.input.charCodeAt(++e.position);i.push(e.input.slice(t,e.position))}0!==r&&U(e),y.call(M,n)?M[n](e,n,i):N(e,'unknown document directive "'+n+'"')}q(e,!0,-1),0===e.lineIndent&&45===e.input.charCodeAt(e.position)&&45===e.input.charCodeAt(e.position+1)&&45===e.input.charCodeAt(e.position+2)?(e.position+=3,q(e,!0,-1)):a&&_(e,"directives end mark is expected"),K(e,e.lineIndent-1,b,!1,!0),q(e,!0,-1),e.checkLineBreaks&&s.test(e.input.slice(o,e.position))&&N(e,"non-ASCII line breaks are interpreted as content"),e.documents.push(e.result),e.position===e.lineStart&&Y(e)?46===e.input.charCodeAt(e.position)&&(e.position+=3,q(e,!0,-1)):e.position<e.length-1&&_(e,"end of the stream or a document separator is expected")}function H(e,t){t=t||{},0!==(e=String(e)).length&&(10!==e.charCodeAt(e.length-1)&&13!==e.charCodeAt(e.length-1)&&(e+="\n"),65279===e.charCodeAt(0)&&(e=e.slice(1)));var n=new h(e,t);for(n.input+="\0";32===n.input.charCodeAt(n.position);)n.lineIndent+=1,n.position+=1;for(;n.position<n.length-1;)$(n);return n.documents}function G(e,t,n){var i,r,o=H(e,n);if("function"!=typeof t)return o;for(i=0,r=o.length;i<r;i+=1)t(o[i])}function V(e,t){var n=H(e,t);if(0!==n.length){if(1===n.length)return n[0];throw new i("expected a single document in the stream, but found more")}}t.exports.loadAll=G,t.exports.load=V,t.exports.safeLoadAll=function(e,t,n){if("function"!=typeof t)return G(e,g.extend({schema:o},n));G(e,t,g.extend({schema:o},n))},t.exports.safeLoad=function(e,t){return V(e,g.extend({schema:o},t))}},{"./common":2,"./exception":4,"./mark":6,"./schema/default_full":9,"./schema/default_safe":10}],6:[function(e,t,n){"use strict";var s=e("./common");function i(e,t,n,i,r){this.name=e,this.buffer=t,this.position=n,this.line=i,this.column=r}i.prototype.getSnippet=function(e,t){var n,i,r,o,a;if(!this.buffer)return null;for(e=e||4,t=t||75,n="",i=this.position;0<i&&-1==="\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(i-1));)if(i-=1,this.position-i>t/2-1){n=" ... ",i+=5;break}for(r="",o=this.position;o<this.buffer.length&&-1==="\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(o));)if((o+=1)-this.position>t/2-1){r=" ... ",o-=5;break}return a=this.buffer.slice(i,o),s.repeat(" ",e)+n+a+r+"\n"+s.repeat(" ",e+this.position-i+n.length)+"^"},i.prototype.toString=function(e){var t,n="";return this.name&&(n+='in "'+this.name+'" '),n+="at line "+(this.line+1)+", column "+(this.column+1),e||(t=this.getSnippet())&&(n+=":\n"+t),n},t.exports=i},{"./common":2}],7:[function(e,t,n){"use strict";var i=e("./common"),r=e("./exception"),o=e("./type");function a(e,t,i){var r=[];return e.include.forEach(function(e){i=a(e,t,i)}),e[t].forEach(function(n){i.forEach(function(e,t){e.tag===n.tag&&e.kind===n.kind&&r.push(t)}),i.push(n)}),i.filter(function(e,t){return-1===r.indexOf(t)})}function s(e){this.include=e.include||[],this.implicit=e.implicit||[],this.explicit=e.explicit||[],this.implicit.forEach(function(e){if(e.loadKind&&"scalar"!==e.loadKind)throw new r("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.")}),this.compiledImplicit=a(this,"implicit",[]),this.compiledExplicit=a(this,"explicit",[]),this.compiledTypeMap=function(){var e,t,n={scalar:{},sequence:{},mapping:{},fallback:{}};function i(e){n[e.kind][e.tag]=n.fallback[e.tag]=e}for(e=0,t=arguments.length;e<t;e+=1)arguments[e].forEach(i);return n}(this.compiledImplicit,this.compiledExplicit)}s.DEFAULT=null,s.create=function(){var e,t;switch(arguments.length){case 1:e=s.DEFAULT,t=arguments[0];break;case 2:e=arguments[0],t=arguments[1];break;default:throw new r("Wrong number of arguments for Schema.create function")}if(e=i.toArray(e),t=i.toArray(t),!e.every(function(e){return e instanceof s}))throw new r("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");if(!t.every(function(e){return e instanceof o}))throw new r("Specified list of YAML types (or a single Type object) contains a non-Type object.");return new s({include:e,explicit:t})},t.exports=s},{"./common":2,"./exception":4,"./type":13}],8:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({include:[e("./json")]})},{"../schema":7,"./json":12}],9:[function(e,t,n){"use strict";var i=e("../schema");t.exports=i.DEFAULT=new i({include:[e("./default_safe")],explicit:[e("../type/js/undefined"),e("../type/js/regexp"),e("../type/js/function")]})},{"../schema":7,"../type/js/function":18,"../type/js/regexp":19,"../type/js/undefined":20,"./default_safe":10}],10:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({include:[e("./core")],implicit:[e("../type/timestamp"),e("../type/merge")],explicit:[e("../type/binary"),e("../type/omap"),e("../type/pairs"),e("../type/set")]})},{"../schema":7,"../type/binary":14,"../type/merge":22,"../type/omap":24,"../type/pairs":25,"../type/set":27,"../type/timestamp":29,"./core":8}],11:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({explicit:[e("../type/str"),e("../type/seq"),e("../type/map")]})},{"../schema":7,"../type/map":21,"../type/seq":26,"../type/str":28}],12:[function(e,t,n){"use strict";var i=e("../schema");t.exports=new i({include:[e("./failsafe")],implicit:[e("../type/null"),e("../type/bool"),e("../type/int"),e("../type/float")]})},{"../schema":7,"../type/bool":15,"../type/float":16,"../type/int":17,"../type/null":23,"./failsafe":11}],13:[function(e,t,n){"use strict";var r=e("./exception"),o=["kind","resolve","construct","instanceOf","predicate","represent","defaultStyle","styleAliases"],a=["scalar","sequence","mapping"];t.exports=function(t,e){var n,i;if(e=e||{},Object.keys(e).forEach(function(e){if(-1===o.indexOf(e))throw new r('Unknown option "'+e+'" is met in definition of "'+t+'" YAML type.')}),this.tag=t,this.kind=e.kind||null,this.resolve=e.resolve||function(){return!0},this.construct=e.construct||function(e){return e},this.instanceOf=e.instanceOf||null,this.predicate=e.predicate||null,this.represent=e.represent||null,this.defaultStyle=e.defaultStyle||null,this.styleAliases=(n=e.styleAliases||null,i={},null!==n&&Object.keys(n).forEach(function(t){n[t].forEach(function(e){i[String(e)]=t})}),i),-1===a.indexOf(this.kind))throw new r('Unknown kind "'+this.kind+'" is specified for "'+t+'" YAML type.')}},{"./exception":4}],14:[function(e,t,n){"use strict";var c;try{c=e("buffer").Buffer}catch(e){}var i=e("../type"),u="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";t.exports=new i("tag:yaml.org,2002:binary",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,n,i=0,r=e.length,o=u;for(n=0;n<r;n++)if(!(64<(t=o.indexOf(e.charAt(n))))){if(t<0)return!1;i+=6}return i%8==0},construct:function(e){var t,n,i=e.replace(/[\r\n=]/g,""),r=i.length,o=u,a=0,s=[];for(t=0;t<r;t++)t%4==0&&t&&(s.push(a>>16&255),s.push(a>>8&255),s.push(255&a)),a=a<<6|o.indexOf(i.charAt(t));return 0==(n=r%4*6)?(s.push(a>>16&255),s.push(a>>8&255),s.push(255&a)):18===n?(s.push(a>>10&255),s.push(a>>2&255)):12===n&&s.push(a>>4&255),c?c.from?c.from(s):new c(s):s},predicate:function(e){return c&&c.isBuffer(e)},represent:function(e){var t,n,i="",r=0,o=e.length,a=u;for(t=0;t<o;t++)t%3==0&&t&&(i+=a[r>>18&63],i+=a[r>>12&63],i+=a[r>>6&63],i+=a[63&r]),r=(r<<8)+e[t];return 0==(n=o%3)?(i+=a[r>>18&63],i+=a[r>>12&63],i+=a[r>>6&63],i+=a[63&r]):2===n?(i+=a[r>>10&63],i+=a[r>>4&63],i+=a[r<<2&63],i+=a[64]):1===n&&(i+=a[r>>2&63],i+=a[r<<4&63],i+=a[64],i+=a[64]),i}})},{"../type":13}],15:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:bool",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t=e.length;return 4===t&&("true"===e||"True"===e||"TRUE"===e)||5===t&&("false"===e||"False"===e||"FALSE"===e)},construct:function(e){return"true"===e||"True"===e||"TRUE"===e},predicate:function(e){return"[object Boolean]"===Object.prototype.toString.call(e)},represent:{lowercase:function(e){return e?"true":"false"},uppercase:function(e){return e?"TRUE":"FALSE"},camelcase:function(e){return e?"True":"False"}},defaultStyle:"lowercase"})},{"../type":13}],16:[function(e,t,n){"use strict";var i=e("../common"),r=e("../type"),o=new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");var a=/^[-+]?[0-9]+e/;t.exports=new r("tag:yaml.org,2002:float",{kind:"scalar",resolve:function(e){return null!==e&&!(!o.test(e)||"_"===e[e.length-1])},construct:function(e){var t,n,i,r;return n="-"===(t=e.replace(/_/g,"").toLowerCase())[0]?-1:1,r=[],0<="+-".indexOf(t[0])&&(t=t.slice(1)),".inf"===t?1===n?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:".nan"===t?NaN:0<=t.indexOf(":")?(t.split(":").forEach(function(e){r.unshift(parseFloat(e,10))}),t=0,i=1,r.forEach(function(e){t+=e*i,i*=60}),n*t):n*parseFloat(t,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&(e%1!=0||i.isNegativeZero(e))},represent:function(e,t){var n;if(isNaN(e))switch(t){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===e)switch(t){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===e)switch(t){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(i.isNegativeZero(e))return"-0.0";return n=e.toString(10),a.test(n)?n.replace("e",".e"):n},defaultStyle:"lowercase"})},{"../common":2,"../type":13}],17:[function(e,t,n){"use strict";var i=e("../common"),r=e("../type");t.exports=new r("tag:yaml.org,2002:int",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,n,i,r,o=e.length,a=0,s=!1;if(!o)return!1;if("-"!==(t=e[a])&&"+"!==t||(t=e[++a]),"0"===t){if(a+1===o)return!0;if("b"===(t=e[++a])){for(a++;a<o;a++)if("_"!==(t=e[a])){if("0"!==t&&"1"!==t)return!1;s=!0}return s&&"_"!==t}if("x"===t){for(a++;a<o;a++)if("_"!==(t=e[a])){if(!(48<=(i=e.charCodeAt(a))&&i<=57||65<=i&&i<=70||97<=i&&i<=102))return!1;s=!0}return s&&"_"!==t}for(;a<o;a++)if("_"!==(t=e[a])){if(!(48<=(n=e.charCodeAt(a))&&n<=55))return!1;s=!0}return s&&"_"!==t}if("_"===t)return!1;for(;a<o;a++)if("_"!==(t=e[a])){if(":"===t)break;if(!(48<=(r=e.charCodeAt(a))&&r<=57))return!1;s=!0}return!(!s||"_"===t)&&(":"!==t||/^(:[0-5]?[0-9])+$/.test(e.slice(a)))},construct:function(e){var t,n,i=e,r=1,o=[];return-1!==i.indexOf("_")&&(i=i.replace(/_/g,"")),"-"!==(t=i[0])&&"+"!==t||("-"===t&&(r=-1),t=(i=i.slice(1))[0]),"0"===i?0:"0"===t?"b"===i[1]?r*parseInt(i.slice(2),2):"x"===i[1]?r*parseInt(i,16):r*parseInt(i,8):-1!==i.indexOf(":")?(i.split(":").forEach(function(e){o.unshift(parseInt(e,10))}),i=0,n=1,o.forEach(function(e){i+=e*n,n*=60}),r*i):r*parseInt(i,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&e%1==0&&!i.isNegativeZero(e)},represent:{binary:function(e){return 0<=e?"0b"+e.toString(2):"-0b"+e.toString(2).slice(1)},octal:function(e){return 0<=e?"0"+e.toString(8):"-0"+e.toString(8).slice(1)},decimal:function(e){return e.toString(10)},hexadecimal:function(e){return 0<=e?"0x"+e.toString(16).toUpperCase():"-0x"+e.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}})},{"../common":2,"../type":13}],18:[function(e,t,n){"use strict";var o;try{o=e("esprima")}catch(e){"undefined"!=typeof window&&(o=window.esprima)}var i=e("../../type");t.exports=new i("tag:yaml.org,2002:js/function",{kind:"scalar",resolve:function(e){if(null===e)return!1;try{var t="("+e+")",n=o.parse(t,{range:!0});return"Program"===n.type&&1===n.body.length&&"ExpressionStatement"===n.body[0].type&&("ArrowFunctionExpression"===n.body[0].expression.type||"FunctionExpression"===n.body[0].expression.type)}catch(e){return!1}},construct:function(e){var t,n="("+e+")",i=o.parse(n,{range:!0}),r=[];if("Program"!==i.type||1!==i.body.length||"ExpressionStatement"!==i.body[0].type||"ArrowFunctionExpression"!==i.body[0].expression.type&&"FunctionExpression"!==i.body[0].expression.type)throw new Error("Failed to resolve function");return i.body[0].expression.params.forEach(function(e){r.push(e.name)}),t=i.body[0].expression.body.range,"BlockStatement"===i.body[0].expression.body.type?new Function(r,n.slice(t[0]+1,t[1]-1)):new Function(r,"return "+n.slice(t[0],t[1]))},predicate:function(e){return"[object Function]"===Object.prototype.toString.call(e)},represent:function(e){return e.toString()}})},{"../../type":13}],19:[function(e,t,n){"use strict";var i=e("../../type");t.exports=new i("tag:yaml.org,2002:js/regexp",{kind:"scalar",resolve:function(e){if(null===e)return!1;if(0===e.length)return!1;var t=e,n=/\/([gim]*)$/.exec(e),i="";if("/"===t[0]){if(n&&(i=n[1]),3<i.length)return!1;if("/"!==t[t.length-i.length-1])return!1}return!0},construct:function(e){var t=e,n=/\/([gim]*)$/.exec(e),i="";return"/"===t[0]&&(n&&(i=n[1]),t=t.slice(1,t.length-i.length-1)),new RegExp(t,i)},predicate:function(e){return"[object RegExp]"===Object.prototype.toString.call(e)},represent:function(e){var t="/"+e.source+"/";return e.global&&(t+="g"),e.multiline&&(t+="m"),e.ignoreCase&&(t+="i"),t}})},{"../../type":13}],20:[function(e,t,n){"use strict";var i=e("../../type");t.exports=new i("tag:yaml.org,2002:js/undefined",{kind:"scalar",resolve:function(){return!0},construct:function(){},predicate:function(e){return void 0===e},represent:function(){return""}})},{"../../type":13}],21:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:map",{kind:"mapping",construct:function(e){return null!==e?e:{}}})},{"../type":13}],22:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:merge",{kind:"scalar",resolve:function(e){return"<<"===e||null===e}})},{"../type":13}],23:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:null",{kind:"scalar",resolve:function(e){if(null===e)return!0;var t=e.length;return 1===t&&"~"===e||4===t&&("null"===e||"Null"===e||"NULL"===e)},construct:function(){return null},predicate:function(e){return null===e},represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"}},defaultStyle:"lowercase"})},{"../type":13}],24:[function(e,t,n){"use strict";var i=e("../type"),c=Object.prototype.hasOwnProperty,u=Object.prototype.toString;t.exports=new i("tag:yaml.org,2002:omap",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,n,i,r,o,a=[],s=e;for(t=0,n=s.length;t<n;t+=1){if(i=s[t],o=!1,"[object Object]"!==u.call(i))return!1;for(r in i)if(c.call(i,r)){if(o)return!1;o=!0}if(!o)return!1;if(-1!==a.indexOf(r))return!1;a.push(r)}return!0},construct:function(e){return null!==e?e:[]}})},{"../type":13}],25:[function(e,t,n){"use strict";var i=e("../type"),s=Object.prototype.toString;t.exports=new i("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,n,i,r,o,a=e;for(o=new Array(a.length),t=0,n=a.length;t<n;t+=1){if(i=a[t],"[object Object]"!==s.call(i))return!1;if(1!==(r=Object.keys(i)).length)return!1;o[t]=[r[0],i[r[0]]]}return!0},construct:function(e){if(null===e)return[];var t,n,i,r,o,a=e;for(o=new Array(a.length),t=0,n=a.length;t<n;t+=1)i=a[t],r=Object.keys(i),o[t]=[r[0],i[r[0]]];return o}})},{"../type":13}],26:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(e){return null!==e?e:[]}})},{"../type":13}],27:[function(e,t,n){"use strict";var i=e("../type"),r=Object.prototype.hasOwnProperty;t.exports=new i("tag:yaml.org,2002:set",{kind:"mapping",resolve:function(e){if(null===e)return!0;var t,n=e;for(t in n)if(r.call(n,t)&&null!==n[t])return!1;return!0},construct:function(e){return null!==e?e:{}}})},{"../type":13}],28:[function(e,t,n){"use strict";var i=e("../type");t.exports=new i("tag:yaml.org,2002:str",{kind:"scalar",construct:function(e){return null!==e?e:""}})},{"../type":13}],29:[function(e,t,n){"use strict";var i=e("../type"),p=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),f=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");t.exports=new i("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:function(e){return null!==e&&(null!==p.exec(e)||null!==f.exec(e))},construct:function(e){var t,n,i,r,o,a,s,c,u=0,l=null;if(null===(t=p.exec(e))&&(t=f.exec(e)),null===t)throw new Error("Date resolve error");if(n=+t[1],i=+t[2]-1,r=+t[3],!t[4])return new Date(Date.UTC(n,i,r));if(o=+t[4],a=+t[5],s=+t[6],t[7]){for(u=t[7].slice(0,3);u.length<3;)u+="0";u=+u}return t[9]&&(l=6e4*(60*+t[10]+ +(t[11]||0)),"-"===t[9]&&(l=-l)),c=new Date(Date.UTC(n,i,r,o,a,s,u)),l&&c.setTime(c.getTime()-l),c},instanceOf:Date,represent:function(e){return e.toISOString()}})},{"../type":13}],"/":[function(e,t,n){"use strict";var i=e("./lib/js-yaml.js");t.exports=i},{"./lib/js-yaml.js":1}]},{},[])("/")});
});

ace.define("ace/mode/aladdin/yaml_parse",[], function(require, exports, module) {
  "use strict";
  var yaml = require('./js-yaml');
  //dependency error checking
  var depErr = function(yamlString){
    var array = [];
    var result = [];
    array.push({ regex: /asset:\s{2,4}[^&]/ , msg: "Assets must have & symbol" });
    array.push({ regex: /dependencies:\s{2,12}[^*]/, msg: "Transactions must have * symbol" });
    var res = yamlString.split("\n");

    for( let r = 0; r < array.length; ++ r){
      let myRe = new RegExp(array[r].regex);
      for( let i = 0; i < res.length; ++i){
        if(myRe.exec(res[i])){
          result.push({type: 'error', text:  array[r].msg, range: [i+1, myRe.exec(res[i]).index+1, i+1, 0] });
          return result;
        }
      }

    }
    //checking rules that asset id and type is set for an asset
    let myRe = new RegExp(/[-]\sasset:/);
    let nameReg = new RegExp(/\s{2,8}\sname:/);
    let typeReg = new RegExp(/\s{2,8}\stype:/);
    for( let i = 0; i < res.length; ++i){
      if(myRe.exec(res[i])){
        if (!nameReg.exec(res[i+1])){
          result.push({type: 'error', text:  'Asset must be followed by key name: ', range: [i+2, myRe.exec(res[i]).index+1, i+1, 0] });
          return result;
        }
        if (!typeReg.exec(res[i+2])){
          result.push({type: 'error', text:  'Asset must be followed by keys name: type:', range: [i+3, myRe.exec(res[i]).index+1, i+1, 0] });
          return result;
        }
      }
    }

  };

  return function (yamlString){
    // Parse the yaml string and throw exceptions on error
    yaml.safeLoad(yamlString);
    // yaml syntax is correct, now perform semantic checking
    return depErr(yamlString);
  }
});

ace.define("ace/mode/aladdin_worker",[], function(require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var Mirror = require("../worker/mirror").Mirror;
  var yaml_parse = require("./aladdin/yaml_parse");

  var AladdinWorker = exports.AladdinWorker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(200);
  };

  oop.inherits(AladdinWorker, Mirror);

  (function() {

    this.onUpdate = function() {
      var value = this.doc.getValue();
      var errors = [];
      try {
        if (value)
          errors = yaml_parse(value);
      } catch (e) {
        errors.push({
          row: e.mark.line,
          column: e.mark.column,
          text: e.message,
          type: "error"
        });
      }
      this.sender.emit("annotate", errors);
    };

  }).call(AladdinWorker.prototype);

});

ace.define("ace/lib/es5-shim",[], function(require, exports, module) {

//
//
  function Empty() {}

  if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
      var target = this;
      if (typeof target != "function") {
        throw new TypeError("Function.prototype.bind called on incompatible " + target);
      }
      var args = slice.call(arguments, 1); // for normal call
      var bound = function () {

        if (this instanceof bound) {
          var result = target.apply(
            this,
            args.concat(slice.call(arguments))
          );
          if (Object(result) === result) {
            return result;
          }
          return this;

        } else {
          return target.apply(
            that,
            args.concat(slice.call(arguments))
          );

        }

      };
      if(target.prototype) {
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
      }
      //
      return bound;
    };
  }
  var call = Function.prototype.call;
  var prototypeOfArray = Array.prototype;
  var prototypeOfObject = Object.prototype;
  var slice = prototypeOfArray.slice;
  var _toString = call.bind(prototypeOfObject.toString);
  var owns = call.bind(prototypeOfObject.hasOwnProperty);
  var defineGetter;
  var defineSetter;
  var lookupGetter;
  var lookupSetter;
  var supportsAccessors;
  if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
  }

//
//
  if ([1,2].splice(0).length != 2) {
    if(function() { // test IE < 9 to splice bug - see issue #138
      function makeArray(l) {
        var a = new Array(l+2);
        a[0] = a[1] = 0;
        return a;
      }
      var array = [], lengthBefore;

      array.splice.apply(array, makeArray(20));
      array.splice.apply(array, makeArray(26));

      lengthBefore = array.length; //46
      array.splice(5, 0, "XXX"); // add one element

      lengthBefore + 1 == array.length

      if (lengthBefore + 1 == array.length) {
        return true;// has right splice implementation without bugs
      }
    }()) {//IE 6/7
      var array_splice = Array.prototype.splice;
      Array.prototype.splice = function(start, deleteCount) {
        if (!arguments.length) {
          return [];
        } else {
          return array_splice.apply(this, [
            start === void 0 ? 0 : start,
            deleteCount === void 0 ? (this.length - start) : deleteCount
          ].concat(slice.call(arguments, 2)))
        }
      };
    } else {//IE8
      Array.prototype.splice = function(pos, removeCount){
        var length = this.length;
        if (pos > 0) {
          if (pos > length)
            pos = length;
        } else if (pos == void 0) {
          pos = 0;
        } else if (pos < 0) {
          pos = Math.max(length + pos, 0);
        }

        if (!(pos+removeCount < length))
          removeCount = length - pos;

        var removed = this.slice(pos, pos+removeCount);
        var insert = slice.call(arguments, 2);
        var add = insert.length;
        if (pos === length) {
          if (add) {
            this.push.apply(this, insert);
          }
        } else {
          var remove = Math.min(removeCount, length - pos);
          var tailOldPos = pos + remove;
          var tailNewPos = tailOldPos + add - remove;
          var tailCount = length - tailOldPos;
          var lengthAfterRemove = length - remove;

          if (tailNewPos < tailOldPos) { // case A
            for (var i = 0; i < tailCount; ++i) {
              this[tailNewPos+i] = this[tailOldPos+i];
            }
          } else if (tailNewPos > tailOldPos) { // case B
            for (i = tailCount; i--; ) {
              this[tailNewPos+i] = this[tailOldPos+i];
            }
          } // else, add == remove (nothing to do)

          if (add && pos === lengthAfterRemove) {
            this.length = lengthAfterRemove; // truncate array
            this.push.apply(this, insert);
          } else {
            this.length = lengthAfterRemove + add; // reserves space
            for (i = 0; i < add; ++i) {
              this[pos+i] = insert[i];
            }
          }
        }
        return removed;
      };
    }
  }
  if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
      return _toString(obj) == "[object Array]";
    };
  }
  var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        thisp = arguments[1],
        i = -1,
        length = self.length >>> 0;
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(); // TODO message
      }

      while (++i < length) {
        if (i in self) {
          fun.call(thisp, self[i], i, object);
        }
      }
    };
  }
  if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        length = self.length >>> 0,
        result = Array(length),
        thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self)
          result[i] = fun.call(thisp, self[i], i, object);
      }
      return result;
    };
  }
  if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        length = self.length >>> 0,
        result = [],
        value,
        thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self) {
          value = self[i];
          if (fun.call(thisp, value, i, object)) {
            result.push(value);
          }
        }
      }
      return result;
    };
  }
  if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        length = self.length >>> 0,
        thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self && !fun.call(thisp, self[i], i, object)) {
          return false;
        }
      }
      return true;
    };
  }
  if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        length = self.length >>> 0,
        thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self && fun.call(thisp, self[i], i, object)) {
          return true;
        }
      }
      return false;
    };
  }
  if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        length = self.length >>> 0;
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }
      if (!length && arguments.length == 1) {
        throw new TypeError("reduce of empty array with no initial value");
      }

      var i = 0;
      var result;
      if (arguments.length >= 2) {
        result = arguments[1];
      } else {
        do {
          if (i in self) {
            result = self[i++];
            break;
          }
          if (++i >= length) {
            throw new TypeError("reduce of empty array with no initial value");
          }
        } while (true);
      }

      for (; i < length; i++) {
        if (i in self) {
          result = fun.call(void 0, result, self[i], i, object);
        }
      }

      return result;
    };
  }
  if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
      var object = toObject(this),
        self = splitString && _toString(this) == "[object String]" ?
          this.split("") :
          object,
        length = self.length >>> 0;
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }
      if (!length && arguments.length == 1) {
        throw new TypeError("reduceRight of empty array with no initial value");
      }

      var result, i = length - 1;
      if (arguments.length >= 2) {
        result = arguments[1];
      } else {
        do {
          if (i in self) {
            result = self[i--];
            break;
          }
          if (--i < 0) {
            throw new TypeError("reduceRight of empty array with no initial value");
          }
        } while (true);
      }

      do {
        if (i in this) {
          result = fun.call(void 0, result, self[i], i, object);
        }
      } while (i--);

      return result;
    };
  }
  if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
      var self = splitString && _toString(this) == "[object String]" ?
        this.split("") :
        toObject(this),
        length = self.length >>> 0;

      if (!length) {
        return -1;
      }

      var i = 0;
      if (arguments.length > 1) {
        i = toInteger(arguments[1]);
      }
      i = i >= 0 ? i : Math.max(0, length + i);
      for (; i < length; i++) {
        if (i in self && self[i] === sought) {
          return i;
        }
      }
      return -1;
    };
  }
  if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
      var self = splitString && _toString(this) == "[object String]" ?
        this.split("") :
        toObject(this),
        length = self.length >>> 0;

      if (!length) {
        return -1;
      }
      var i = length - 1;
      if (arguments.length > 1) {
        i = Math.min(i, toInteger(arguments[1]));
      }
      i = i >= 0 ? i : length - Math.abs(i);
      for (; i >= 0; i--) {
        if (i in self && sought === self[i]) {
          return i;
        }
      }
      return -1;
    };
  }

//
//
  if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
      return object.__proto__ || (
        object.constructor ?
          object.constructor.prototype :
          prototypeOfObject
      );
    };
  }
  if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
      "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
      if ((typeof object != "object" && typeof object != "function") || object === null)
        throw new TypeError(ERR_NON_OBJECT + object);
      if (!owns(object, property))
        return;

      var descriptor, getter, setter;
      descriptor =  { enumerable: true, configurable: true };
      if (supportsAccessors) {
        var prototype = object.__proto__;
        object.__proto__ = prototypeOfObject;

        var getter = lookupGetter(object, property);
        var setter = lookupSetter(object, property);
        object.__proto__ = prototype;

        if (getter || setter) {
          if (getter) descriptor.get = getter;
          if (setter) descriptor.set = setter;
          return descriptor;
        }
      }
      descriptor.value = object[property];
      return descriptor;
    };
  }
  if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
      return Object.keys(object);
    };
  }
  if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
      createEmpty = function () {
        return { "__proto__": null };
      };
    } else {
      createEmpty = function () {
        var empty = {};
        for (var i in empty)
          empty[i] = null;
        empty.constructor =
          empty.hasOwnProperty =
            empty.propertyIsEnumerable =
              empty.isPrototypeOf =
                empty.toLocaleString =
                  empty.toString =
                    empty.valueOf =
                      empty.__proto__ = null;
        return empty;
      }
    }

    Object.create = function create(prototype, properties) {
      var object;
      if (prototype === null) {
        object = createEmpty();
      } else {
        if (typeof prototype != "object")
          throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
      }
      if (properties !== void 0)
        Object.defineProperties(object, properties);
      return object;
    };
  }
  function doesDefinePropertyWork(object) {
    try {
      Object.defineProperty(object, "sentinel", {});
      return "sentinel" in object;
    } catch (exception) {
    }
  }
  if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
      doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
      var definePropertyFallback = Object.defineProperty;
    }
  }

  if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
      if ((typeof object != "object" && typeof object != "function") || object === null)
        throw new TypeError(ERR_NON_OBJECT_TARGET + object);
      if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
        throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
      if (definePropertyFallback) {
        try {
          return definePropertyFallback.call(Object, object, property, descriptor);
        } catch (exception) {
        }
      }
      if (owns(descriptor, "value")) {

        if (supportsAccessors && (lookupGetter(object, property) ||
          lookupSetter(object, property)))
        {
          var prototype = object.__proto__;
          object.__proto__ = prototypeOfObject;
          delete object[property];
          object[property] = descriptor.value;
          object.__proto__ = prototype;
        } else {
          object[property] = descriptor.value;
        }
      } else {
        if (!supportsAccessors)
          throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
        if (owns(descriptor, "get"))
          defineGetter(object, property, descriptor.get);
        if (owns(descriptor, "set"))
          defineSetter(object, property, descriptor.set);
      }

      return object;
    };
  }
  if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
      for (var property in properties) {
        if (owns(properties, property))
          Object.defineProperty(object, property, properties[property]);
      }
      return object;
    };
  }
  if (!Object.seal) {
    Object.seal = function seal(object) {
      return object;
    };
  }
  if (!Object.freeze) {
    Object.freeze = function freeze(object) {
      return object;
    };
  }
  try {
    Object.freeze(function () {});
  } catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
      return function freeze(object) {
        if (typeof object == "function") {
          return object;
        } else {
          return freezeObject(object);
        }
      };
    })(Object.freeze);
  }
  if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
      return object;
    };
  }
  if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
      return false;
    };
  }
  if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
      return false;
    };
  }
  if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
      if (Object(object) === object) {
        throw new TypeError(); // TODO message
      }
      var name = '';
      while (owns(object, name)) {
        name += '?';
      }
      object[name] = true;
      var returnValue = owns(object, name);
      delete object[name];
      return returnValue;
    };
  }
  if (!Object.keys) {
    var hasDontEnumBug = true,
      dontEnums = [
        "toString",
        "toLocaleString",
        "valueOf",
        "hasOwnProperty",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "constructor"
      ],
      dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
      hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

      if (
        (typeof object != "object" && typeof object != "function") ||
        object === null
      ) {
        throw new TypeError("Object.keys called on a non-object");
      }

      var keys = [];
      for (var name in object) {
        if (owns(object, name)) {
          keys.push(name);
        }
      }

      if (hasDontEnumBug) {
        for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
          var dontEnum = dontEnums[i];
          if (owns(object, dontEnum)) {
            keys.push(dontEnum);
          }
        }
      }
      return keys;
    };

  }

//
//
  if (!Date.now) {
    Date.now = function now() {
      return new Date().getTime();
    };
  }


//
//
  var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
  if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
      trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
      return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
  }

//
//
  function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
      n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
      n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
  }

  function isPrimitive(input) {
    var type = typeof input;
    return (
      input === null ||
      type === "undefined" ||
      type === "boolean" ||
      type === "number" ||
      type === "string"
    );
  }

  function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
      return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
      val = valueOf.call(input);
      if (isPrimitive(val)) {
        return val;
      }
    }
    toString = input.toString;
    if (typeof toString === "function") {
      val = toString.call(input);
      if (isPrimitive(val)) {
        return val;
      }
    }
    throw new TypeError();
  }
  var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
      throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
  };

});
