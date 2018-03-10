var modbus = require('jsmodbus');
var fs = require('fs');
var PubNub = require('pubnub');

pubnub = new PubNub({
    publishKey : 'pub-c-4348e254-4e80-4cc7-929f-357abb4b4908',
    subscribeKey : 'sub-c-f49072d4-18bd-11e8-b857-da98488f5703',
    uuid: "burlingtonAlarms"
});
//Init firestore
var admin = require('firebase-admin');
var serviceAccount = require("./credenciales/dbtest-a9f64-firebase-adminsdk-k8qiu-bb52ed8e2a.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
var dataDoor = {
  desc : "Puerta 1 de emergencia: Abierta",
  ttActive : null,
  name : "Puerta1",
  alarmstate : false
};
var dataAlarm = {
  desc : "Alarma contra incendios: Activa",
  ttActive : null,
  name : "Alarma contra incendios 1.",
  alarmstate : false
};
var flagDoorOpen=false;
var flagAlarmActive=false;

var idDoor;
var idAlarm;
// create a modbus client
var client = modbus.client.tcp.complete({
        'host'              : '192.168.100.50',
        'port'              : 502,
        'autoReconnect'     : true,
        'reconnectTimeout'  : 10000,
        'timeout'           : 50000,
        'unitId'            : 1
    });
try{
  client.connect();
}catch(error){
  fs.appendFile('access_log.log', error, function(err){
    if (err) throw err;
    console.log('The "data to append" was appended to file!');
  });
}

client.on('connect', function () {
  setInterval(function(){
    client.readHoldingRegisters(0, 4).then(function (resp) {
        //console.log(resp.register);
        //console.log(DataBits(resp.register[0]));
        if(DataBits(resp.register[0])[15]==0){
          if(!flagDoorOpen){
            dataDoor.ttActive = new Date().getTime();
            dataDoor.alarmstate = true;
            db.collection('dbEventos').add(dataDoor).then(function(ref){
                idDoor = ref.id;
                console.log('Added document with ID: ', ref.id);
            });
            flagDoorOpen=true;
            publishMessage(dataDoor);
          }
        }else{
          if(flagDoorOpen){
            db.collection('dbEventos').doc(idDoor).update({ ttInactive: new Date().getTime(), alarmstate:false });
            console.log("Update Door event.");
            flagDoorOpen=false;
          }
        }
        setInterval(function(){
          if(flagDoorOpen){
              publishMessage(dataDoor);
          }
          if(flagAlarmActive){
              publishMessage(dataDoor);
          }
        },15000);

        if(DataBits(resp.register[0])[14]==1){
          if(!flagAlarmActive){
            dataAlarm.ttActive = new Date().getTime();
            dataAlarm.alarmstate = true;
            var addDoc = db.collection('dbEventos').add(dataAlarm).then(function(ref){
                idAlarm = ref.id;
                console.log('Added document with ID: ', ref.id);
            });
            flagAlarmActive = true;
            publishMessage(dataAlarm);
          }
        }else{
          if(flagAlarmActive){
            db.collection('dbEventos').doc(idAlarm).update({ ttInactive: new Date().getTime(), alarmstate:false });
            console.log("Update Alarm event.");
            flagAlarmActive=false;
          }
        }
    }, console.error);
  },1000);
});

client.on('error', function (err) {
    console.log(err);
    clearInterval(intIdW2);
});


var DataBits=function(num1) {
  var bits = "0000000000000000";
  var bin1 = num1.toString(2);
  var newNum = bits.split("");
  for(var i=0;i<bin1.length;i++){
    newNum[15-i] = bin1[(bin1.length - 1)-i];
  }
  bits = newNum.join("");
  return bits;
};

var publishMessage =  function (mensaje) {
        var publishConfig = {
            channel : "burslington_channel",
            message : {
                name: mensaje.name,
                ubicacion: "Acabado",
                mensaje: mensaje.desc,
                tipo: "Alarma"
            },
            sendByPost: false, // true to send via post
            storeInHistory: false, //override default storage options
            meta: {
                "cool": "meta"
            } // publish extra meta with the request
        };
        pubnub.publish(publishConfig, function(status, response) {

        });
    };
