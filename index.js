

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

const [getPlayer] = require("./controllers/getPlayer");
server.get("getPlayer", getPlayer);

const getMap = require("./controllers/getMap");
server.get("getMap", getMap)