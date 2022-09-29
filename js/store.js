// ...
/*
Simple:
localStorage.setItem("name",value);
localStorage.getItem("name");
localStorage.removeItem("name");

Compliated:
request = window.indexedDB.open("database_name",1); // creates asynchronous db request

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
column ID int
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