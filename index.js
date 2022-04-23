const fs = require("fs");
const path = require("path");

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

server.get("getTile", (req, res) => {
	const open = req.url.searchParams.get("open");

	const files = fs.readdirSync(path.join(__dirname, "public", "images"));
	let image = files[Math.floor(Math.random() * files.length)];

	let directions = path.parse(image).name.split("");
	const array = ["left", "up", "right", "down"];

	function testImage() {
		for (let i = 0; i < open.length; i++) {
			const letter = open[i];
			if (letter === "?") {
				continue;
			} else if (letter !== image[i]) {
				return false;
			}
		}
		return true;
	}

	while (!testImage()) {
		image = files[Math.floor(Math.random() * files.length)];
	}

	const object = {};
	directions = path.parse(image).name.split("");
	directions.forEach((direction, index) => {
		object[array[index]] = direction === "y" ? true : false;
	});

	object.image = path.join("images", image);

	res.status(200).json(object);
});

server.get("getPlayer", (req, res) => {
	fs.readdir(path.join(__dirname, "players"), { withFileTypes: true }, (error, dirents) => {
		const files = dirents.filter((dirent) => dirent.isFile() && !dirent.name.endsWith('.txt')).map((dirent) => dirent.name);
		const file = path.parse(
			path.join(".", "players", files[Math.floor(Math.random() * files.length)])
		);
		fs.readFile(path.join(file.dir, file.base), (error, data) => {
			const player = { image: {} };
			player.image.data = data.toString("base64");
			player.image.mimeType = res.getMimeType(file.ext);
      fs.readFile(path.join(file.dir, file.name + ".txt"), (error, data) => {
        if (error) {
          player.info = "no info";
        } else {
          player.info = data.toString();
        }
        res.status(200).json(player);
      })
		});
	});
});
