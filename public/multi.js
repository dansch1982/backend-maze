const HOST = location.origin.replace(/^http/, 'ws')
const socket = new WebSocket(HOST);

socket.addEventListener('open', () => {
    console.log("Connection", true)
	socket.send(JSON.stringify({"createPlayer":maze.mapSize}))
})
socket.addEventListener('message', (message) => {
	const data = JSON.parse(message.data)
	if (Array.isArray(data)) {
		maze.players = JSON.parse(message.data)
		maze.placePlayers()
	} else {
		maze.id = data.id
	}
})
socket.addEventListener('ping', () => {
	console.log("pong")
})

class Maze {
	constructor(map) {
		this.map = map;
		this.init()
	}
	async init() {
		this.calcMap()
		this.fillMap()
		await this.getMap()
	}
	calcMap() {
		const x = getComputedStyle(this.map).gridTemplateColumns.split(" ").length
		const y = getComputedStyle(this.map).gridTemplateRows.split(" ").length
		this.mapSize = [x, y];
	}
	fillMap() {
		const [x, y] = this.mapSize;
		const loops = x * y;
		const articles = []
		for (let i = 0; i < loops; i++) {
			const article = document.createElement("article");
			article.id = `X${(i % x) + 1}Y${Math.floor(i / x + 1)}`;
			articles.push(article)
		}
		this.map.append(...articles);
	}
	async getMap() {
		const url = new URL("getMap", window.location.origin);

		const searchParams = new URLSearchParams();
		searchParams.append("mapSize", this.mapSize);
		if (searchParams) {
			for (const [key, value] of searchParams) {
				url.searchParams.append(key, value);
			}
		}

		const data = await (await fetch(url)).json();
		this.explored = data.explored
		for (const key in this.explored) {
				const tileInfo = this.explored[key];
				const tile = document.querySelector(`#${key}`)
				tile.style.backgroundImage = `url(data:${tileInfo.image.mimeType};base64,${tileInfo.image.data})`;
				tile.style.opacity = 1
		}
	}
	placePlayers() {
		const players = document.querySelectorAll('.player')
		players.forEach(player => {
			player.parentElement.removeChild(player)
		})
		this.players.forEach(player => {

			const playerObject = {
				element: document.createElement("article"),
				model: document.createElement("img"),
			}
			playerObject.element.classList.add('player')
			playerObject.model.src = `data:${player.playerData.image.mimeType};base64,${player.playerData.image.data}`;
			playerObject.element.append(playerObject.model);
			const id = `X${player.x}Y${player.y}`
			const tile = document.getElementById(id)
			playerObject.element.style.opacity = 1
			tile.append(playerObject.element)
			if (player.id === this.id) {
				this.player = player
				playerObject.model.style.boxShadow = "rgba(255, 255, 255, 0.5) 0px 0px 20px 10px"
				playerObject.model.style.borderRadius = "50%"

			}
		})
	}
	move(direction) {
		const id = `X${this.player.x}Y${this.player.y}`
		if (!this.explored[id][direction]) {
			return
		} else {
			socket.send(JSON.stringify({"movePlayer":direction}))
		}
		/* this.current = this.changeXY(this.current, direction);
		const [x, y] = this.current;
		this.tile = document.getElementById(`X${x}Y${y}`);
		if (!this.explored[this.current.join("")]) {
			this.drawTile(direction);
		} else {
			this.movePlayer();
		} */
	}
}
const maze = new Maze(document.querySelector(".map"))

const nav = document.querySelector(".nav");
const buttons = nav.querySelectorAll("button");
buttons.forEach((button) => {
	button.addEventListener("click", function () {
		try {
			maze[this.classList[0]](this.classList[1]);
		} catch (error) {
			console.log(error);
		}
	});
});

document.addEventListener("keydown", (event) => {
	const key = event.key.toLowerCase()
	if (key.startsWith("arrow")) {
		switch (key) {
			case "arrowleft":
				maze.move("west");
				break;
			case "arrowup":
				maze.move("north");
				break;
			case "arrowright":
				maze.move("east");
				break;
			case "arrowdown":
				maze.move("south");
				break;
		}
	}
});

const overlay = document.querySelector(".overlay");
overlay.addEventListener("click", function (event) {
	if (event.target !== this) return;
	App.hidePopup();
});
const popup = overlay.querySelector("article");
const popupText = overlay.querySelector("p");
const popupClose = overlay.querySelector("img");
popupClose.addEventListener("click", () => {
	overlay.click();
});

