var charts = [];

function createChartData(players) {
    chartData = {
        labels: [0],
        datasets: createDataSets(players),
    };
    return chartData;
}

function createDataSets(players) {
    var dataset = [];
    for (var i = 0; i < players.length; i++) {
        dataset_player = {
            fill: false,
            lineTension: 0,
            borderColor: players[i].color,
            data: [0],
        }
        dataset.push(dataset_player);
    }
    return dataset;
}

function createChartOptions(players) {
    chartOptions = {
        type: 'line',
        data: createChartData(players),
        options: {
            title: {
                display: true,
                text: "",
            },
            responsive: false,
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
            }

        },
    };
    return chartOptions;
}

function initCharts() {
    charts.forEach(function(chart) {
        chart.destroy();
    });

    charts = [];

    $(".chart").each(function(i, chart) {
        chartOptions = createChartOptions(players);
        if (chart.id === "currentWinner") {
            chartOptions.options.title.text = "Total sum chart";
        } else {
            chartOptions.options.title.text = chart.id
        }
        charts.push(new Chart(chart, chartOptions));
    });
    for (var i = 0; i < players.length; i++) {
        var totalColors = hexagonGrid.findTotalColors(players.length);
        charts[4].data.datasets[i].data[0] = totalColors[i];
    }
    charts[4].update();
}

function updateCharts(round) {
    var scoreTable = document.getElementById('scoreTable');
    var roundTable = document.getElementById('roundTable');

    //chart[0-2] rule1-3 charts
    var roundTableCells = roundTable.rows[1].cells.length;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < roundTableCells - 1; j++) {
            var cellValue = roundTable.rows[i + 1].cells[j + 1].innerHTML;
            charts[i].data.datasets[j].data.push(parseInt(cellValue));
        }
    }

    // chart[3] total sum chart
    var scoreTableCells = scoreTable.rows[1].cells.length;
    var scoreTableRows = scoreTable.rows.length;
    for (var i = 0; i < scoreTableCells; i++) {
        var cellValue = scoreTable.rows[scoreTableRows - 1].cells[i].innerHTML;
        charts[3].data.datasets[i].data.push(parseInt(cellValue));
    }
    //chart[4] totalColors chart
    for (var i = 0; i < players.length; i++) {
        var totalColors = hexagonGrid.findTotalColors(players.length);
        charts[4].data.datasets[i].data.push(totalColors[i]);
    }

    charts.forEach(function(chart) {
        chart.data.labels.push(round);
        chart.update();
    });

}
