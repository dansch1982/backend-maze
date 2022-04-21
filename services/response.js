class Response {
    #res
    #statusCode = 200
    #message = ""
    #headers = []
    #mimeTypes = {
        "application/json": [".json"],
        "text/html": [".htm", ".html"],
        "text/css": [".css"],
        "text/plain": ".txt",
        "image/jpeg": [".jpeg", ".jpg"]
    } 
    constructor(res) {
        this.#res = res

        const mimeTypes = {}
        for (const key in this.#mimeTypes) {
            const elements = this.#mimeTypes[key];
            if (Array.isArray(elements)) {
                elements.forEach(element => {
                    mimeTypes[element] = key
                });
            } else {
                mimeTypes[elements] = key
            }
        }
        this.#mimeTypes = mimeTypes
    }
    getMimeType(ext) {
        return this.#mimeTypes[ext] || "application/octet-stream"
    }
    setHeader(key, value) {
        this.#headers.push([key, value])
        return this
    }
    status(code) {
        this.#statusCode = code
        return this
    }
    message(message) {
        this.#message = message
        return this
    }
    json(json) {
        this.setHeader('Content-Type', this.getMimeType(".json"))
        this.end(JSON.stringify(json || "empty"))
    }
    text(text) {
        this.setHeader('Content-Type', this.getMimeType(".txt"))
        const type = Object.prototype.toString.call(text)
        if (text && type !== "object String") {
            text = type === Object.prototype.toString.call({}) ? JSON.stringify(text) : text.toString()
        }
        this.end(text || "empty")
    }
    html(html) {
        this.setHeader('Content-Type', this.getMimeType(".html"))
            this.end(html || "empty")
    }
    file(file) {
        const fs = require('fs')
        fs.readFile(file.path, (error, data) => {
            if (error) {
                this.status(404).text("File not found.")
            } else {
                this.setHeader('Content-Type', this.getMimeType(file.ext))
                this.status(200).end(data)
            }
        })
    }
    end(data) {
        this.configRes()
        this.#res.end(data || "")
    }
    configRes() {
        this.#res.statusCode = this.#statusCode
        this.#res.statusMessage = this.#message
        for (const header of this.#headers) {
            const [key, value] = header
            this.#res.setHeader(key, value)
        }
    }
}
module.exports = Response