const App = {
	calcMap() {
		const x = getComputedStyle(this.map).gridTemplateColumns.split(" ").length
		const y = getComputedStyle(this.map).gridTemplateRows.split(" ").length
		this.mapSize = [x, y];
	},
	clearMap() {
		this.map.innerHTML = null;
		this.mapInfo = {}
		this.explored = {};
	},
	async createPlayer() {
		const url = new URL("getPlayer", window.location.origin);
		const playerData = await (await fetch(url)).json();

		this.player = {
			element: document.createElement("article"),
			model: document.createElement("img"),
			info: playerData.info,
		};

		this.player.model.src = `data:${playerData.image.mimeType};base64,${playerData.image.data}`;
		this.player.element.append(this.player.model);
		/* fetch(url)
			.then((response) => {
				const reader = response.body.getReader();
				return new ReadableStream({
					start(controller) {
						return (async () => {
							while (
								await reader.read().then(({ done, value }) => {
									if (done) {
										controller.close();
										return false;
									}
									controller.enqueue(value);
									return true;
								})
							) {}
						})();
					},
				});
			})
			.then((stream) => new Response(stream))
			.then((response) => response.blob())
			.then((blob) => URL.createObjectURL(blob))
			.then((url) => (image.src = url))
			.catch((err) => console.error(err)); */
	},
	start() {
		this.map = document.querySelector(".map");
		this.calcMap();
		this.reload();
	},
	async reload() {
		this.hidePopup();
		this.clearMap();
		this.fillMap();
		await this.createPlayer();
		this.createStart();
		this.drawTile();

	},
	createStart() {
		let [x, y] = this.mapSize;
		x = Math.floor(Math.random() * x) + 1;
		y = Math.floor(Math.random() * y) + 1;
		this.current = [x, y];
		this.tile = document.getElementById(`X${x}Y${y}`);
	},
	movePlayer() {
		this.tile.appendChild(this.player.element);
	},
	async drawTile() {
		const [x, y] = this.current;
		const [maxX, maxY] = this.mapSize;

		const west = x === 1 ? maxX : x - 1;
		const east = x === maxX ? 1 : x + 1;
		const north = y === 1 ? maxY : y - 1;
		const south = y === maxY ? 1 : y + 1;

		let string = "";

		if (this.explored[`${west}${y}`]) string += this.explored[`${west}${y}`]["east"] ? "y" : "n";
		else string += "?";

		if (this.explored[`${x}${north}`]) string += this.explored[`${x}${north}`]["south"] ? "y" : "n";
		else string += "?";

		if (this.explored[`${east}${y}`]) string += this.explored[`${east}${y}`]["west"] ? "y" : "n";
		else string += "?";

		if (this.explored[`${x}${south}`]) string += this.explored[`${x}${south}`]["north"] ? "y" : "n";
		else string += "?";

		const url = new URL("getTile", window.location.origin);
		const searchParams = new URLSearchParams();
		searchParams.append("open", string);
		if (searchParams) {
			for (const [key, value] of searchParams) {
				url.searchParams.append(key, value);
			}
		}
		if (this.mapInfo["theme"]) {
			url.searchParams.append("theme", this.mapInfo["theme"])
		}
		const data = await (await fetch(url)).json();

		this.explored[this.current.join("")] = data;

		if (!this.mapInfo["theme"]) {
			this.mapInfo = {
				"theme" : data.image.theme,
				"info": data.image.info
			}
		}
		this.tile.style.backgroundImage = `url(data:${data.image.mimeType};base64,${data.image.data})`;
		this.tile.classList.add("show");
		this.movePlayer();
		this.checkWinConditions();
	},
	fillMap() {
		const [x, y] = this.mapSize;
		const loops = x * y;
		const articles = []
		for (let i = 0; i < loops; i++) {
			const article = document.createElement("article");
			article.id = `X${(i % x) + 1}Y${Math.floor(i / x + 1)}`;
			articles.push(article)
		}
		this.map.append(...articles);
	},
	move(direction) {
		if (!this.explored[this.current.join("")][direction]) return;
		this.current = this.changeXY(this.current, direction);
		const [x, y] = this.current;
		this.tile = document.getElementById(`X${x}Y${y}`);
		if (!this.explored[this.current.join("")]) {
			this.drawTile(direction);
		} else {
			this.movePlayer();
		}
	},
	showInfo() {
		const dataShowing = popup.getAttribute("data-showing");
		if (dataShowing) {
			if (dataShowing === "score") {
				popup.addEventListener("transitionend",() => {
					this.showInfo();
				},{ once: true });
			}
			return this.hidePopup();
		}
		let htmlString = "<b>Player image:</b><br />";
		try {
			const url = new URL(this.player.info);
			htmlString += `<a href="${url}" target="_blank" rel="noopener noreferrer">${this.player.info}</a>`;
		} catch (error) {
			htmlString += this.player.info;
		}
		htmlString += "<br /><br /><b>Map tileset:</b><br />";
		try {
			const url = new URL(this.mapInfo.info);
			htmlString += `<a href="${url}" target="_blank" rel="noopener noreferrer">${this.mapInfo.info}</a>`;
		} catch (error) {
			htmlString += this.mapInfo.info;
		}
		this.showPopup(htmlString, "info");
	},
	checkWinConditions() {
		const [x, y] = this.mapSize;
		let htmlString;
		if (Object.keys(this.explored).length >= x * y) {
			htmlString = `<b>Victory!</b><br />All ${x * y} tiles explored.`;
		} else if (!this.checkOpen()) {
			htmlString = `<b>Game over!</b><br />You explored ${Object.keys(this.explored).length} / ${x * y} tiles.`;
		}
		if (htmlString) {
			this.showPopup(htmlString, "score");
		}
	},
	hidePopup() {
		popup.removeAttribute("data-showing");
		popup.classList.remove("fullscale");
	},
	showPopup(data, type) {
		popupText.innerHTML = data;
		popup.setAttribute("data-showing", type);
		popup.classList.add("fullscale");
	},
	checkOpen() {
		for (const xy in this.explored) {
			const tile = this.explored[xy];
			for (const key in tile) {
				const value = tile[key];
				if (value === true) {
					const newXY = this.changeXY(xy, key).join("");
					if (!this.explored[newXY]) {
						return true;
					}
				}
			}
		}
		return false;
	},
	changeXY(xy, direction) {
		let [x, y] = xy;
		const [maxX, maxY] = this.mapSize;
		switch (direction) {
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
		if (x > maxX) x = 1;
		else if (x < 1) x = maxX;
		else if (y > maxY) y = 1;
		else if (y < 1) y = maxY;
		return [x, y];
	},
};

//App.start();