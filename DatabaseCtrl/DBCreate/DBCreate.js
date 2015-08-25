var http = require('http');
var DBCreateJSFun = {};
DBCreateJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

DBCreateJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    DBCreateJSFun.options.host = host;
    DBCreateJSFun.options.port = port;
    DBCreateJSFun.options.path = path;
    DBCreateJSFun.options.method = method;
    DBCreateJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    return DBCreateJSFun.options;
};

DBCreateJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(options, function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            res_success(str);
        });
    }).on('error', function (error) {
        res_error(error.errno);
    });
    if (method !== 'get')
        req.write(jsonStringData);
    req.end();
};

DBCreateJSFun.getjsoncontentData = function (config) {
    var tablename = config.tablename;
    var data = config.data;
    var objitem = new Object();
    var fieldArray = [];
    for (var index = 0; index < data.length; index++) {
        var fieldName = data[index].name;
        var fieldType = data[index].type;
        var length = data[index].length;
        var allowNULL = data[index].allownull;
        if (fieldType === 'character')
            fieldArray.push({"@fieldName": "" + fieldName + "", "@fieldType": "" + fieldType + "", "@length": "" + length + "", "@allowNULL": "" + allowNULL + ""});
        else
            fieldArray.push({"@fieldName": "" + fieldName + "", "@fieldType": "" + fieldType + "", "@allowNULL": "" + allowNULL + ""});
    }
    objitem.item = fieldArray;
    var objfields = new Object();
    objfields.tableName = {"@value": "" + tablename + ""};
    objfields.fields = objitem;
    var objreq = new Object();
    objreq.request = objfields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function DBCreateNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            var flag = msg.flag;
            var encodestr = msg.encodestr;
            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                var decoder = new Buffer(encodestr, 'base64').toString();
                username = decoder.split("$")[0];
                pwd = decoder.split("$")[1];
            } else if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                    url === '' || port === '' || username === '' || pwd === '') {
                node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                return;
            }
            if(typeof msg.tablename !== 'undefined' && msg.tablename !== '')
                config.tablename = msg.tablename;
            if(typeof msg.fields !== 'undefined' && msg.fields !== '')
                config.data = msg.fields;
            if(typeof config.tablename === 'undefined' || config.tablename === ''){
                node.status({fill: "red", shape: "ring", text: "miss table name parameters"});
                return;
            }
            DBCreateJSFun.submit(url, port, '/webresources/SQLMgmt/CreateTable', 'post', username, pwd, DBCreateJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("DBCreate", DBCreateNode);
};