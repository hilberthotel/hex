// Hex math defined here: http://blog.ruslans.com/2011/02/hexagonal-grid-math.html

function HexagonGrid(canvasId, radius) {
    this.radius = radius;

    this.height = Math.sqrt(3) * radius;
    this.width = 2 * radius;
    this.side = (3 / 2) * radius;

    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');

    this.canvasOriginX = 0;
    this.canvasOriginY = 0;

    //format: [col, row]
    this.oddNighbours = [
        [0, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0]
    ];
    this.evenNighbours = [
        [0, -1],
        [1, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
        [-1, -1]
    ];

    this.canvas.onselectstart = function() { //disable selection of text when double clicking
        return false;
    }
};

// function returns neighbours of given tile at col,row
HexagonGrid.prototype.findNeighbours = function(col, row) {
    var neighbours;
    var tempHexagon = this;
    if (col % 2 == 0) { // even col
        neighbours = this.evenNighbours.map(function(next) {
            var nextCol = col + next[0];
            var nextRow = row + next[1];
            if (tempHexagon.isInsideBoard(nextCol, nextRow))
                return {
                    "column": nextCol,
                    "row": nextRow
                };
        });
    } else { //odd col
        neighbours = this.oddNighbours.map(function(next) {
            var nextCol = col + next[0];
            var nextRow = row + next[1];
            if (tempHexagon.isInsideBoard(nextCol, nextRow))
                return {
                    "column": nextCol,
                    "row": nextRow
                };
        });
    }
    return neighbours.filter(function(n) {
        return n != undefined
    });
}

HexagonGrid.prototype.drawHexGrid = function(rows, cols, originX, originY, isDebug) {
    this.canvasOriginX = originX;
    this.canvasOriginY = originY;

    this.rows = rows;
    this.cols = cols;

    this.gridMatrix = new Array(this.cols);

    var currentHexX;
    var currentHexY;
    var debugText = "";

    var offsetColumn = false;

    for (var col = 0; col < cols; col++) {
        this.gridMatrix[col] = new Array(rows);
        for (var row = 0; row < rows; row++) {

            if (!offsetColumn) {
                currentHexX = (col * this.side) + originX;
                currentHexY = (row * this.height) + originY;
            } else {
                currentHexX = col * this.side + originX;
                currentHexY = (row * this.height) + originY + (this.height * 0.5);
            }

            if (isDebug) {
                debugText = col + "," + row;
            }
            this.drawHex(currentHexX, currentHexY, "#ddd", debugText);
            this.gridMatrix[col][row] = -1; //as not selected tile
        }
        offsetColumn = !offsetColumn;
    }
};

// function randomize colors for all tiles on grid
HexagonGrid.prototype.colorizeRandomGrid = function(players) {
    for (var i = 0; i < this.gridMatrix.length; i++) {
        for (var j = 0; j < this.gridMatrix[i].length; j++) {
            this.gridMatrix[i][j] = Math.floor(Math.random() * players.length);
            this.drawHexAtColRow(i, j, players[this.gridMatrix[i][j]].color);
        }
    }
}
HexagonGrid.prototype.colorizeWithGridPattern = function(gridMtx){
    this.gridMatrix = gridMtx;
    for (var i = 0; i < this.gridMatrix.length; i++) {
        for (var j = 0; j < this.gridMatrix[i].length; j++) {
            this.drawHexAtColRow(i, j, players[this.gridMatrix[i][j]].color);
        }
    }
}

HexagonGrid.prototype.drawHexAtColRow = function(column, row, color) {
    var drawy = column % 2 == 0 ? (row * this.height) + this.canvasOriginY : (row * this.height) + this.canvasOriginY + (this.height / 2);
    var drawx = (column * this.side) + this.canvasOriginX;

    this.drawHex(drawx, drawy, color, "");
};

HexagonGrid.prototype.drawMultipleHex = function(colRowArray, color) {
    for (var i = 0; i < colRowArray.length; i++) {
        var currCell = colRowArray[i];
        this.drawHexAtColRow(currCell.column, currCell.row, currCell.color);
    }
};

HexagonGrid.prototype.drawHex = function(x0, y0, fillColor, debugText) {
    this.context.strokeStyle = "#000";
    this.context.beginPath();
    this.context.moveTo(x0 + this.width - this.side, y0);
    this.context.lineTo(x0 + this.side, y0);
    this.context.lineTo(x0 + this.width, y0 + (this.height / 2));
    this.context.lineTo(x0 + this.side, y0 + this.height);
    this.context.lineTo(x0 + this.width - this.side, y0 + this.height);
    this.context.lineTo(x0, y0 + (this.height / 2));

    if (fillColor) {
        this.context.fillStyle = fillColor;
        this.context.fill();
    }

    this.context.closePath();
    this.context.stroke();

    if (debugText) {
        this.context.font = "8px";
        this.context.fillStyle = "#000";
        this.context.fillText(debugText, x0 + (this.width / 2) - (this.width / 4), y0 + (this.height - 5));
    }
};

//Recusivly step up to the body to calculate canvas offset.
HexagonGrid.prototype.getRelativeCanvasOffset = function() {
    var x = 0,
        y = 0;
    var layoutElement = this.canvas;
    if (layoutElement.offsetParent) {
        do {
            x += layoutElement.offsetLeft;
            y += layoutElement.offsetTop;
        } while (layoutElement = layoutElement.offsetParent);

        return {
            x: x,
            y: y
        };
    }
}

//Uses a grid overlay algorithm to determine hexagon location
//Left edge of grid has a test to acuratly determin correct hex
HexagonGrid.prototype.getSelectedTile = function(mouseX, mouseY) {

    var offSet = this.getRelativeCanvasOffset();

    mouseX -= offSet.x;
    mouseY -= offSet.y;

    var column = Math.floor((mouseX) / this.side);
    var row = Math.floor(
        column % 2 == 0 ? Math.floor((mouseY) / this.height) : Math.floor(((mouseY + (this.height * 0.5)) / this.height)) - 1);


    //Test if on left side of frame
    if (mouseX > (column * this.side) && mouseX < (column * this.side) + this.width - this.side) {


        //Now test which of the two triangles we are in
        //Top left triangle points
        var p1 = new Object();
        p1.x = column * this.side;
        p1.y = column % 2 == 0 ? row * this.height : (row * this.height) + (this.height / 2);

        var p2 = new Object();
        p2.x = p1.x;
        p2.y = p1.y + (this.height / 2);

        var p3 = new Object();
        p3.x = p1.x + this.width - this.side;
        p3.y = p1.y;

        var mousePoint = new Object();
        mousePoint.x = mouseX;
        mousePoint.y = mouseY;

        if (this.isPointInTriangle(mousePoint, p1, p2, p3)) {
            column--;

            if (column % 2 != 0) {
                row--;
            }
        }

        //Bottom left triangle points
        var p4 = new Object();
        p4 = p2;

        var p5 = new Object();
        p5.x = p4.x;
        p5.y = p4.y + (this.height / 2);

        var p6 = new Object();
        p6.x = p5.x + (this.width - this.side);
        p6.y = p5.y;

        if (this.isPointInTriangle(mousePoint, p4, p5, p6)) {
            column--;

            if (column % 2 == 0) {
                row++;
            }
        }
    }

    return {
        row: row,
        column: column
    };
};

HexagonGrid.prototype.clearCanvas = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

HexagonGrid.prototype.sign = function(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

HexagonGrid.prototype.isPointInTriangle = function isPointInTriangle(pt, v1, v2, v3) {
    var b1, b2, b3;

    b1 = this.sign(pt, v1, v2) < 0.0;
    b2 = this.sign(pt, v2, v3) < 0.0;
    b3 = this.sign(pt, v3, v1) < 0.0;

    return ((b1 == b2) && (b2 == b3));
};

HexagonGrid.prototype.isInsideBoard = function(col, row) {
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows
};

HexagonGrid.prototype.getClickedTile = function(e) {
    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var tile = this.getSelectedTile(localX, localY);
    if (this.isInsideBoard(tile.column, tile.row)) {
        return tile;
    }
};

HexagonGrid.prototype.setGridValue = function(col, row, playerIdx) {
    this.gridMatrix[col][row] = playerIdx;
};

HexagonGrid.prototype.setMultipleValues = function(vals) {
    for (var i = 0; i < vals.length; i++) {
        var currCell = vals[i];
        this.setGridValue(currCell.column, currCell.row, currCell.player);
    }
};

HexagonGrid.prototype.isSafe = function(tile, visited) {
    for (var i = 0; i < visited.length; i++) {
        //comparing objects by value (fastest way, but need to be careful about order of key:value)
        if (JSON.stringify(visited[i]) === JSON.stringify(tile))
            return false;
    }
    return true;
}

HexagonGrid.prototype.findConnected = function(tile, player, connected, visited) {
    var neighbours = this.findNeighbours(tile.column, tile.row);
    for (var i = 0; i < neighbours.length; i++) {
        var currentTile = neighbours[i];
        if (this.isSafe(currentTile, visited)) {
            visited.push(currentTile);
            if (this.gridMatrix[currentTile.column][currentTile.row] == player) {
                connected.push(currentTile);
                this.findConnected(currentTile, player, connected, visited);
            }
        }
    }
    return connected;
}
HexagonGrid.prototype.getConnected = function(tile, player) {
    var visited = [];
    var connected = [];
    connected = this.findConnected(tile, player, connected, visited);
    return connected;
    //callback(total);
    //var neighbours = this.findNeighbours(tile.column, tile.row);
}

HexagonGrid.prototype.findTotalColors = function(numPlayers) {
    var totalColors = {};
    for (var i = 0; i < numPlayers; i++) {
        totalColors[i] = 0;
    }
    for (var i = 0; i < this.gridMatrix.length; i++) {
        for (var j = 0; j < this.gridMatrix[i].length; j++) {
            totalColors[this.gridMatrix[i][j]] += 1;
        }
    }
    return totalColors;
}
