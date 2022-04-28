

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
server.get("getMap", getMap)

const WebSocketServer = require("ws");
/* 

const websocket = new WebSocketServer.Server({
	server:server.getHTTP()
}); */


const websocket = new WebSocketServer.Server({
	server:server.getHTTP()
});


websocket.on("connection", (socket) => {
    console.log("Connection", true)
    const id = new Date()
    socket.id = id
    const playerData = {
        "playerData":getPlayerData(),
        "x": null,
        "y": null,
        "id": id,
    }
    socket.playerData = playerData
    socket.send(JSON.stringify({"id":id}))
    
	socket.on('message', (data) => {
        const object = JSON.parse(data)
        const key = Object.keys(object)[0]
        const value = Object.values(object)[0]
        switch (key) {
            case "createPlayer":
                let [x, y] = value
                x = Math.floor(Math.random() * x) + 1;
                y = Math.floor(Math.random() * y) + 1;
                socket["playerData"]["x"] = x
                socket["playerData"]["y"] = y
                break;
            case "movePlayer":
                const [sockmoveX, sockmoveY] = checkDirection(socket["playerData"]["x"], socket["playerData"]["y"], 5, 4, value)
                socket["playerData"]["x"] = sockmoveX
                socket["playerData"]["y"] = sockmoveY
            break;
            default:
                break;
        }
        sendPlayerData(websocket)
    })
});
function sendPlayerData() {
    const datas = []
    websocket.clients.forEach(client => {
        datas.push(client.playerData)
    })
    websocket.clients.forEach(client => {
        client.send(JSON.stringify(datas))
    })
}

const socketID = []
const interval = setInterval(function ping() {
    socketIDLength = socketID.length
    socketID.length = 0
    websocket.clients.forEach(function each(socket) {
        socketID.push(socket.id)
    });
    if (socketID.length < socketIDLength) {
        sendPlayerData(websocket)
    }
  }, 1000);
  
  websocket.on('close', function close() {
    clearInterval(interval);
  });