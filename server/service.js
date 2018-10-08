var mongoUtil = require('./mongoUtil');
var _mongoconfig = require('./config')._mongoconfig;

function getConfig(req, callback) {
    const query = {
        'user': req.user
    };
    mongoUtil.getDb().collection(_mongoconfig.filter_config).find({}).toArray(function (err, configRes) {
        if (err) {
            callback(err);
        } else {
            callback(null, configRes);
            // mongoUtil.getDb().collection("user_filters").find(query).toArray(function (err, userFilters) {
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

function getFilteredData(userFilters, callback) {
    if (!(userFilters.chart.chart && userFilters.chart.metric)) {
        callback({
            'err': 'Please Select Metric and Chart !'
        });
    }
    var query = [
        {$match: {}}
    ];

    // filter data
    userFilters.filters.forEach(function (obj) {
        if (obj.condition_json.selected && obj.condition_json.selected[0]) {
            if (obj.condition_json.field_type === 'checkbox') {
                query[0].$match[obj.field_name] = {
                    $in: obj.condition_json.selected
                };
            } else if (obj.condition_json.field_type === 'radio') {
                query[0].$match[obj.field_name] = obj.condition_json.selected;
            }
        }
        if(obj.condition_json.selected && obj.condition_json.selected.From && obj.condition_json.selected.To){
            if (obj.condition_json.field_type === 'range') {
                query[0].$match[obj.field_name] = { $gte : parseInt(obj.condition_json.selected.From), $lte : parseInt(obj.condition_json.selected.To)};
            }
        }
    });

    // get chart specific query
    query = getChartQuery(query, userFilters);     
    console.log(JSON.stringify(query))

    mongoUtil.getDb().collection(_mongoconfig.patient_collection).aggregate(query, { allowDiskUse: true }).toArray(function (err, res) {
        if (err) {
            callback(err);
        } else {
            callback(null, res);
        }
    });
}

function getChartQuery(query, userFilters){
    switch (userFilters.chart.chart){
        case 'Bar Chart':
            query.push({ $group: {_id:'$'+userFilters.chart.metric, y:{$sum: 1}}});
            query.push({ $project: { _id:0, 'name':'$_id', 'y': '$y'}});
        break;
        case 'Word Cloud':
            query.push({ $group: {_id:'$'+userFilters.chart.metric, weight:{$sum: 1}}});
            query.push({ $project: { _id:0, 'name':'$_id', 'weight': '$weight'}});
        break;
        case 'Histogram':
            query.push({ $group: {_id:'$'+userFilters.chart.metric, count:{$sum: 1}}});
            query.push({ $project: { _id:0, 'name':'$_id', 'y': '$count'}});
            query.push({$sort : { name : 1}});
        break;
    }
    return query;
}

module.exports = {
    getConfig: getConfig,
    saveUserFilters: saveUserFilters,
    getFilteredData: getFilteredData
}