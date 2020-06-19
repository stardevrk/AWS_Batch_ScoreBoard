import Client from './socket';


const portNumber = process.env.port;
const sockekServer = process.env.server;
const hashCode = process.env.hash;
const botCode = process.env.bot;
const timeDuration = process.env.time;
console.log("Environment Variables, port, server, hashcode, botcode, timeDuration", portNumber, sockekServer, hashCode, botCode, timeDuration);

let client = new Client(portNumber, sockekServer, hashCode, botCode);
// let client = new Client();
// let client = new Client(1402, 'scorebot.sportzcast.net', 'mg005998ce210322b24e6ea7d69a5f00aff14c8bd9');
client.read();

setTimeout(() => {
  client.destroy();
}, timeDuration * 1000);