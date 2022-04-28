const createTile = require('../services/createTile')

async function getTile(req, res) {

	const open = req.url.searchParams.get("open") || "????";
	const theme = req.url.searchParams.get("theme");

	const object = await createTile(open, theme, res)
	
	res.status(200).json(object);
}

module.exports = getTile;
