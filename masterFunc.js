function startNewMultiRoundMaster() {
    var rows = parseInt($("#rows").val());
    var cols = parseInt($("#cols").val());
    currentPlayer = 0;
    currentRound = 1;
    if (hexagonGrid) {
        hexagonGrid.clearCanvas();
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

    sendToSlavesToInit();

    hexagonGrid.canvas.removeEventListener("mousedown", onPlayerClick);
    hexagonGrid.canvas.addEventListener("mousedown", onPlayerClickMulti);
    $('.currentPlayer').show();

    broadcastScoreTable();
}

function sendToSlavesToInit() {
    connections.forEach(function(conn, i) {
        conn.send({
            command: 'initHex',
            gridMatrix: hexagonGrid.gridMatrix,
            rows: hexagonGrid.rows,
            cols: hexagonGrid.cols,
            playersLength: players.length,
        });
    });
}

function masterReceive(data) {
    if (data.command == 'slaveMove') {
        clickedTile(data.tile);
    }
}

function sendEndMoveLastSlave() {
    connections[currentPlayer - 1].send({
        command: 'endMove',
    });
}

function sendMoveToNextSlave() {
    connections[currentPlayer - 1].send({
        command: 'move',
    });
}

function broadcastGridStatus() {
    connections.forEach(function(conn) {
        conn.send({
            command: 'update',
            gridMatrix: hexagonGrid.gridMatrix
        });
    });
}

function closeHandlingMaster(){
  hexagonGrid.canvas.removeEventListener('mousedown', onPlayerClickMulti);
  $("#multiplayer").show();
  $(".controls").show();
  $("#connectedText").hide();
  $("#multiplayerStart").hide();
  peer.destroy();
  $("#connected").text("0");
}
