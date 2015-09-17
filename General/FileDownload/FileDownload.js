var http = require('http');
var fs = require('fs');
module.exports = function (RED) {
    function FileDownloadNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            if (typeof msg.filename !== 'undefined' && msg.filename !== '')
                config.filename = msg.filename;
            try {

                var downloadurl = msg.downloadurl;
                if (typeof downloadurl === 'undefined' || downloadurl === '') {
                    node.status({fill: "red", shape: "ring", text: "download url parameter is empty"});
                    return;
                }

                if (typeof msg.filename !== 'undefined' && msg.filename !== '')
                    config.filename = msg.filename;

                var file = fs.createWriteStream(config.filename);
                var request = http.get(downloadurl, function (response) {
                    response.pipe(file);
                }).on('error', function (error) {
                    node.status({fill: "red", shape: "ring", text: error.errno});
                });                
            } catch (e) {
                node.status({fill: "red", shape: "ring", text: "Unexpected error"});
            }
        });
    }

    RED.nodes.registerType("FileDownload", FileDownloadNode);
};