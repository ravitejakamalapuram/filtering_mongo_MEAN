function getFilteredDataQuery(userFilters) {
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

    return query;
}

function getChartLevelQuery(query, userFilters){
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
    getChartLevelQuery: getChartLevelQuery,
    getFilteredDataQuery: getFilteredDataQuery
}