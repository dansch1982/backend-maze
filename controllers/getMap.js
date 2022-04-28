const createTile = require('../services/createTile')

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
module.exports = [getMap, checkDirection]