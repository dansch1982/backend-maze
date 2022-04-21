const path = require("path");

const typeCheck = require("./typeCheck");
const Response = require("./response");

class Server {
  #defaultHeaders = [];
  #static = "";
  #methods;
  constructor(settings) {
    typeCheck(arguments, [{}, undefined]);

    for (const [key, values] of Object.entries(settings)) {
      switch (key.toLowerCase()) {
        case "methods":
          this.#methods = values.replace(/\s/g, "").toUpperCase().split(",");
          break;
        case "headers":
          for (const key in values) {
            this.#defaultHeaders.push([key, values[key]]);
          }
          break;
        default:
          break;
      }
    }
    const methods = {};
    for (const method of this.#methods) {
      methods[method] = {
        URIs: [],
        default: {},
      };
      this[method.toLowerCase()] = (uri, func, ...args) => {
        this.#addURI(method, uri, func, ...args);
      };
    }
    this.#methods = methods;
  }
  static(folder) {
    typeCheck(arguments, "");
    this.#static = folder;
  }
  default(method, func, ...args) {
    typeCheck(arguments, String(), [Function]);
    method = method.toUpperCase();
    this.#methods[method]["default"].function = func;
    this.#methods[method]["default"].args = args;
  }
  #addURI(method, uri, func, ...args) {
    typeCheck(arguments, String(), String(), Function);
    this.#methods[method]["URIs"][uri] = {
      function: func,
      args: args,
    };
  }
  run(req, res) {
    const method = req.method;
    const uri = req.parts[0] || "/";
    try {
      const callback =
        this.#methods[method]["URIs"][uri] || this.#methods[method]["default"];
      callback.function(req, res, uri.args);
    } catch (error) {
      console.log(error);
      res.status(404).text("Page not found.");
    }
  }
  listen(port, callback) {
    typeCheck(arguments, Number(), [Function, undefined]);
    const http = require("http");
    http.createServer((req, res) => {
        req.url = (function () {
          const host = "http" + "://" + req.headers.host + "/";
          try {
            return new URL(req.url, host);
          } catch (error) {
            return error;
          }
        })();

        if (req.url.code) {
          return res.status(500).text("Something went wrong.");
        }

        res = new Response(res);
        for (const header of this.#defaultHeaders) {
          const [key, value] = header;
          res.setHeader(key, value);
        }

        req.parts = req.url.pathname.split("/").filter(Boolean);

        console.log(req.method, req.parts.length > 0 ? req.parts : "/");

        if (callback) {
          callback(req, res);
        }

        const file = path.parse(
          path.join(".", this.#static || "", req.url.pathname)
        );

        if (req.method === "GET" && file.ext) {
          file.path = path.join(file.dir, file.base);
          return res.file(file);
        }

        this.run(req, res);
      })
      .listen(process.env.PORT || port, () => {
        console.log("Server running on port:", process.env.PORT || port);
      });
  }
}
module.exports = Server;
