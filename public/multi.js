const HOST = location.origin.replace(/^http/, 'ws')
const socket = new WebSocket(HOST);

socket.addEventListener('open', () => {
    console.log("Connection", true)
	socket.send(JSON.stringify({"placePlayer":maze.mapSize}))
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
			const [x, y] = this.mapSize
			socket.send(JSON.stringify({"movePlayer":{"direction":direction,"mapSize":{"x":x,"y":y}}}))
		}
	}
	reload() {
		socket.send(JSON.stringify({"getPlayer":maze.mapSize}))
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