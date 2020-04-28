var players;
var currentPlayer;
var currentRound;
// delay (timeout) between each player (in seconds)
var delayBetweenPlayers = 1;

// init rules
var rules = {
    numMoves: 1,
    numPlayers: 4,
    centralField: true,
    minColorsArround: 1,
    maxColorsArround: 6,
    randomLast: false,
    randomLastNeighbours: false,
};

// possible colors for players
var colors = ["red", "blue", "green", "orange"];

// create HexagonGrid
<!-- canvasId, radius -->
var hexagonGrid = new HexagonGrid("HexCanvas", 20);

hexagonGrid.canvas.addEventListener("mousedown", onPlayerClick);

// initialize new round
function newRound() {
    hexagonGrid.canvas.addEventListener("mousedown", onPlayerClick);
    var rows = parseInt($("#rows").val());
    var cols = parseInt($("#cols").val());
    currentPlayer = 0;
    currentRound = 1;

    if (hexagonGrid) {
        hexagonGrid.clearCanvas();
    }
    players = [];
    for (var i = 0; i < rules.numPlayers; i++) {
        players.push(new Player(colors[i]));
    }
    // draw hexGrid in rows * cols dimension
    <!-- rows, cols, originX, originY, isDebug -->
    hexagonGrid.drawHexGrid(rows, cols, 0, 0, false);

    // adjust canvas height & width based on number of rows * cols
    hexagonGrid.canvas.height = 40 * rows;
    hexagonGrid.canvas.width = 32 * cols;
    hexagonGrid.canvas.style.height = (40 * rows) + "px";
    hexagonGrid.canvas.style.width = (32 * cols) + "px";


    // random colors for grid
    hexagonGrid.colorizeRandomGrid(players);

    // initialize score table
    initRoundScoresTable();
    initScoreTable();
    addNewTableRow();

    updateTotalColors();

    showCurrentPlayer();
    initCharts();

}

// function returns array which have length between min - max
// elements in array are unique and in range [0,5]
// i.e for min=3, max=5 returns [0,1,4] or [1,2,0] or [4,1,2,0],...
function getRandomRange(min, max) {
    var arr = []
    var maxLimit = Math.floor(Math.random() * (max - min + 1) + min);
    while (arr.length < min || arr.length < maxLimit) {
        var randomnumber = Math.floor(Math.random() * 6); //[0,5]
        var found = false;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == randomnumber) {
                found = true;
                break;
            }
        }
        if (!found) arr[arr.length] = randomnumber;
    }
    return arr;
}

function getNextPlayer() {
    currentPlayer++;
    if (currentPlayer >= players.length) {
        endRoundScoresCalculation();
        updateCharts(currentRound);
        currentPlayer = 0;
        currentRound++;
        addNewTableRow();
    }
    showCurrentPlayer();

}

function showCurrentPlayer() {
    headerRow = document.getElementById("headerRow");
    for (var i = 0; i < headerRow.cells.length; i++) {
        if (i == currentPlayer)
            headerRow.cells[i].style.backgroundColor = colors[i];
        else
            headerRow.cells[i].style.backgroundColor = '';
    }
}

function updateTotalColors() {
    var totalColors = document.getElementById("totalColors");
    totalColors.innerHTML = "";
    var numColors = hexagonGrid.findTotalColors(players.length);
    for (var i = 0; i < players.length; i++) {
        var span = document.createElement("span");
        span.style.color = players[i].color;
        span.innerHTML = numColors[i] + " ";
        totalColors.appendChild(span);
    }
}

