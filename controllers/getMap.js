const createTile = require('../services/createTile')

const [_, getPlayerData] = require('./getPlayer')

const WebSocketServer = require("ws");

const websocket = new WebSocketServer.Server({
	port: 1234
});

const clients = new Map()

function heartbeat() {
    this.isAlive = true;
  }

websocket.on("connection", (socket) => {
    console.log("Connection", true)
    socket.isAlive = true;
    socket.on('pong', heartbeat);
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

websocket.on('close', function close() {
    console.log('disconnected');
  });

const socketID = []
const interval = setInterval(function ping() {
    socketIDLength = socketID.length
    socketID.length = 0
    websocket.clients.forEach(function each(socket) {
        socketID.push(socket.id)
      if (socket.isAlive === false) {
          socket.terminate();
          sendPlayerData(websocket)
          return
        }
  
      socket.isAlive = false;
      socket.ping();
    });
    if (socketID.length < socketIDLength) {
        sendPlayerData(websocket)
    }
  }, 1000);
  
  websocket.on('close', function close() {
    clearInterval(interval);
  });


let mapData;

async function getMap(req, res) {
    
    if (!mapData) {
        const mapSize = req.url.searchParams.get("mapSize");
        const [width, height] = mapSize.split(",")
    
        const explored = {}
    
        for (let i = 0; i < width*height; i++) {
    
            const x = (i % width) + 1
            const y = Math.floor(i / width + 1)
    
            const id = `X${x}Y${y}`;
    
            const string = buildString(x, y, width, height, explored)
    
            const element = await createTile(string, null, res)
    
            explored[id] = element

            mapData = {
                mapSize: mapSize,
                explored: explored
            }
        }
    
    }
	res.status(200).json(mapData)
}

function buildString(x, y, width, height, explored) {

    let string = ""

    const cardinals = ["west", "north", "east", "south"];
    for (const cardinal of cardinals) {
        [xx, yy] = (checkDirection(x, y, width, height, cardinal))
        const id = `X${xx}Y${yy}`;
        if (!explored[id]) {
            string += "?"
        } else {
            string += explored[id][cardinals[cardinals.indexOf(cardinal) + 2] ? cardinals[cardinals.indexOf(cardinal) + 2] : cardinals[cardinals.indexOf(cardinal) - 2]] ? "y" : "n"
        }
    }
    return string
}

function checkDirection(x, y, width, height, cardinal) {
    switch (cardinal) {
        case "north":
            y--;
            break;
        case "south":
            y++;
            break;
        case "west":
            x--;
            break;
        case "east":
            x++;
            break;
        default:
            break;
    }
    if (x > width) x = 1;
    else if (x < 1) x = width;
    else if (y > height) y = 1;
    else if (y < 1) y = height;
    return [x, y]
}
module.exports = getMap