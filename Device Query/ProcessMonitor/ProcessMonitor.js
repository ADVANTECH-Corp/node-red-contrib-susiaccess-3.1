module.exports = function (RED) {
    var http = require('http');
    var options = {
        host: 'localhost',
        port: '8080',
        path: '/webresources',
        method: 'GET',
        headers: {'Authorization': 'Basic ',
            'Accept': 'application/json',
            'Content-Type': 'application/json'}
    };

    function ProcessMonitorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            var statusNode = this;
            var flag = msg.flag;
            var encodestr = msg.encodestr;
            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                var decoder = new Buffer(encodestr, 'base64').toString();
                username = decoder.split("$")[0];
                pwd = decoder.split("$")[1];
            } else if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                    url === '' || port === '' || username === '' || pwd === '') {
                statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                return;
            }
            if (typeof msg.deviceid !== 'undefined' && msg.deviceid !== '')
                config.deviceid = msg.deviceid;  
            statusNode.status({fill: "red", shape: "ring", text: "sending"});
            var obj = new Object();
            obj.agentId = config.deviceid;
            obj.handler = 'ProcessMonitor';
            var objreq = new Object();
            objreq.request = obj;
            var jsonString = JSON.stringify(objreq);

            options = sethttpOption(url, port, '/webresources/DeviceCtl/getSensorData', 'post', username, pwd);
            var req = http.request(options, function (response) {
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    msg.payload = str;
                    node.send(msg);
                    statusNode.status({fill: "green", shape: "dot", text: "done"});
                });
            }).on('error', function (error) {
                statusNode.status({fill: "red", shape: "ring", text: error.errno});
            });
            req.write(jsonString);
            req.end();
        });
    }

    function sethttpOption(host, port, path, method, user, pwd)
    {
        options.host = host;
        options.port = port;
        options.path = path;
        options.method = method;
        options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
        return options;
    }

    RED.nodes.registerType("ProcessMonitor", ProcessMonitorNode);
};