function initRoundScoresTable() {
    var tooltipTexts = [
        "Rules",
        "Adds 1 point to winner of the round",
        "Substract 1 point to last player (i.e smallest points)",
        "winner (i.e player with most points in round) gets points of all players"
    ];
    var scoreTable = document.getElementById('scores');
    scoreTable.innerHTML = "";
    var table = document.createElement("table");
    table.setAttribute("id", "roundTable");
    for (var i = 0; i < 4; i++) {
        var currRow = table.insertRow(i);
        for (var j = 0; j <= players.length; j++) {
            var cell = currRow.insertCell(j);
            if (i == 0 && j != 0) {
                cell.innerHTML = "P" + (j - 1);
                cell.style.backgroundColor = colors[j - 1];
            } else if (j != 0)
                cell.innerHTML = 0;
            else if (j == 0) {
                var tooltipDiv = document.createElement("div");
                tooltipDiv.innerHTML = "i";
                tooltipDiv.setAttribute("class", "tooltip");
                tooltipDiv.setAttribute("id", "i" + i);
                var tooltipText = document.createElement("span");
                tooltipText.innerHTML = tooltipTexts[i];
                tooltipDiv.appendChild(tooltipText);
                cell.appendChild(tooltipDiv);
            }
        }
    }
    scoreTable.appendChild(table);
}
// initialize score table
function initScoreTable() {
    var scoreTable = document.getElementById('scores');
    //scoreTable.innerHTML = "";
    var table = document.createElement("table");
    table.setAttribute("id", "scoreTable");
    var firstRow = table.insertRow(0);
    firstRow.setAttribute("id", "headerRow")
    var sumRow = table.insertRow(-1);
    for (var i = 0; i < players.length; i++) {
        firstRow.insertCell(i).innerHTML = "P" + i;
        sumRow.insertCell(i).innerHTML = "0";
    }
    sumRow.setAttribute("id", "sumRow");
    scoreTable.appendChild(table);

}

function addNewTableRow() {
    var table = document.getElementById("scoreTable");
    var currentRow = table.insertRow(currentRound);
    for (var i = 0; i < players.length; i++) {
        currentRow.insertCell(i).innerHTML = "0";
    }
}

function updateScoreTableRow() {
    var table = document.getElementById("scoreTable");
    var currentRow = table.rows[currentRound];
    currentRow.cells[currentPlayer].innerHTML = players[currentPlayer].score;

    var sumRow = document.getElementById("sumRow");
    sumRow.cells[currentPlayer].innerHTML = players[currentPlayer].total;

}
// calculate round winner based on move scores
// 1 row means 1 different rule
// - adds 1 point to winner of the round [1]
// - substract 1 point to last player (i.e smallest points) [2]
// - winner (i.e player with most points in round) gets points of all players [3]
function endRoundScoresCalculation() {
    var table = document.getElementById("scoreTable");
    var lastRow = table.rows[table.rows.length - 2]; // -1 is SUM row
    var max = 0;
    var min;
    var maxArr = [];
    var minArr = [];
    var roundSum = 0;

    //find minimum & maximum (i.e loser & winner)
    for (var i = 0; i < lastRow.cells.length; i++) {
        currentValue = parseInt(lastRow.cells[i].innerHTML)
        roundSum += currentValue;
        if (currentValue > max) {
            max = currentValue;
        }
        if (currentValue < min || min === undefined) {
            min = currentValue;
        }
    }

    //check if more winners or losers
    for (var i = 0; i < lastRow.cells.length; i++) {
        currentValue = parseInt(lastRow.cells[i].innerHTML)
        if (currentValue == max)
            maxArr.push(i);
        else if (currentValue == min)
            minArr.push(i);
    }

    //update each rule (for winners)
    var table = document.getElementById("roundTable");
    for (var i = 0; i < maxArr.length; i++) {
        var winnerIndex = maxArr[i];
        var cellValue = parseInt(table.rows[1].cells[winnerIndex + 1].innerHTML);
        //adds 1 point to winner of the round [1]
        table.rows[1].cells[winnerIndex + 1].innerHTML = cellValue + 1;
        table.rows[2].cells[winnerIndex + 1].innerHTML = cellValue + 1;
        var cellValue = parseInt(table.rows[3].cells[winnerIndex + 1].innerHTML);
        table.rows[3].cells[winnerIndex + 1].innerHTML = cellValue + roundSum;
    }

    // update each rule (for losers)
    for (var i = 0; i < minArr.length; i++) {
        var loserIndex = minArr[i];
        var cellValue = parseInt(table.rows[1].cells[loserIndex + 1].innerHTML);
        //substract 1 point to loser of the round [1]
        table.rows[2].cells[loserIndex + 1].innerHTML = cellValue - 1;
    }

}
// function sets colors for given tiles based on rules (min & max colors)
function setColorsForTiles(tiles) {
    var range = getRandomRange(rules.minColorsArround, rules.maxColorsArround);
    for (var i = 0; i < tiles.length; i++) {
        //check if current tile is selected to be colored in players color
        if (!!~range.indexOf(i)) { // if range.contains(i)
            tiles[i].color = players[currentPlayer].color;
            tiles[i].player = currentPlayer;
        } else {
            var randomPlayerIndex = currentPlayer;
            if (players.length > 1) {
                while (randomPlayerIndex == currentPlayer)
                    randomPlayerIndex = Math.floor(Math.random() * players.length);
            }

            tiles[i].color = players[randomPlayerIndex].color;
            tiles[i].player = randomPlayerIndex;
        }
    }

}

