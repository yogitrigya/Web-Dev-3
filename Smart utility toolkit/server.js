const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
    console.log("Incoming request:", req.method, req.url);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    if (req.method !== "GET") {
        res.statusCode = 405;
        res.end("405 - Method Not Allowed");
    } else {
        switch (req.url) {
            case "/":
                res.statusCode = 200;
                res.end("Welcome to Node Server");
                break;
            case "/about":
                res.statusCode = 200;
                res.end("About Page");
                break;
            case "/contact":
                res.statusCode = 200;
                res.end("Contact Page");
                break;
            default:
                res.statusCode = 404;
                res.end("404 - Page Not Found");
        }
    }

    console.log("Response sent for:", req.url);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
