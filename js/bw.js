"use strict";

var BoxWorld = {
    screen: {
        element: null,
        ctx: null,
        tilesImage: null,
        tileSize: 40,
        cols: 19,
        rows: 15
    },
    game: {
        status: false
    },
    level: {
        id: 0,
        boxCount: 0,
        boxesInPlace: 0,
        moves: 0,
        data: [],
		undoData: []
    },
    character: {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0
    },
    tile: {
        abyss: 0,
        wall: 1,
        floor: 2,
        character: 3,
        box: 4,
        boxInPlace: 5,
        place: 6,
        characterOverPlace: 7
    },
    levels: {
        0: "\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000001111000000000\
0000001261000000000\
0000001221110000000\
0000001532210000000\
0000001224210000000\
0000001221110000000\
0000001111000000000\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000000000000000000",
		1: "\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000000111100000000\
0000011122111100000\
0000012222242100000\
0000012122142100000\
0000012626132100000\
0000011111111100000\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000000000000000000\
0000000000000000000"
    },
    drawTile: function(tileId, x, y) {
        var tilePos = tileId * this.screen.tileSize;

        x = x * this.screen.tileSize;
        y = y * this.screen.tileSize;

        this.screen.ctx.drawImage(this.screen.tilesImage, tilePos, 0, this.screen.tileSize, this.screen.tileSize, x, y, this.screen.tileSize, this.screen.tileSize);
    },
    redraw: function() {
		this.level.boxesInPlace = 0;

        for (var x = 0; x < this.screen.cols; x++) {
            for (var y = 0; y < this.screen.rows; y++) {
                var tileId = this.level.data[x][y];
				
				if (tileId == this.tile.boxInPlace) {
					this.level.boxesInPlace++;
				}
				
                this.drawTile(tileId, x, y);
            }
        }
        
        var tileUnderCharacter = this.level.data[this.character.x][this.character.y];
        this.drawTile((tileUnderCharacter == this.tile.floor ? this.tile.character : this.tile.characterOverPlace), this.character.x, this.character.y);

		this.afterRedraw();
    },
	afterRedraw: function() {
		
	},
    victory: function() {
        this.game.status = false;
    },
    loadLevel: function(id) {
        var tileId;

		if (!this.levels[id]) {
			id = 0;
		}
		
		this.level.id = id;
        this.level.boxCount = 0;
        this.level.boxesInPlace = 0;
        this.level.moves = 0;
		this.level.undoData.length = 0;
		
		localStorage.setItem('boxWorldLevelId', id);

        for (var i = 0; i < this.screen.cols; i++) {
            if (!this.level.data[i])
                this.level.data[i] = [];
        }

        for (var y = 0; y < this.screen.rows; y++) {
            for (var x = y * this.screen.cols; x < y * this.screen.cols + this.screen.cols; x++) {
                tileId = this.levels[id].substring(x, x + 1);

                if (tileId == this.tile.character || tileId == this.tile.characterOverPlace) {
                    tileId = tileId == this.tile.character ? this.tile.floor : this.tile.place;

                    this.character.x = [x - this.screen.cols * y];
                    this.character.y = y;
                }

                if (tileId == this.tile.box || tileId == this.tile.boxInPlace) {
                    this.level.boxCount++;
                }

                this.level.data[x - this.screen.cols * y][y] = tileId;
            }
        }

        this.redraw();
    },
	undo: function() {
		if (this.level.undoData.length == 0) {
			return;
		}
		
		this.level.data = JSON.parse(JSON.stringify(this.level.undoData));
		
		this.level.undoData.length = 0;

		this.character.x = this.character.prevX;
		this.character.y = this.character.prevY;
		
		this.level.moves--;
		this.redraw();
	},
	setUndo: function() {
		this.character.prevX = this.character.x;
		this.character.prevY = this.character.y;

		this.level.undoData = JSON.parse(JSON.stringify(this.level.data));
	},
	setCharacterPos: function(cell) {
		this.setUndo();
	
        this.character.x = cell.x;
        this.character.y = cell.y;
        this.level.moves++;
		
	},
    move: function(cell1, cell2) {
        if (!this.game.status) {
            return;
        }

        if (cell1.x >= this.screen.cols || cell1.y >= this.screen.rows || cell1.x < 0 || cell1.y < 0) {
            return;
        }

        cell1.tile = this.level.data[cell1.x][cell1.y];
        cell2.tile = this.level.data[cell2.x][cell2.y];

        if (cell1.tile < 2) {
            return;
        }

		if (cell1.tile == this.tile.floor || cell1.tile == this.tile.place) {
			this.setCharacterPos(cell1);
		}
		
		if (cell1.tile == this.tile.box || cell1.tile == this.tile.boxInPlace) {

            if (cell2.tile < 2 || cell2.tile == this.tile.box || cell2.tile == this.tile.boxInPlace) {
                return;
            }
			
			this.setCharacterPos(cell1);

            this.level.data[cell1.x][cell1.y] = cell1.tile == this.tile.box ? this.tile.floor : this.tile.place;
            this.level.data[cell2.x][cell2.y] = (cell2.tile == this.tile.floor ? this.tile.box : this.tile.boxInPlace);
        }

		this.redraw();
		
        if (this.level.boxCount == this.level.boxesInPlace) {
			if (this.level.id + 1 >= Object.keys(this.levels).length) {
				this.victory();
			} else {
				this.loadLevel(this.level.id + 1);
			}
        }
		
    },
	keyDown: function(keyCode, ctrlKey) {
		if (!this.game.status) {
			return;
		}
		
		if (keyCode > 36 && keyCode < 41) {
			
			var cell1 = {x:this.character.x, y:this.character.y}, cell2 = {x:this.character.x, y:this.character.y};

			switch (keyCode) {
				case 37 : // arrow left
					cell1.x--;
					cell2.x = cell1.x - 1;
					break;
				case 38 : // arrow up
					cell1.y--;
					cell2.y = cell1.y - 1;
					break;
				case 39 : // arrow right
					cell1.x++;
					cell2.x = cell1.x + 1;
					break;
				case 40 : // arrow down
					cell1.y++;
					cell2.y = cell1.y + 1;
					break;
				default :
					return;
			}
			
			this.move(cell1, cell2);
		}
		
		if (keyCode == 90 && ctrlKey) {
			this.undo();
		}
		
		if (keyCode == 113) {
			this.loadLevel(this.level.id);
		}
	},
	setSkin: function(imgSrc) {
		this.screen.tilesImage = new Image();
		this.screen.tilesImage.src = imgSrc;
	},
    init: function() {
        var self = this;

        this.game.status = true;

        this.screen.element = document.getElementById('boxWorldScreen');
        this.screen.ctx = this.screen.element.getContext('2d');

        this.setSkin(document.getElementById('boxWorldTiles').getAttribute("src"));

        document.onkeydown = function keydown(e) {
			self.keyDown(e.keyCode, e.ctrlKey);
        };
		
		var levelStoraged = parseInt(localStorage.getItem('boxWorldLevelId'));
        this.loadLevel(levelStoraged ? levelStoraged : 0);
    }
};