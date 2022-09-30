// ...
/*
Simple:
localStorage.setItem("name",value);
localStorage.getItem("name");
localStorage.removeItem("name");

Compliated:
request = window.indexedDB.open("database_name",1); // creates asynchronous db request, second argument is version

// first time:
request.addEventListener("upgradeneeded", (e) => {
	// create database
	database = e.target.result;

	store = database.createObjectStore("game")
}

Database schema:

table GAME
column ID int
column LEVEL int
column X_CONTINUOUS boolean
column Y_CONTINUOUS boolean
column SOURCES string
column RED string
column GREEN string
column BLUE string
column GROWTH string
column MIX string
column FILTER boolean
column PRISM string

table MOVE
column GAME_ID int
column SEQUENCE int
column TILE_X int
column TILE_Y int
column rotation int

table TILE
column GAME_ID int
column X int
column Y int
column SHAPE string
column TYPE string
column FORM string
column COLOUR string

table FACE
column GAME_ID int
column TILE_X int
column TILE_Y int
column LINK_ID int
column DIRECTION string

table RECORD
column GAME_ID int
column TIME int
column MOVES int
column SCORE float


request.addEventListener("error" () => console.error("Database failed to open"))
request.addEventListener("success" () => console.log("Database opened"))


request.result contains the database handle



*/

// read and write to storage on the client machine
function ClientStore () {

	// connect to the local database
	var request = window.indexedDB.open("database_name",1);

	// first time
	request.addEventListener("upgradeneeded", this.create_database(e));

	//...
	request.addEventListener("error" () => console.error("Database failed to open"))
	request.addEventListener("success" () => console.log("Database opened"))
}

ClientStore.prototype.create_database = function (e) {
	// create database
	var database = e.target.result;

	// GAME - identifies an individual level, the options used to create it, and the current scroll position
	// unique index is generated based on options
	var gameStore = database.createObjectStore("GAME");
	gameStore.createIndex("ID", "ID", { unique: true });
	gameStore.createIndex("LEVEL", "LEVEL", { unique: false });
	gameStore.createIndex("OPTIONS", ["TILING", "SIZE", "X_CONTINUOUS", "Y_CONTINUOUS", "SOURCES", "RED", "GREEN", "BLUE", "GROWTH", "MIX", "FILTER", "PRISM"], { unique: false });
	gameStore.createIndex("SCROLL", ["X_OFFSET", "Y_OFFSET"], { unique: false });

	// TILE - an individual tile on a game
	var tileStore = database.createObjectStore("TILE");
	tileStore.createIndex("TILE_ID", ["GAME_ID", "X", "Y"], { unique: true });
	tileStore.createIndex("PROPERTIES", ["SHAPE", "TYPE", "FORM", "COLOUR"], { unique: false });

	// FACE - a face
table FACE
column GAME_ID int
column TILE_X int
column TILE_Y int
column ID int
column DIRECTION string

	// MOVE - represents a user action, i.e a tile rotation
	var moveStore = database.createObjectStore("MOVE");
	moveStore.createIndex("SEQUENCE", ["GAME_ID","SEQUENCE"], { unique: true });
	moveStore.createIndex("TILE", ["TILE_X","TILE_Y"], { unique: false });
	moveStore.createIndex("ROTATION", "ROTATION", { unique: false });


}

//
ClientStore.prototype.store_new_game = function (game) {
}

ClientStore.prototype.store_action = function (e) {
}

ClientStore.prototype.load_game = function (game) {
}
