const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://broker.emqx.io:1883', {
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    manualConnect: true,
    keepalive: 10,
    protocol: 'mqtt',
});


client.on('packetreceive', (packet) => {
    console.log(packet.cmd);
});
client.on('connect', () => {
    console.log('connected');
});

setInterval(() => {
    console.log(client.pingResp);
    console.log(client.pingTimer);
}, 1000);
client.connect();
