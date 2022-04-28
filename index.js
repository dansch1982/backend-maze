const Server = require("./services/server");

const server = new Server({
	methods: "GET",
	headers: {
		"Access-Control-Allow-Origin": "*",
	},
});

server.listen(8080);

server.static("public");

server.default("get", (req, res) => {
	res.status(302).setHeader("Location", "index.html").end();
});

const getTile = require("./controllers/getTile");
server.get("getTile", getTile);

const [getPlayer, getPlayerData] = require("./controllers/getPlayer");
server.get("getPlayer", getPlayer);

const [getMap, checkDirection] = require("./controllers/getMap");
server.get("getMap", getMap);

const WebSocketServer = require("ws");

const websocket = new WebSocketServer.Server({
	server: server.getHTTP(),
});

websocket.on("connection", (socket) => {
	console.log("Connection", true);

	const id = new Date();
	socket.id = id;

	socket.send(JSON.stringify({ id: id }));

	const playerData = {
		playerData: getPlayerData(),
		x: null,
		y: null,
		id: id,
	};
	socket.playerData = playerData;

	socket.on("message", (data) => {
		const object = JSON.parse(data);
		for (const key in object) {
			const value = object[key];
			switch (key) {
				case "placePlayer":
					placePlayer(socket, value);
					break;
				case "movePlayer":
					movePlayer(socket, value);
					break;
				case "getPlayer":
					socket.playerData.playerData = getPlayerData();
					placePlayer(socket, value);
					break;
				default:
					break;
			}
			sendPlayerData(websocket);
		}
	});
});
function sendPlayerData() {
	const data = [];
	websocket.clients.forEach((client) => {
		data.push(client.playerData);
	});
	websocket.clients.forEach((client) => {
		client.send(JSON.stringify(data));
	});
}
function placePlayer(socket, value) {
	const [maxX, maxY] = value;
	const x = Math.floor(Math.random() * maxX) + 1;
	const y = Math.floor(Math.random() * maxY) + 1;
	socket["playerData"]["x"] = x;
	socket["playerData"]["y"] = y;
}
function movePlayer(socket, value) {
	const [direction, mapSize] = Object.values(value);
	const [x, y] = checkDirection(socket["playerData"]["x"], socket["playerData"]["y"], mapSize.x, mapSize.y, direction);
	socket["playerData"]["x"] = x;
	socket["playerData"]["y"] = y;
}

const socketID = [];
const interval = setInterval(() => {
	socketIDLength = socketID.length;
	socketID.length = 0;
	websocket.clients.forEach(function each(socket) {
		socketID.push(socket.id);
	});
	if (socketID.length < socketIDLength) {
		sendPlayerData(websocket);
	}
}, 1000);

websocket.on("close", function close() {
	clearInterval(interval);
});
