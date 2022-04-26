const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function getTile(req, res) {

	async function getDetail() {
		const filesPath = path.join(__dirname, "..", "map", "details")
		const files = fs.readdirSync(filesPath);
		const randomImage = files[Math.floor(Math.random() * files.length)];
		const imagePath = path.join(filesPath, randomImage);

		const detail = {};

		const image = sharp(imagePath);
		detail.image = await image.metadata().then((metadata) => {
			detail["width"] = metadata.width;
			detail["height"] = metadata.height;
			return image
				.resize(67, 67, {
					fit: "inside",
					withoutEnlargement: true,
				})
				.toBuffer();
		});

		return detail;
	}

	const image = sharp("./map/base.png");
	const metadata = await image.metadata();

	const compositeArray = await (async () => {
		const positions = {
			top: (metadata, height) => {
				return parseInt((67 - height) / 2);
			},
			bottom: (metadata, height) => {
				return parseInt(metadata.height - 67 + (67 - height) / 2);
			},
			left: (metadata, width) => {
				return parseInt((67 - width) / 2);
			},
			right: (metadata, width) => {
				return parseInt(metadata.width - 67 + (67 - width) / 2);
			},
		};
		const directions = [
			["top", "left"],
			["top", "right"],
			["bottom", "left"],
			["bottom", "right"],
		];
		for (const [index, direction] of directions.entries()) {
			const [first, second] = direction;
			const detail = await getDetail();
			const object = {
				input: detail.image,
				top: positions[first](metadata, detail.height),
				left: positions[second](metadata, detail.height),
			};
			directions[index] = object;
		}
		return directions;
	})();

	const open = req.url.searchParams.get("open") || "????";
	const theme = req.url.searchParams.get("theme");
	console.log(theme)
	const object = {};
	const cardinals = ["west", "north", "east", "south"];
	for (let i = 0; i < cardinals.length; i++) {
		const letter = open[i];
		if (letter === "y") {
			compositeArray.push({
				input: await sharp("./map/part.png")
					.rotate(-90 + 90 * i)
					.toBuffer(),
				gravity: cardinals[i],
			});
			object[cardinals[i]] = true;
		} else if (letter === "n") {
			object[cardinals[i]] = false;
		} else {
			if (Math.round(Math.random())) {
				compositeArray.push({
					input: await sharp("./map/part.png")
						.rotate(-90 + 90 * i)
						.toBuffer(),
					gravity: cardinals[i],
				});
				object[cardinals[i]] = true;
			} else {
				object[cardinals[i]] = false;
			}
		}
	}
	object.image = {};
	object.image.data = (await image.composite(compositeArray).png().toBuffer()).toString("base64");
	object.image.mimeType = res.getMimeType(".png");
	object.image.info = "https://opengameart.org/content/outdoor-tiles-again"
	object.image.theme = "outdoor-tiles-again"
	res.status(200).json(object);
}

module.exports = getTile;
