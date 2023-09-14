const DIRECTORY = "public/";
const HTML_FILE_TYPE = ".html";
const CSS_FILE_TYPE = ".css";

const FILES = {
  "/": "index",
  "/styles.css": "styles",
};

const server = Deno.listen({ port: 8080 });
console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);

for await (const conn of server) {
  serve(conn);
}

async function serve(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const requestUrl = requestEvent.request.url;
    const path = new URL(requestUrl).pathname;
    console.log("path", path);

    switch (path) {
      case "/": {
        const file = await Deno.readFile(
          `${DIRECTORY}${FILES[path]}${HTML_FILE_TYPE}`
        );
        const response = new Response(file, {
          headers: { "content-type": "text/html; charset=utf-8" },
          status: 200,
        });
        return requestEvent.respondWith(response);
      }
      case "/styles.css": {
        const file = await Deno.readFile(
          `${DIRECTORY}${FILES[path]}${CSS_FILE_TYPE}`
        );
        const response = new Response(file, {
          headers: {
            "content-type": "text/css",
          },
        });
        return requestEvent.respondWith(response);
      }
      default: {
        const response = new Response("404");
        return requestEvent.respondWith(response);
      }
    }
  }
}
