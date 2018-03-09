var modbus = require('jsmodbus');
var fs = require('fs');
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
        console.log(DataBits(resp.register[0]));
    }, console.error);
  },1000);
});

client.on('error', function (err) {
    console.log(err);
    clearInterval(intIdW2);
});


var DataBits=function(num1) {
  var bin1 = num1.toString(2);
  return bin1;
};
