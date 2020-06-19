
import { Subject } from 'rxjs'; 
import * as https from 'https';
import { BASE_JSON_URL } from './config';
const net = require('net');
const PORT = 52275;
const HOST = '127.0.0.1';
const BOTCODE = '01743';
// const HOST = 'host.docker.internal';


export default class Client {

  constructor(port, address, hash, botCode) {
    this.socket = new net.Socket();
    this.address = address || HOST;
    this.port = port || PORT;
    this.intervalTimer = null;
    this.resend = 0;
    this.destroied = false;
    this.sendData = null;
    this.dataSubscription = null;
    this.subject = new Subject();
    this.prevJSONData = null;
    this.gameHash = hash || null;
    this.botCode = botCode || BOTCODE;
  }

  init () {
    let client = this;
    client.socket.connect(
      client.port,
      client.address, 
      () => {
        console.log(`Client connected to: ${client.address} : ${client.port}`);        
      }
    );

    client.socket.on('data', data => {
      console.log("Received: ", data.toString());
    });

    client.socket.on('close', () => {
      console.log("Connection closed!");
      if (client.intervalTimer != null)
        clearInterval(client.intervalTimer);
      client.reconnect();
    });

    client.socket.on('end', () => {
      console.log("Connection ended!");
      if (client.intervalTimer != null)
        clearInterval(client.intervalTimer);
      client.reconnect();
    })

    client.socket.on('connect', () => {
      client.socket.write(Buffer.from('BOT' + client.botCode, 'ascii'));
      client.intervalTimer = setInterval(() => {
        client.getData(`${BASE_JSON_URL}${client.gameHash}_game.json`);
      }, 2000);
    })

    client.socket.on('error', error => {
      console.log("Error ==== ", error);
      if (client.intervalTimer != null)
        clearInterval(client.intervalTimer);
      // client.socket.removeAllListeners();
    })
  }

  

  reconnect () {
    let client = this;
    if (client.destroied == true) {
      client.socket.removeAllListeners();
      return;
    }
    setTimeout(() => {
      client.socket.removeAllListeners() // the important line that enables you to reopen a connection
      client.init();
    }, 5000)
  }

  destroy() {
    let client = this;
    if (client.dataSubscription != null)
      client.dataSubscription.unsubscribe();
    client.destroied = true;
    client.socket.destroy();
    if (client.intervalTimer != null)
        clearInterval(client.intervalTimer);
  }

