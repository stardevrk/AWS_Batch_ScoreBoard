import Client from './socket';

var client = null;

function start (PORT, HOST, HASH) {
  client = new Client(PORT, HOST, HASH);
  client.read();
}