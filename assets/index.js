var config = [];
var chartSelected = {
    'chart': '',
    'metric': ''
};

function setRangeFilters(type, field, val) {
    config.forEach(function (ele) {
        if (ele.pharma_field_id == field) {
            ele.condition_json['selected'] ? null : ele.condition_json['selected'] = {};
            ele.condition_json['selected'][type] = val;
        }
    })
}

function setRadioFilters(val, field) {
    config.forEach(function (ele) {
        if (ele.pharma_field_id == field) {
            ele.condition_json['selected'] = val;
        }
    })
}

function setCheckboxFilters(val, field, flag) {
    console.log(arguments)
    config.forEach(function (ele) {
        if (ele.pharma_field_id == field) {
            ele.condition_json['selected'] ? null : ele.condition_json['selected'] = [];
            flag == true ?
                (ele.condition_json['selected'].indexOf(val) == -1 ? ele.condition_json['selected'].push(val) : '') :
                (ele.condition_json['selected'].splice(ele.condition_json['selected'].indexOf(val), 1));
        }
    })
    console.log(config)
}

function updateFilters(obj) {
    var domElemContainer = $('#filters')
    var groups = [];
    obj.forEach(function (filterSet) {
        if (groups.indexOf(filterSet.group_name) === -1) {
            groups.push(filterSet.group_name);
            domElemContainer.append(filterSet.group_name + '<div id="' + filterSet.group_name + '" style="border:1px solid black;"></div>');
        }
        var optionGroup = '<div id="' + filterSet.field_name + '">';
        optionGroup = optionGroup + filterSet.field_label + '<span>';

        switch (filterSet.condition_json.field_type) {
            case 'checkbox':
                for (var property in filterSet.condition_json.options) {
                    var optHtml = '<span style="padding: 0;">';
                    optHtml = optHtml + '<input type="checkbox" onclick="setCheckboxFilters(' +
                        "'" + filterSet.condition_json.options[property] + "'," +
                        filterSet.pharma_field_id + ', this.checked);"> <label>' + filterSet.condition_json
                        .options[property] + '</label>';
                    optHtml = optHtml + '</span>';
                    optionGroup = optionGroup + optHtml
                };
                break;

            case 'range':
                optionGroup = optionGroup +
                    '<input type="number" placeholder="From" oninput="setRangeFilters(' +
                    "'From'," + filterSet.pharma_field_id + ', $(this).val())">' +
                    '<input type="number" placeholder="To" oninput="setRangeFilters(' +
                    "'To'," + filterSet.pharma_field_id + ', $(this).val())">';
                break;

            case 'radio':
                for (var property in filterSet.condition_json.options) {
                    var optHtml = '<span style="padding: 0;">';
                    optHtml = optHtml + '<input type="radio" name="' + filterSet.field_name +
                        '" onclick="setRadioFilters(' + "'" + filterSet.condition_json.options[property] + "'," + filterSet.pharma_field_id + ')" > <label>' +
                        filterSet.condition_json.options[property] + '</label>';
                    optHtml = optHtml + '</span>';
                    optionGroup = optionGroup + optHtml
                };
                break;
        }

        optionGroup = optionGroup + '</span></div>';

        // document.getElementById because space is not valid in id attribute, hence jquery results undefined
        $(document.getElementById(filterSet.group_name)).append(optionGroup);
    });

    // Select metric
    var chartHtml = '<select id="chart_on_metric" onchange="showChartTypes(this.value, this.selectedIndex-1);">' +
        '<option value = "chartOn"> Chart On </option>';
    obj.forEach(function (filterSet) {
        chartHtml = chartHtml + '<option value = "' + filterSet.field_name + '"> ' + filterSet.field_label + ' </option>';
    });
    chartHtml = chartHtml + '</select>';

    // Select Chart type
    chartHtml = chartHtml + '<select id="chart_type" onchange="setChartType(this.value)">' +
        '<option value = "chartOn"> Chart Type </option>';
    chartHtml = chartHtml + '</select>';
    chartHtml = chartHtml + '<input type="number" placeholder="Step Size" id="hist_step" style="display:none;">';
    chartHtml = chartHtml + '<button type="button" onclick="getFilteredData(config, chartSelected);">Go!</button>';

    domElemContainer.append(chartHtml);
}

function setChartType(value){
    chartSelected.chart = value; 
    if(value == 'Histogram'){
        $('#hist_step').show();
    }else{
        $('#hist_step').hide();
    }
}

function showChartTypes(val, index) {
    chartSelected.metric = val;
    var charts = '<option value = "chartOn"> Chart Type </option>';
    config[index].chart_type_json.options.forEach(function (chart) {
        charts = charts + '<option value = "' + chart + '"> ' + chart + ' </option>';
    });
    $('#chart_type').html(charts)
}

function getFilteredData(config, chartSelected) {
    $.ajax({
        type: "POST",
        url: "/getChartData",
        data: JSON.stringify({
            'filters': config,
            'user': 'admin',
            'chart': chartSelected
        }),
        contentType: 'application/json',
        success: function (data, status) {

            var highchartsConfigObj = {
                chart: {
                    type: ''
                },
                title: {
                    text: ''
                },
                series:[{
                    name: 'Chart',
                    data: data
                }]
            };
            highchartsConfigObj = getChartConfigObj(highchartsConfigObj, chartSelected);
            $('#chart').highcharts(highchartsConfigObj);
        }
    });
}

function getChartConfigObj(chartConf, chartType){
    switch(chartType.chart){
        case 'Bar Chart':
            chartConf.chart.type = 'column';
            chartConf['xAxis'] = {type: 'category'};
        break;
        case 'Histogram':
            chartConf.chart.type = 'column';
            chartConf['xAxis'] = {type: 'category'};
            chartConf.series[0].pointPadding = 0;
            chartConf.series[0].groupPadding = 0;
            chartConf.series[0].data = dataForHistogram(chartConf.series[0].data, parseInt($('#hist_step').val()));
        break;
        default:
            chartConf.chart.type = chartSelected.chart.toLowerCase().replace(/\s/g, '');
    }
    return chartConf;
}

function dataForHistogram(data, p) {
    console.log(arguments)
    var min = data[0].name;
    var max = data[data.length -1].name;
    if(!p){
        p = (max - min)/10;
        $('#hist_step').val(p);
    }

    var histData = [];

    var obj = {'name' : min+'-'+(min+p), 'y': 0};

    for(var i=0; i<data.length; i++){
        if(data[i].name < min + p){
            obj.y = obj.y + data[i].y;
        }else{
            histData.push(obj);
            min = min + p;
            obj = {'name' : min+'-'+(min+p), 'y': 0};
            obj.y = obj.y + data[i].y;
        }
    }
    return histData;
 }

$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: "http://localhost:3000/getConfig",
        data: JSON.stringify({
            'user': 'admin'
        }),
        contentType: 'application/json',
        success: function (res, status) {
            config = res;
            console.log(res)
            updateFilters(res);
        }
    });
});