"use strict";

var _socket = _interopRequireDefault(require("./socket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let client = new _socket.default(1402, 'scorebot.sportzcast.net', 'mg005998ce210322b24e6ea7d69a5f00aff14c8bd9', '01743'); // let client = new Client();
// let client = new Client(52275, '192.168.101.89', 'mg005998ce210322b24e6ea7d69a5f00aff14c8bd9');

client.read(); // setTimeout(() => {
//   client.destroy();
// }, 10000);
//# sourceMappingURL=connect.js.map