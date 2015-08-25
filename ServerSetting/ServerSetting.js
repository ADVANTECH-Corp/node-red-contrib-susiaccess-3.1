module.exports = function (RED) {
    function ServerSettingNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on('input', function (msg) {
            var url = config.url;
            var port = config.port;
            var encodestr = config.encodestr;
            var flag = config.flag;
            msg.url = url;
            msg.port = port;
            msg.flag = flag;
            msg.encodestr = encodestr;
            node.send(msg);
        });
    }

    RED.nodes.registerType("ServerSetting", ServerSettingNode);
};