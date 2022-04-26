const fs = require("fs");
const path = require("path");

function getPlayer(req, res) {
    fs.readdir(path.join(__dirname, "..", "players"), { withFileTypes: true }, (error, dirents) => {
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
}

module.exports = getPlayer