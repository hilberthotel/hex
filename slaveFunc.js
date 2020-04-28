function initSlaveHexagon(data) {
    if (hexagonGrid) {
        hexagonGrid.clearCanvas();
    }
    players = [];
    for (var i = 0; i < data.playersLength; i++) {
        players.push(new Player(colors[i]));
    }
    // adjust canvas height & width based on number of rows * cols
    hexagonGrid.canvas.height = 40 * data.rows;
    hexagonGrid.canvas.width = 32 * data.cols;
    hexagonGrid.canvas.style.height = (40 * data.rows) + "px";
    hexagonGrid.canvas.style.width = (32 * data.cols) + "px";

    hexagonGrid.drawHexGrid(data.rows, data.cols, 0, 0, false);
    hexagonGrid.colorizeWithGridPattern(data.gridMatrix);
    hexagonGrid.canvas.removeEventListener("mousedown", onPlayerClick);
}

function slaveReceive(data) {
    if (data.command == 'initHex') {
        initSlaveHexagon(data);
    } else if (data.command == 'move') {
        hexagonGrid.canvas.addEventListener('mousedown', slaveMoveClick)
        $('.currentPlayer').show();
    } else if (data.command == 'update') {
        hexagonGrid.colorizeWithGridPattern(data.gridMatrix);
    } else if (data.command == 'endMove') {
        hexagonGrid.canvas.removeEventListener('mousedown', slaveMoveClick)
        $('.currentPlayer').hide();
    } else if (data.command == 'updateScore') {
        document.getElementById("scoreTableContainer").innerHTML = data.scoreHtml;
    }
}

function slaveMoveClick(e) {
    var tile = hexagonGrid.getClickedTile(e);
    if(tile != undefined){
      conn.send({
          command: 'slaveMove',
          tile: tile
      });
      hexagonGrid.canvas.removeEventListener('mousedown', slaveMoveClick);
    }
}

function closeHandlingSlave(){
    hexagonGrid.canvas.removeEventListener('mousedown', slaveMoveClick);
    $("#multiplayer").show();
    $(".controls").show();
    $("#connectedText").hide();
}