  prepareData() {
    let client = this; 
    client.dataSubscription = client.subject.asObservable().subscribe((data) => {
      // console.log("Subscribed Data ==== ", JSON.parse(data));
      if (data == '') return;
      let initPayload = JSON.parse(data);
      let payload = '';
      if (client.prevJSONData != initPayload) {
        client.prevJSONData = initPayload;
        /*Payload must be 150 bytes ending with \n  (151 total)
              (zero indexed)
              Position
              6   balls
              7   strikes
              8   Outs
              9   Innings tens
              10  Innings ones
              11  Guest Runs tens
              12  Guest Runs ones
              13  Home Runs tens
              14  Home Runs ones
              15  Top/Bottom of Inning (T/B)
              16  Guest Hits tens
              17  Guest Hits ones
              18  Home Hits tens
              19  Home Hits ones
              20  Guest Errors ones
              21  Home Errors ones
              22  Uni for Hitter tens
              23  Uni for Hitter ones
              24  Error Flag (H, E or blank)
              25  Guest Error #
              26  Top of Inning
              27  Bottom of Inning
              28-29 blank
              30-49  Guest and Home Inning values from 1 - 10
        */
       
        
        if (initPayload['live_board']['top_of_inning']) {
          payload = '010000' + 
          initPayload['live_board']['balls'] + 
          initPayload['live_board']['strikes'] +
          initPayload['live_board']['outs'] + 
          client.add_tens_zero(initPayload['live_board']['inning']) + 
          client.add_tens_zero(initPayload['live_board']['away_score']) + 
          client.add_tens_zero(initPayload['live_board']['home_score']) + 
          'T' + 
          client.add_tens_zero(initPayload['live_board']['away_hits']) + 
          client.add_tens_zero(initPayload['live_board']['home_hits']) + 
          client.force_ones(initPayload['live_board']['away_errors']) + 
          client.force_ones(initPayload['live_board']['home_errors'])
        } else {
          payload = '010000' + 
          initPayload['live_board']['balls'] + 
          initPayload['live_board']['strikes'] +
          initPayload['live_board']['outs'] + 
          client.add_tens_zero(initPayload['live_board']['inning']) + 
          client.add_tens_zero(initPayload['live_board']['away_score']) + 
          client.add_tens_zero(initPayload['live_board']['home_score']) + 
          'B' + 
          client.add_tens_zero(initPayload['live_board']['away_hits']) + 
          client.add_tens_zero(initPayload['live_board']['home_hits']) + 
          client.force_ones(initPayload['live_board']['away_errors']) + 
          client.force_ones(initPayload['live_board']['home_errors'])
        }
        
        if (initPayload['sboard']['hitter'] != undefined && initPayload['sboard']['hitter']['uni'] != undefined) {
          payload += client.add_tens_zero(initPayload['sboard']['hitter']['uni']);
        } else {
          payload += '  ';
        }
        
        payload += ' '; // Error/Hit Flag
        payload += '     '; // Add 5 blanks for 25-29
        
        let last_number = null;
        initPayload['innings'].forEach(element => {
          if (parseInt(element['number']) <= 10) {
            last_number = parseInt(element['number']);
            payload += client.force_ones(element['away_runs']) + client.force_ones(element['home_runs']);
          }
        });
        if (last_number != null) {
          while (parseInt(last_number) < 10) {
            // Fill in the with blanks up to 10
            last_number += 1;
            payload += '  ';
          }
        }
  
        // 50-57 is Guest Name
        var guest_name = initPayload['live_board']['away_name'].substring(0, 8);
        guest_name = guest_name.padEnd(8, ' ');
        payload += guest_name;
  
        // 58-65 is Home Name
        var home_name = initPayload['live_board']['home_name'].substring(0, 8);
        home_name = home_name.padEnd(8, ' ');
        payload += home_name;
  
        //66 On First 67 On Second 68 On Thrid
        if (initPayload['live_board']['on_first'])
          payload += '1';
        else 
          payload += ' ';
        
        if (initPayload['live_board']['on_second'])
          payload += '1';
        else 
          payload += ' ';
  
        if (initPayload['live_board']['on_third'])
          payload += '1';
        else 
          payload += ' ';
  
        //Pitch Speed 69, 70, 71
        if (initPayload['sboard']['last_velo']) {
          payload += client.add_hundreds_zero(initPayload['sboard']['last_velo']);
        } else {
          payload += 0;
        }
  
        //Pitch Count 
        if (initPayload['sboard']['pitcher'] != undefined && initPayload['sboard']['pitcher']['stats'] != undefined) {
          payload +=  client.add_hundreds_zero(initPayload['sboard']['pitcher']['stats']['pitches']);
        } else {
          payload += '   ';
        }
        payload = payload.padEnd(133, ' ');
        // payload += '01743'; //Add BOT code
        payload += client.botCode; // Add BOT code
        payload += '8D2E6CB31B35';
        payload += '\n';

        // payload = '010000000 3 2 0T 4 010 1      002000              LKN13   Big Test      15                                                           017438D2E6CB31B35\n';
        console.log("Payload Length === ", payload, payload.length);
        client.sendData = Buffer.from(payload, 'ascii');
        
      }
      
        client.socket.write(client.sendData);
    })
  }

  getData(url) {
    let client = this;
    https.get(url, (res) => {
      res.on('data', (data) => {
        client.subject.next(Buffer.from(data).toString());
      });
    }).on('error', (error) => {
      console.log(error);
    })
  }
  
  add_tens_zero(value) {
    if (parseInt(value) > 9)
      return value.toString();
    else
      return ' ' + value;
  }
  
  add_hundreds_zero(value) {
    if (parseInt(value) >= 100)
      return value.toString();
    else if(parseInt(value) >= 10)
      return ' ' + value;
    else if (parseInt(value) > 0)
      return '  ' + value;
    else
      return '   ';
  }
  
  force_ones(value) {
    if (value > 9)
      return '9';
    else 
      return value.toString();
  }

  read() {
    this.prepareData();
    this.init();
  }
}