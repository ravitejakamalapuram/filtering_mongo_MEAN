var MongoClient = require('mongodb').MongoClient;
var _mongoconfig = require('./config')._mongoconfig;

var _db;

module.exports = {

    connectToServer: function (callback) {
        MongoClient.connect(_mongoconfig.mongo_url, {
            useNewUrlParser: true
        }, function (err, database) {
            _db = database.db(_mongoconfig.data_base);
            return callback(err);
        });
    },

    getDb: function () {
        return _db;
    }
};