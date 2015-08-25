var http = require('http');
var EmailSendJSFun = {};
EmailSendJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

EmailSendJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    EmailSendJSFun.options.host = host;
    EmailSendJSFun.options.port = port;
    EmailSendJSFun.options.path = path;
    EmailSendJSFun.options.method = method;
    EmailSendJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    return EmailSendJSFun.options;
};

EmailSendJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
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

EmailSendJSFun.getjsoncontentData = function (config, smtpaccount, encryptpwd) {
    var smtpserver = config.smtpserver;
    var smtpport = config.smtpport;
    var smtptype = config.smtptype;
    var smtpaccount = smtpaccount;
    var smtppwd = encryptpwd;
    var smtpsender = config.smtpsender;
    var smtpsubject = config.smtpsubject;
    var smtprecipient = config.smtprecipient;
    var smtpcontent = config.smtpcontent;
    var objitem = new Object();
    objitem.content = smtpcontent;
    objitem.recipient = smtprecipient;
    objitem.smtp_account = smtpaccount;
    objitem.smtp_passwd = smtppwd;
    objitem.smtp_port = smtpport;
    objitem.smtp_sender = smtpsender;
    objitem.smtp_server = smtpserver;
    objitem.subject = smtpsubject;
    switch (smtptype)
    {
        case 'ssl':
            objitem.smtp_ssl = true;
            objitem.smtp_tls = false;
            break;
        case 'tls':
            objitem.smtp_ssl = false;
            objitem.smtp_tls = true;
            break;
    }
    var objreq = new Object();
    objreq.request = objitem;
    return JSON.stringify(objreq);
};
module.exports = function (RED) {
    function EmailSendNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on('input', function (msg) {
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            var smtpencodestr = config.smtpencodestr;
            //var smtppwd = config.smtppwd;            
            var smtpdecoder = new Buffer(smtpencodestr, 'base64').toString();
            var smtpaccount = smtpdecoder.split("$")[0];
            var smtppwd = smtpdecoder.split("$")[1];
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
            
            if (typeof msg.smtpserver !== 'undefined' && msg.smtpserver !== '')
                config.smtpserver = msg.smtpserver;            
            if(typeof msg.smtpport !== 'undefined' && msg.smtpport !== '')
                config.smtpport = msg.smtpserver;            
            if(typeof msg.smtptype !== 'undefined' && msg.smtptype !== '')
                config.smtptype = msg.smtptype;            
            if(typeof msg.smtpaccount !== 'undefined' && msg.smtpaccount !== '')
                smtpaccount = msg.smtpaccount;
            if(typeof msg.smtppwd !== 'undefined' && msg.smtppwd !== '')
                smtppwd = msg.smtppwd;
            if(typeof msg.smtpsender !== 'undefined' && msg.smtpsender !== '')
                config.smtpsender = msg.smtpsender;   
            if(typeof msg.smtpsubject !== 'undefined' && msg.smtpsubject !== '')
                config.smtpsubject = msg.smtpsubject;   
            if(typeof msg.smtprecipient !== 'undefined' && msg.smtprecipient !== '')
                config.smtprecipient = msg.smtprecipient;   
            if(typeof msg.smtpcontent !== 'undefined' && msg.smtpcontent !== '')
                config.smtpcontent = msg.smtpcontent;   
            
            if (smtppwd === '') {
                statusNode.status({fill: "red", shape: "ring", text: "miss smtppwd parameters"});
                return;
            }
            
            statusNode.status({fill: "red", shape: "ring", text: "sending"});
            
            EmailSendJSFun.submit(url, port, '/webresources/APIInfoMgmt/getEncryptPwd/' + smtppwd, 'get', username, pwd, '', function (res_success) {
                try{
                    var obj = JSON.parse(res_success);
                    EmailSendJSFun.submit(url, port, '/webresources/SettingMgmt/MailTest', 'post', username, pwd, EmailSendJSFun.getjsoncontentData(config, smtpaccount, obj['result']['encryptPwd']), function (send_success) {
                        msg.payload = send_success;
                        node.send(msg);
                        statusNode.status({fill: "green", shape: "dot", text: "done"});
                    }, function (send_error) {
                        statusNode.status({fill: "red", shape: "ring", text: send_error});
                    });
                }catch(e){
                    statusNode.status({fill: "red", shape: "ring", text: 'parse fail'});
                }

            }, function (res_error) {
                statusNode.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("EmailSend", EmailSendNode);
};