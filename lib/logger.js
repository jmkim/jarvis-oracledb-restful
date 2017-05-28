/**
 * Created by jmkim on 5/29/17.
 */

exports.writeLog = function (req, res, msg, time) {
    var ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    var ua = req.headers['user-agent'];

    console.log('%s', JSON.stringify({
        'time': time,
        'statusCode': res.statusCode,
        'url': req.url,
        'ipAddr': ipAddr,
        'ua': ua,
        'msg': msg
    }));
};
