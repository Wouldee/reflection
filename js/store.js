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
column LEVEL int
column X_CONTINUOUS boolean
column Y_CONTINUOUS boolean
column SOURCES 

table MOVE

table TILE
column X int
column Y int
column SHAPE string
column TYPE string
column FORM string
column COLOUR string

table FACE
column TILE_X int
column TILE_Y int
column ID int
column DIRECTION string


request.addEventListener("error" () => console.error("Database failed to open"))
request.addEventListener("success" () => console.log("Database opened"))


request.result contains the database handle



*/