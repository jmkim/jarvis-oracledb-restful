/**
 * Created by jmkim on 5/29/17.
 */

exports.writeLog = function (req, res, msg, time) {
    "use strict";

    var ipAddr, ua;

    try {
        ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    } catch (e) {
    }

    try {
        ua = req.headers['user-agent'];
    } catch (e) {
    }

    console.log('%s', JSON.stringify({
        'time': time,
        'statusCode': res.statusCode,
        'url': req.url,
        'ipAddr': ipAddr,
        'ua': ua,
        'msg': msg
    }));
};
