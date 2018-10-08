var mongoUtil = require('./mongoUtil');
var _mongoconfig = require('./config')._mongoconfig;
var _queryBuilder = require('./queryBuilder');

function getConfig(req, callback) {
    const query = {
        'user': req.user
    };
    mongoUtil.getDb().collection(_mongoconfig.filter_config).find({}).toArray(function (err, configRes) {
        if (err) {
            callback(err);
        } else {
            callback(null, configRes);
            // mongoUtil.getDb().collection("user_filters").find({}).toArray(function (err, userFilters) {
            //     if (err) {
            //         callback(err);
            //     } else {
            //         if (userFilters[0] && userFilters[0].filters) {
            //             configRes.forEach(function (element, index) {
            //                 element.condition_json.selected = userFilters[0].filters[index].filters;
            //             });
            //         }
            //         callback(null, configRes);
            //     }
            // });
        }
    });
}

function saveUserFilters(userFilters) {
    var temp = {
        'user': userFilters.user,
        filters: ''
    };
    temp.filters = userFilters.filters.map(function (obj) {
        return {
            'id': obj.pharma_field_id,
            'filters': obj.condition_json['selected']
        }
    });
    mongoUtil.getDb().collection(_mongoconfig.user_filters).replaceOne({
            user: temp.user
        },
        temp, {
            upsert: true
        },
        function (err, res) {
            console.log(err)
        });
}

function getchartData(userFilters, callback){
    if (!(userFilters.chart.chart && userFilters.chart.metric)) {
        callback({
            'err': 'Please Select Metric and Chart !'
        });
    }
    var query = _queryBuilder.getFilteredDataQuery(userFilters);
    // get chart specific query
    query = _queryBuilder.getChartLevelQuery(query, userFilters);
    console.log(JSON.stringify(query));   

    mongoUtil.getDb().collection(_mongoconfig.patient_collection).aggregate(query, { allowDiskUse: true }).toArray(function (err, res) {
        if (err) {
            callback(err);
        } else {
            callback(null, res);
        }
    });
}

function getFilteredData(userFilters, callback){

    var query = _queryBuilder.getFilteredDataQuery(userFilters);

    mongoUtil.getDb().collection(_mongoconfig.patient_collection).aggregate(query, { allowDiskUse: true }).toArray(function (err, res) {
        if (err) {
            callback(err);
        } else {
            callback(null, res);
        }
    });

}

module.exports = {
    getConfig: getConfig,
    saveUserFilters: saveUserFilters,
    getFilteredData: getFilteredData,
    getchartData: getchartData
}