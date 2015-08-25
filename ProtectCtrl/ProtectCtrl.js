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

    function ProtectCtrlNode(config) {
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
            if (typeof msg.action !== 'undefined' && msg.action !== '')
                config.action = msg.action;  
            if (typeof msg.activate !== 'undefined' && msg.activate !== '')
                config.deviceid = msg.deviceid;  
            if (typeof msg.company !== 'undefined' && msg.company !== '')
                config.company = msg.company;  
            if (typeof msg.sn !== 'undefined' && msg.sn !== '')
                config.sn = msg.sn;  
            
            var jsonString = getjsoncontentData(config);
            statusNode.status({fill: "red", shape: "ring", text: "sending"});
            options = sethttpOption(url, port, '/webresources/ProtectionMgmt', 'post', username, pwd);
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

    function getjsoncontentData(config)
    {
        var did = config.deviceid;
        var action = config.action;
        var activate = config.activate;
        var companyName = config.company;
        var sn = config.sn;
        var obj = new Object();
        var agentItem = [];
        agentItem.push({"@name": "agentId", "@value": "" + did + ""});
        agentItem.push({"@name": "action", "@value": "" + action + ""});
        if (action === 'install') {
            agentItem.push({"@name": "isActivate", "@value": "" + activate + ""});
        }
        if (activate.toLowerCase() === 'true' || action === 'activate') {
            agentItem.push({"@name": "companyName", "@value": "" + companyName + ""});
            agentItem.push({"@name": "mcafeeSN", "@value": "" + sn + ""});
        }
        obj.item = agentItem;
        var objreq = new Object();
        objreq.request = obj;
        return JSON.stringify(objreq);
    };

    function sethttpOption(host, port, path, method, user, pwd)
    {
        options.host = host;
        options.port = port;
        options.path = path;
        options.method = method;
        options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
        return options;
    };

    RED.nodes.registerType("ProtectCtrl", ProtectCtrlNode);
};