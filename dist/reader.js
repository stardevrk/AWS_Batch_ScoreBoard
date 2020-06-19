"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _socket = _interopRequireDefault(require("./socket"));

var https = _interopRequireWildcard(require("https"));

var _rxjs = require("rxjs");

var _config = require("./config");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Reader {
  constructor() {
    this.dataSubscription = null;
    this.subject = new _rxjs.Subject();
    this.dataSubject = new _rxjs.Subject();
    this.testClient = new _socket.default();
  }

  getData(url) {
    let dataReader = this;
    https.get(url, res => {
      res.on('data', data => {
        // process.stdout.write(d);
        // console.log("Result Data === ", Buffer.from(data).toString());
        dataReader.subject.next(Buffer.from(data).toString());
      });
    }).on('error', error => {
      console.log(error);
    });
  }

  add_tens_zero(value) {
    if (parseInt(value) > 9) return value.toString();else return ' ' + value;
  }

  add_hundreds_zero(value) {
    if (parseInt(value) >= 100) return value.toString();else if (parseInt(value) >= 10) return ' ' + value;else if (parseInt(value) > 0) return '  ' + value;else return '   ';
  }

  force_ones(value) {
    if (value > 9) return '9';else return value.toString();
  }

  prepareData() {
    let dataReader = this;
    this.dataSubscription = this.subject.asObservable().subscribe(data => {
      // console.log("Subscribed Data ==== ", JSON.parse(data));
      let initPayload = JSON.parse(data);
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

      let payload = '';

      if (initPayload['live_board']['top_of_inning']) {
        payload = '010000' + initPayload['live_board']['balls'] + initPayload['live_board']['strikes'] + initPayload['live_board']['outs'] + dataReader.add_tens_zero(initPayload['live_board']['inning']) + dataReader.add_tens_zero(initPayload['live_board']['away_score']) + dataReader.add_tens_zero(initPayload['live_board']['home_score']) + 'T' + dataReader.add_tens_zero(initPayload['live_board']['away_hits']) + dataReader.add_tens_zero(initPayload['live_board']['home_hits']) + dataReader.force_ones(initPayload['live_board']['away_errors']) + dataReader.force_ones(initPayload['live_board']['home_errors']);
      } else {
        payload = '010000' + initPayload['live_board']['balls'] + initPayload['live_board']['strikes'] + initPayload['live_board']['outs'] + dataReader.add_tens_zero(initPayload['live_board']['inning']) + dataReader.add_tens_zero(initPayload['live_board']['away_score']) + dataReader.add_tens_zero(initPayload['live_board']['home_score']) + 'B' + dataReader.add_tens_zero(initPayload['live_board']['away_hits']) + dataReader.add_tens_zero(initPayload['live_board']['home_hits']) + dataReader.force_ones(initPayload['live_board']['away_errors']) + dataReader.force_ones(initPayload['live_board']['home_errors']);
      }

      if (initPayload['sboard']['hitter'] != undefined && initPayload['sboard']['hitter']['uni'] != undefined) {
        payload += dataReader.add_tens_zero(initPayload['sboard']['hitter']['uni']);
      } else {
        payload += '  ';
      }

      payload += ' '; // Error/Hit Flag

      payload += '     '; // Add 5 blanks for 25-29

      let last_number = null;
      initPayload['innings'].forEach(element => {
        if (parseInt(element['number']) <= 10) {
          last_number = parseInt(element['number']);
          payload += dataReader.force_ones(element['away_runs']) + dataReader.force_ones(element['home_runs']);
        }
      });

      if (last_number != null) {
        while (parseInt(last_number) < 10) {
          // Fill in the with blanks up to 10
          last_number += 1;
          payload += '  ';
        }
      } // 50-57 is Guest Name


      var guest_name = initPayload['live_board']['away_name'].substring(0, 8);
      guest_name = guest_name.padEnd(8);
      payload += guest_name; // 58-65 is Home Name

      var home_name = initPayload['live_board']['home_name'].substring(0, 8);
      home_name = home_name.padEnd(8);
      payload += home_name; //66 On First 67 On Second 68 On Thrid

      if (initPayload['live_board']['on_first']) payload += '1';else payload += ' ';
      if (initPayload['live_board']['on_second']) payload += '1';else payload += ' ';
      if (initPayload['live_board']['on_third']) payload += '1';else payload += ' '; //Pitch Speed 69, 70, 71

      if (initPayload['sboard']['last_velo']) {
        payload += dataReader.add_hundreds_zero(initPayload['sboard']['last_velo']);
      } else {
        payload += 0;
      } //Pitch Count 


      if (initPayload['sboard']['pitcher'] != undefined && initPayload['sboard']['pitcher']['stats'] != undefined) {
        payload += dataReader.add_hundreds_zero(initPayload['sboard']['pitcher']['stats']['pitches']);
      } else {
        payload += '   ';
      }

      payload.padEnd(133);
      dataReader.testClient.init(payload);
      console.log("Result Payload ==== ", payload);
    });
  }

  forceStop() {
    if (this.dataSubscription != null) this.dataSubscription.unsubscribe();
    this.testClient.destroy();
  }

  init() {
    this.prepareData();
    this.getData('https://pitchaware-web-prod.s3.amazonaws.com/media/livestats/mg005998ce210322b24e6ea7d69a5f00aff14c8bd9_game.json');
  }

} // let dataSubscription = null;
// const subject = new Subject();
// const dataSubject = new Subject();
// // const testClient = new Client(SOCKET_PORT, SOCKET_HOST);
// const testClient = new Client();

/**
 * 
 * Input Values
 * 
 *  hash: game data json recognition
 *  bot_code: specific code for the game score board socket
 *  timeout_duration: total time in seconds for this module 
 */
// testClient = new Client();


exports.default = Reader;
//# sourceMappingURL=reader.js.map