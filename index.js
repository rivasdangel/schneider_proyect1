var modbus = require('jsmodbus');
var fs = require('fs');

//Init firestore
var admin = require('firebase-admin');
var serviceAccount = require("/credenciales/dbtest-a9f64-firebase-adminsdk-k8qiu-bb52ed8e2a.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
var dataDoor;
var dataAlarm;
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
        if(DataBits(resp.register[0])[15]==1){
          if(!flagDoorOpen){
            dataDoor.desc = "Puerta 1 de emergencia: Abierta";
            dataDoor.ttActive = new Date().getTime();
            dataDoor.name = "Puerta1";
            dataDoor.alarmstate = true;
            db.collection('dbEventos').add(dataDoor).then(function(ref){
                idDoor = ref.id;
                console.log('Added document with ID: ', ref.id);
            });
            flagDoorOpen=true;
          }
        }else{
          if(flagDoorOpen){
            db.collection('dbEventos').doc(idDoor).update({ ttInactive: new Date().getTime(), alarmstate:false });
            console.log("Update Door event.");
            flagDoorOpen=false;
          }
        }

        if(DataBits(resp.register[0])[14]==1){
          if(!flagAlarmActive){
            dataAlarm.desc = "Alarma contra incendios: Activa";
            dataAlarm.ttActive = new Date().getTime();
            dataAlarm.name = "AlarmaFuego";
            dataAlarm.alarmstate = true;
            var addDoc = db.collection('dbEventos').add(dataAlarm).then(function(ref){
                idAlarm = ref.id;
                console.log('Added document with ID: ', ref.id);
            });
            flagAlarmActive = true;
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
