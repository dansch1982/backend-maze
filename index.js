const http = require('http')
const fs = require('fs')
const path = require('path')

http.createServer((req, res) => {
    const host = 'http' + '://' + req.headers.host + '/';
    const url = new URL(req.url, host)
    const file = path.join(__dirname, url.pathname === "/" ? "index.html" : url.pathname)
    console.log(file)
    if (path.extname(req.url)) {
        if (!fs.existsSync(file)) {
            res.writeHead(404, {})
            res.end()
        } else {
            const readStream = fs.createReadStream(file);
            readStream.pipe(res, {
                end: true
            });
        }
    } else {
        if (path.basename(file) === "getTile") {
            const from = url.searchParams.get('from')
            
            const files = fs.readdirSync(path.join(__dirname, "images"))
            let image = files[Math.floor(Math.random() * files.length)]
            
            let directions = path.parse(image).name.split('')
            const array = ["left", "up", "right", "down"]
            
            if (from) {
                let index = array.indexOf(from)
                index = array.indexOf((array[index + 2] ? array[index + 2] : array[index - 2]))
                while (directions[index] === "n") {
                    image = files[Math.floor(Math.random() * files.length)]
                    directions = path.parse(image).name.split('')
                }
            }

            const object = {}
            directions.forEach((direction, index) => {
                object[array[index]] = direction === "y" ? true : false
            })

            object.image = path.join("images", image)

            res.end(JSON.stringify(object))
        } else {
            const readStream = fs.createReadStream(path.join(__dirname, "index.html"));
            readStream.pipe(res, {
                end: true
            });
        }
    }

}).listen(8080)