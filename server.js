var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var path = require('path');

var mongoUtil = require('./server/mongoUtil');
var service = require('./server/service');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')))

app.post("/getConfig", function (req, res) {
    service.getConfig(req.body, function (err, docs) {
        if (err) {
            res.status(500).send({
                'error': 'somethingwrong'
            });
        }
        res.send(docs);
    });
});

app.post("/getChartData", function (req, res) {
    service.saveUserFilters(req.body);
    service.getFilteredData(req.body, function (err, result) {
        if (err) {
            res.status(500).send({
                'error': 'Error while applying Filters',
                'mag': err
            });
        }
        res.send(result);
    });
});

// Start the server
mongoUtil.connectToServer(function (err) {
    if (err) {
        throw err;
    }
    app.listen(3000);
    console.log("Listening on port 3000");
});