// function randomize colors for given tiles
function randomizeColors(tiles) {
    for (var i = 0; i < tiles.length; i++) {
        randomIndex = Math.floor(Math.random() * players.length);
        tiles[i].color = players[randomIndex].color;
        tiles[i].player = randomIndex;
    }
}

function randomizePlayersPattern(tiles) {
    for (var i = 0; i < tiles.length; i++) {
        if (tiles[i].color == players[currentPlayer].color) {
            randomIndex = Math.floor(Math.random() * players.length);
            if (players.length > 1) {
                while (randomIndex == currentPlayer) {
                    randomIndex = Math.floor(Math.random() * players.length);
                }
            }
            tiles[i].color = players[randomIndex].color;
            tiles[i].player = randomIndex;
        }
    }
}

// eventlistener function
function onPlayerClick(e) {
    var tile = hexagonGrid.getClickedTile(e);
    if (tile != undefined) {
        rules.numMoves--;
        hexagonGrid.canvas.removeEventListener("mousedown", onPlayerClick);
        var neighbours = hexagonGrid.findNeighbours(tile.column, tile.row);
        setColorsForTiles(neighbours);
        if (rules.centralField) {
            hexagonGrid.drawHexAtColRow(tile.column, tile.row, players[currentPlayer].color);
            hexagonGrid.setGridValue(tile.column, tile.row, currentPlayer);
        } else {
            var randomPlayerIndex = currentPlayer;
            if (players.length > 1) {
                while (randomPlayerIndex == currentPlayer)
                    randomPlayerIndex = Math.floor(Math.random() * players.length);
            }
            hexagonGrid.drawHexAtColRow(tile.column, tile.row, players[randomPlayerIndex].color);
            hexagonGrid.setGridValue(tile.column, tile.row, randomPlayerIndex);
        }

        hexagonGrid.drawMultipleHex(neighbours);
        hexagonGrid.setMultipleValues(neighbours);
        var connected = hexagonGrid.getConnected(tile, currentPlayer);
        players[currentPlayer].score = connected.length;
        if (rules.numMoves == 0) {
            rules.numMoves = parseInt($("#numMoves").val());
            players[currentPlayer].total += connected.length;
            setTimeout(function() {
                getNextPlayer();
                if (rules.randomLast) {
                    //if randomize whole pattern
                    randomizeColors(connected);

                    //randomize only last neighbours in players color
                    //randomizePlayersPattern(neighbours);

                    hexagonGrid.drawMultipleHex(connected);
                    hexagonGrid.setMultipleValues(connected);
                }
                hexagonGrid.canvas.addEventListener("mousedown", onPlayerClick);
            }, 1000 * delayBetweenPlayers);
        } else {
            hexagonGrid.canvas.addEventListener("mousedown", onPlayerClick);
        }
        updateScoreTableRow();
        updateTotalColors();
    }

}

$(document).ready(function() {});

$("#new").click(function() {
    newRound();
});

$(".chb").change(function() {
    var checked = $(this).is(':checked');
    $(".chb").prop('checked', false);
    if (checked) {
        $(this).prop('checked', true);
    }
});

$("input").change(function() {
    rules = {
        numMoves: parseInt($("#numMoves").val()),
        numPlayers: parseInt($("#numPlayers").val()),
        centralField: $("#centralField").is(":checked"),
        minColorsArround: parseInt($("#minColors").val()),
        maxColorsArround: parseInt($("#maxColors").val()),
        randomLast: $("#randomLast").is(":checked"),
        randomLastNeighbours: $("#randomLastNeighbours").is(":checked")
    };
    //hexagonGrid.clearCanvas();
    //hexagonGrid.setRules(rules);
});
