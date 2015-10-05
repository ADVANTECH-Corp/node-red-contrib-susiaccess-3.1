var http = require('http');
var DBUpdateJSFun = {};
DBUpdateJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

DBUpdateJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    DBUpdateJSFun.options.host = host;
    DBUpdateJSFun.options.port = port;
    DBUpdateJSFun.options.path = path;
    DBUpdateJSFun.options.method = method;
    DBUpdateJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    DBUpdateJSFun.options.headers.Accesstoken = '';
    return DBUpdateJSFun.options;
};

DBUpdateJSFun.sethttpOption_token = function (host, port, path, method, token) {
    DBUpdateJSFun.options.host = host;
    DBUpdateJSFun.options.port = port;
    DBUpdateJSFun.options.path = path;
    DBUpdateJSFun.options.method = method;
    DBUpdateJSFun.options.headers.Authorization = '';
    DBUpdateJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return DBUpdateJSFun.options;
};

DBUpdateJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(DBUpdateJSFun.options, function (response) {
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

DBUpdateJSFun.getjsoncontentData = function (config) {
    var tablename = config.tablename;
    var fields = config.fields;
    var condictions_op = config.cond_op;
    var condictions = config.conditions;
    var objselectfielditem = new Object();
    var fieldArray = [];
    for (var index = 0; index < fields.length; index++) {
        var fieldName = fields[index].name;
        var value = fields[index].value;
        fieldArray.push({"@fieldName": "" + fieldName + "", "@value": "" + value + ""});
    }
    var cond_op = {"@value": "" + condictions_op + ""};
    var objcondsitem = new Object();
    var condsArray = [];
    for (var index = 0; index < condictions.length; index++) {
        var fieldName = condictions[index].name;
        var operator = condictions[index].op;
        var operatorchar;
        var value = condictions[index].value;
        if (operator === 'equ') {
            operatorchar = '=';
        } else if (operator === 'notequ') {
            operatorchar = '!=';
        } else if (operator === 'less') {
            operatorchar = '<';
        } else if (operator === 'lessequ') {
            operatorchar = '<=';
        } else if (operator === 'large') {
            operatorchar = '>';
        } else if (operator === 'largeequ') {
            operatorchar = '>=';
        } else {
            operatorchar = operator;
        }
        condsArray.push({
            "@tableField": "" + tablename + "." + fieldName + "",
            "@operator": "" + operatorchar + "",
            "@value": "" + value + ""
        });
    }

    objselectfielditem.item = fieldArray;
    objcondsitem.item = condsArray;

    var objFields = new Object();
    objFields.tableName = {"@value": "" + tablename + ""};
    if (fields.length !== 0)
        objFields.fields = objselectfielditem;
    objFields.condictions_op = cond_op;
    if (condictions.length !== 0)
        objFields.condictions = objcondsitem;
    var objreq = new Object();
    objreq.request = objFields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function DBUpdateNode(config) {
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
            var token = msg.token;
            var connectype = msg.connectype;
            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                switch (connectype) {
                    case 'basic':
                        var decoder = new Buffer(encodestr, 'base64').toString();
                        username = decoder.split("$")[0];
                        pwd = decoder.split("$")[1];
                        DBUpdateJSFun.options = DBUpdateJSFun.sethttpOption(url, port, '/webresources/SQLMgmt/updateData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        DBUpdateJSFun.options = DBUpdateJSFun.sethttpOption_token(url, port, '/webresources/SQLMgmt/updateData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                DBUpdateJSFun.options = DBUpdateJSFun.sethttpOption(url, port, '/webresources/SQLMgmt/updateData', 'post', username, pwd);
            }

            if (typeof msg.tablename !== 'undefined' && msg.tablename !== '')
                config.tablename = msg.tablename;

            if (typeof msg.fields !== 'undefined' && msg.fields !== '')
                config.data = msg.fields;

            if (typeof config.tablename === 'undefined' || config.tablename === '') {
                node.status({fill: "red", shape: "ring", text: "miss table name parameters"});
                return;
            }

            DBUpdateJSFun.submit(url, port, '/webresources/SQLMgmt/updateData', 'post', username, pwd, DBUpdateJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("DBUpdate", DBUpdateNode);
};