const nav = document.querySelector(".nav");
const buttons = nav.querySelectorAll("button");
buttons.forEach((button) => {
	button.addEventListener("click", function () {
		try {
			App[this.classList[0]](this.classList[1]);
		} catch (error) {
			console.log(error);
		}
	});
});

document.addEventListener("keydown", (event) => {
	if (event.key.startsWith("Arrow")) {
		const direction = event.key.substring(5).toLowerCase();
		App.move(direction);
	}
});

const overlay = document.querySelector(".overlay");
overlay.addEventListener("click", function (event) {
	if (event.target !== this) return;
	popup.classList.remove("fullscale");
});
const popup = overlay.querySelector("article");
const popupText = overlay.querySelector("p");
const popupClose = overlay.querySelector("img");
popupClose.addEventListener("click", () => {
	overlay.click();
});

const App = {
	calcMap() {
		const y = getComputedStyle(this.map).grid.split(" ");
		y.splice(nthIndexOfArray(y, "/", 2));
		const x = y.splice(y.indexOf("/"));
		x.splice(0, 1);
		this.mapSize = [x.length, y.length];
	},
	clearMap() {
		this.map.innerHTML = null;
	},
	async createPlayer() {
		const url = new URL("getPlayer", window.location.origin);
		const playerData = await (await fetch(url)).json();

		this.player = {
			element: document.createElement("article"),
			info: playerData.info,
		};

		const image = document.createElement("img");
		image.src = `data:${playerData.image.mimeType};base64,${playerData.image.data}`;
		this.player.element.appendChild(image);
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
		this.explored = {};
		popup.classList.remove("fullscale");
		this.clearMap();
		this.fillMap();
		await this.createPlayer();
		this.createStart();
	},
	createStart() {
		let [x, y] = this.mapSize;
		x = Math.floor(Math.random() * x) + 1;
		y = Math.floor(Math.random() * y) + 1;
		this.current = [x, y];
		this.tile = document.getElementById(`X${x}Y${y}`);
		this.drawTile();
	},
	movePlayer() {
		this.tile.appendChild(this.player.element);
	},
	async drawTile() {
		const [x, y] = this.current;
		const [maxX, maxY] = this.mapSize;

		const left = x === 1 ? maxX : x - 1;
		const right = x === maxX ? 1 : x + 1;
		const up = y === 1 ? maxY : y - 1;
		const down = y === maxY ? 1 : y + 1;

		let string = "";

		if (this.explored[`${left}${y}`]) string += this.explored[`${left}${y}`]["right"] ? "y" : "n";
		else string += "?";

		if (this.explored[`${x}${up}`]) string += this.explored[`${x}${up}`]["down"] ? "y" : "n";
		else string += "?";

		if (this.explored[`${right}${y}`]) string += this.explored[`${right}${y}`]["left"] ? "y" : "n";
		else string += "?";

		if (this.explored[`${x}${down}`]) string += this.explored[`${x}${down}`]["up"] ? "y" : "n";
		else string += "?";

		const url = new URL("getTile", window.location.origin);
		const searchParams = new URLSearchParams();
		searchParams.append("open", string);
		if (searchParams) {
			for (const [key, value] of searchParams) {
				url.searchParams.append(key, value);
			}
		}
		const data = await (await fetch(url)).json();

		this.explored[this.current.join("")] = data;
		this.tile.style.backgroundImage = `url(./${data.image.replace("\\", "/")})`;
		this.tile.classList.add("show");
		this.movePlayer();
		this.checkWinConditions();
	},
	fillMap() {
		const [x, y] = this.mapSize;
		const loops = x * y;
		for (let i = 0; i < loops; i++) {
			const article = document.createElement("article");
			article.id = `X${(i % x) + 1}Y${Math.floor(i / x + 1)}`;
			this.map.appendChild(article);
		}
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
		let htmlString = "<b>Player model:</b><br />";
        try {
            const url = new URL(this.player.info)
            htmlString += `<a href="${this.player.info}" target="_blank" rel="noopener noreferrer">${this.player.info}</a>`;
        } catch (error) {
            htmlString += this.player.info           
        }
		popupText.innerHTML = htmlString;
		popup.classList.add("fullscale");
	},
	checkWinConditions() {
		const [x, y] = this.mapSize;
		if (Object.keys(this.explored).length >= x * y) {
			popupText.innerText = `Victory!\nAll ${x * y} tiles explored.`;
			popup.classList.add("fullscale");
		} else if (!this.checkOpen()) {
			popupText.innerText = `Game over!\nYou explored ${Object.keys(this.explored).length} / ${
				x * y
			} tiles.`;
			popup.classList.add("fullscale");
		}
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
			case "up":
				y--;
				break;
			case "down":
				y++;
				break;
			case "left":
				x--;
				break;
			case "right":
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
App.start();

function nthIndexOfArray(array, item, index) {
	if (index < 1 || isNaN(index) || array.indexOf(item) < 0) {
		return -1;
	} else if (index === 1) {
		return array.indexOf(item);
	} else {
		const newIndex = array.indexOf(item) + 1;
		const newArray = array.slice(newIndex);
		return newIndex + nthIndexOfArray(newArray, item, index - 1);
	}
}
