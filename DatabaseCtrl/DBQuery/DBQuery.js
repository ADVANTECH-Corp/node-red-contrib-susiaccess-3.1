var http = require('http');
var DBQueryJSFun = {};
DBQueryJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

DBQueryJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    DBQueryJSFun.options.host = host;
    DBQueryJSFun.options.port = port;
    DBQueryJSFun.options.path = path;
    DBQueryJSFun.options.method = method;
    DBQueryJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    return DBQueryJSFun.options;
};

DBQueryJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
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

DBQueryJSFun.getjsoncontentData = function (config) {
    var tablename = config.tablename;
    var selectFields = config.selectFields;
    var condictions_op = config.cond_op;
    var condictions = config.conditions;
    var offset = config.offset;
    var limit = config.limit;
    var orderBy = config.orderby;
    var objselectfielditem = new Object();
    var fieldArray = [];
    for (var index = 0; index < selectFields.length; index++) {
        var fieldName = selectFields[index].name;
        var checked = selectFields[index].checked;
        if (checked)
            fieldArray.push({"@tableField": "" + tablename + "." + fieldName + ""});
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
    var objordersitem = new Object();
    var ordersArray = [];
    for (var index = 0; index < orderBy.length; index++) {
        var fieldName = orderBy[index].name;
        var type = orderBy[index].type;
        ordersArray.push({"@tableField": "" + tablename + "." + fieldName + "",
         "@value": "" + type + ""});
    }
    objselectfielditem.item = fieldArray;
    objcondsitem.item = condsArray;
    objordersitem.item = ordersArray;
    var objFields = new Object();
    if(selectFields.length !== 0)
        objFields.selectFields = objselectfielditem;
    objFields.condictions_op = cond_op;
    if(condictions.length !== 0)
        objFields.condictions = objcondsitem;
    if(offset !== '')
        objFields.offset = {"@value": "" + offset + ""};
    if(limit !== '')
        objFields.limit = {"@value": "" + limit + ""};
    if(orderBy.length !== 0)
        objFields.orderBy = objordersitem;
    var objreq = new Object();
    objreq.request = objFields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function DBQueryNode(config) {
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

            if (typeof msg.tablename !== 'undefined' && msg.tablename !== '')
                config.tablename = msg.tablename;

            if (typeof msg.fields !== 'undefined' && msg.fields !== '')
                config.data = msg.fields;

            if (typeof config.tablename === 'undefined' || config.tablename === '') {
                node.status({fill: "red", shape: "ring", text: "miss table name parameters"});
                return;
            }

            DBQueryJSFun.submit(url, port, '/webresources/SQLMgmt/Query', 'post', username, pwd, DBQueryJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("DBQuery", DBQueryNode);
};