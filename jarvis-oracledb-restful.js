/*jslint node:true*/

var express = require('express');
var bodyParser = require('body-parser');
var oracledb = require('oracledb');

var logger = require('./lib/logger.js');

var appConfig = require('./conf/appconfig.json');
var dbConfig = require('./conf/dbconfig.json'); // oracledb.getConnection() conAttrs

var app = express();

// Use body parser to parse JSON body
app.use(bodyParser.json());

// Http Method: GET
// URI        : /jarvis
// Read all the data
app.get('/jarvis', function (req, res) {
    "use strict";

    var time = new Date();

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM JARVIS", {}, {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error getting the data",
                    detailed_message: err.message
                }));
            } else {
                for (var i = 0, len = result.rows.length; i < len; ++i) {
                    try {
                        result.rows[i].VALUE = JSON.parse(result.rows[i].VALUE); // Convert to JSON if VALUE is JSON object
                    } catch (e) {
                    }
                }
                res.contentType('application/json').status(200).send(JSON.stringify(result.rows));
            }

            logger.writeLog(req, res, err, time);

            // Release the connection
            connection.release();
        });
    });
});

// Http method: GET
// URI        : /jarvis/by_type/:TYPE
// Read the data of type given in :TYPE
app.get('/jarvis/by_type/:TYPE', function (req, res) {
    "use strict";

    var time = new Date();

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM JARVIS WHERE TYPE = :TYPE", [req.params.TYPE], {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err || result.rows.length < 1) {
                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the data" : "Type doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                for (var i = 0, len = result.rows.length; i < len; ++i) {
                    try {
                        result.rows[i].VALUE = JSON.parse(result.rows[i].VALUE); // Convert to JSON if VALUE is JSON object
                    } catch (e) {
                    }
                }
                res.contentType('application/json').status(200).send(JSON.stringify(result.rows));
            }

            logger.writeLog(req, res, err, time);

            // Release the connection
            connection.release();
        });
    });
});

// Http method: GET
// URI        : /jarvis/by_id/:ID
// Read the data of ID given in :ID
app.get('/jarvis/by_id/:ID', function (req, res) {
    "use strict";

    var time = new Date();

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("SELECT * FROM JARVIS WHERE ID = :ID", [req.params.ID], {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err || result.rows.length < 1) {
                res.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                res.status(status).send(JSON.stringify({
                    status: status,
                    message: err ? "Error getting the data" : "ID doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                for (var i = 0, len = result.rows.length; i < len; ++i) {
                    try {
                        result.rows[i].VALUE = JSON.parse(result.rows[i].VALUE); // Convert to JSON if VALUE is JSON object
                    } catch (e) {
                    }
                }
                res.contentType('application/json').status(200).send(JSON.stringify(result.rows));
            }

            logger.writeLog(req, res, err, time);

            // Release the connection
            connection.release();
        });
    });
});

// Http method: POST
// URI        : /jarvis
// Creates a new data
app.post('/jarvis', function (req, res) {
    "use strict";

    var time = new Date();

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }
    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }
        connection.execute("INSERT INTO JARVIS (TYPE, VALUE) VALUES (:TYPE, :VALUE) ",
            [req.body.TYPE, req.body.VALUE],
            {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err.message.indexOf("ORA-00001") > -1 ? "ID already exists" : "Input Error",
                        detailed_message: err.message
                    }));
                } else {
                    // Successfully created the resource
                    res.status(201).set('Location', '/jarvis/by_type/' + req.body.TYPE).end();
                }

                logger.writeLog(req, res, err, time);

                // Release the connection
                connection.release();
            });
    });
});

// Build UPDATE statement and prepare bind variables
var buildUpdateStatement = function buildUpdateStatement(req) {
    "use strict";
    var statement = "",
        bindValues = {};
    if (req.body.TYPE) {
        statement += "TYPE = :TYPE";
        bindValues.TYPE = req.body.TYPE;
    }
    if (req.body.VALUE) {
        if (statement) statement = statement + ", ";
        statement += "VALUE = :VALUE";
        bindValues.VALUE = req.body.VALUE;
    }

    statement += " WHERE ID = :ID";
    bindValues.ID = req.params.ID;
    statement = "UPDATE JARVIS SET " + statement;

    return {
        statement: statement,
        bindValues: bindValues
    };
};

// Http method: PUT
// URI        : /jarvis/by_id/:ID
// Update the data of ID given in :ID
app.put('/jarvis/by_id/:ID', function (req, res) {
    "use strict";

    var time = new Date();

    if ("application/json" !== req.get('Content-Type')) {
        res.set('Content-Type', 'application/json').status(415).send(JSON.stringify({
            status: 415,
            message: "Wrong content-type. Only application/json is supported",
            detailed_message: null
        }));
        return;
    }

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json').status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        var updateStatement = buildUpdateStatement(req);
        connection.execute(updateStatement.statement, updateStatement.bindValues, {
                autoCommit: true,
                outFormat: oracledb.OBJECT // Return the result as Object
            },
            function (err, result) {
                if (err || result.rowsAffected === 0) {
                    // Error
                    res.set('Content-Type', 'application/json');
                    res.status(400).send(JSON.stringify({
                        status: 400,
                        message: err ? "Input Error" : "ID doesn't exist",
                        detailed_message: err ? err.message : ""
                    }));
                } else {
                    // Resource successfully updated. Sending an empty response body. 
                    res.status(204).end();
                }

                logger.writeLog(req, res, err, time);

                // Release the connection
                connection.release();
            });
    });
});

// Http method: DELETE
// URI        : /jarvis/by_id/:ID
// Delete the data of ID given in :ID
app.delete('/jarvis/by_id/:ID', function (req, res) {
    "use strict";

    var time = new Date();

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            // Error connecting to DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error connecting to DB",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("DELETE FROM JARVIS WHERE ID = :ID", [req.params.ID], {
            autoCommit: true,
            outFormat: oracledb.OBJECT
        }, function (err, result) {
            if (err || result.rowsAffected === 0) {
                // Error
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                    status: 400,
                    message: err ? "Input Error" : "ID doesn't exist",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                // Resource successfully deleted. Sending an empty response body. 
                res.status(204).end();
            }

            logger.writeLog(req, res, err, time);

            // Release the connection
            connection.release();
        });
    });
});

var server = app.listen(appConfig.listen.port, function () {
    "use strict";

    var host = appConfig.listen.address,
        port = appConfig.listen.port;

    console.log('Server is listening at http://%s:%s', host, port);
});
