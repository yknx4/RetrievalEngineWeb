var net = require('net');


var client = function(port, onConnect) {
    net.connect({port: port}, onConnect);
};

client.on('data', function(data) {
    console.log(data.toString());
    client.end();
});
client.on('end', function() {
    console.log('disconnected from server');
});

module.exports = client;