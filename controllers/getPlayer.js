const fs = require("fs");
const path = require("path");
const getMimeType = require('../services/getMimeType')

function getPlayer(req, res) {
	const player = getPlayerData();
	res.status(200).json(player);
}

function getPlayerData() {
	const models = getPlayerImages()
	const file = path.parse(path.join(".", "players", models[Math.floor(Math.random() * models.length)]));
	const model = fs.readFileSync(path.join(file.dir, file.base));
	const player = {
		image: {
			data: model.toString("base64"),
			mimeType: getMimeType(file.ext),
		},
		info: getPlayerInfo(file),
	};
	return player;
}
function getPlayerImages() {
	const dirents = fs.readdirSync(path.join(__dirname, "..", "players"), { withFileTypes: true });
	const models = dirents.filter((dirent) => dirent.isFile() && !dirent.name.endsWith(".txt")).map((dirent) => dirent.name);
	return models;
}
function getPlayerInfo(file) {
	try {
		return fs.readFileSync(path.join(file.dir, file.name + ".txt")).toString();
	} catch (error) {
		return "No info.";
	}
}

module.exports = [getPlayer, getPlayerData];
