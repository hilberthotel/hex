var peerJsInfo = {
    key: 'fo31egbss03yds4i'
};
var connections = [];

function initMultiplayerMode() {
    players = [];
    connections = [];
    currentPlayer = 0;
    peer = new Peer('master', peerJsInfo); //master
    peer.on('connection', function(conn) {
        connections.push(conn);
        conn.on('open', function() {
            $("#multiplayerStart").show();
            $("#connected").text(connections.length);
            addNewPlayer();
        })
        conn.on('data', masterReceive);
        conn.on('close', closeHandlingMaster);
    });
    peer.on('error', function(err) {
        console.log(err);
        if (err.type == 'unavailable-id') {
            peer = new Peer(peerJsInfo); //slave
            conn = peer.connect('master');
            conn.on('data', slaveReceive);
            conn.on('open', function() {
                $('.controls').hide();
                players = [];
            });
            conn.on('close', closeHandlingSlave)
        }
    });
    addNewPlayer();
}

function onPlayerClickMulti(e) {
    var tile = hexagonGrid.getClickedTile(e);

    clickedTile(tile);
}

function clickedTile(tile) {
    if (tile != undefined) {
        rules.numMoves--;
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
        updateScoreTableRow();
        updateTotalColors();
        if (rules.numMoves == 0) {
            rules.numMoves = parseInt($("#numMoves").val());
            players[currentPlayer].total += connected.length;
            getNextPlayerMulti(true);
            if (rules.randomLast) {
                //if randomize whole pattern
                randomizeColors(connected);

                //randomize only last neighbours in players color
                //randomizePlayersPattern(neighbours);

                hexagonGrid.drawMultipleHex(connected);
                hexagonGrid.setMultipleValues(connected);
            }
        } else {
            getNextPlayerMulti(false);
        }
    }
}

function getNextPlayerMulti(isNext) {
    if (currentPlayer != 0) {
        sendEndMoveLastSlave();
    }
    if (isNext)
        currentPlayer++;
    if (currentPlayer >= players.length) {
        endRoundScoresCalculation();
        updateCharts(currentRound);
        currentPlayer = 0;
        currentRound++;
        addNewTableRow();
    }
    showCurrentPlayer();
    if (currentPlayer != 0) {
        sendMoveToNextSlave();
        hexagonGrid.canvas.removeEventListener("mousedown", onPlayerClickMulti);
        $('.currentPlayer').hide();
    } else {
        hexagonGrid.canvas.addEventListener("mousedown", onPlayerClickMulti);
        $('.currentPlayer').show();
    }
    broadcastGridStatus();
    broadcastScoreTable();

}

function broadcastScoreTable() {
    connections.forEach(function(conn) {
        conn.send({
            command: 'updateScore',
            scoreHtml: document.getElementById("scoreTableContainer").innerHTML,
        });
    });
}

function addNewPlayer() {
    players.push(new Player(colors[players.length]));
}


$("#multiplayer").click(function() {
    initMultiplayerMode();
    $("#multiplayer").hide();
    $("#connectedText").show();
});

$("#multiplayerStart").click(function() {
    startNewMultiRoundMaster();
});
