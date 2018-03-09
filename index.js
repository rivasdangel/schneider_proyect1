var modbus = require('jsmodbus');

// create a modbus client
var client = modbus.client.tcp.complete({
        'host'              : '192.168.10.100',
        'port'              : 502,
        'autoReconnect'     : true,
        'reconnectTimeout'  : 10000,
        'timeout'           : 50000,
        'unitId'            : 0
    });

client.connect();


client.on('connect', function () {
    client.readHoldingRegisters(0, 10).then(function (resp) {
        console.log(resp.register);
    }, console.error);
});

client.on('error', function (err) {
    console.log(err);
});
