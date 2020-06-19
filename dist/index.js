"use strict";

var _socket = _interopRequireDefault(require("./socket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = null;

function start(PORT, HOST, HASH) {
  client = new _socket.default(PORT, HOST, HASH);
  client.read();
}
//# sourceMappingURL=index.js.map