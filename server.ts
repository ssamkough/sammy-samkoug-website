const DIRECTORY = "public/";
const HTML_FILE_TYPE = ".html";
const CSS_FILE_TYPE = ".css";

const FILES = {
  "/": "index",
  "/about": "about",
  "/styles.css": "styles",
};

const START_OF_FILE = `
<!DOCTYPE html>
<html lang="en">
<head>
<title>sammy samkough</title>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/x-icon" href="./assets/favicon.ico" />
<link rel="stylesheet" type="text/css" href="./styles.css" />
</head>
<body>
`;

const END_OF_FILE = `
</body>
</html>
`;

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
    requestEvent.respondWith(await response(path));
  }
}

async function response(path: string) {
  switch (path) {
    case "/":
    case "/about": {
      const file = await Deno.readTextFile(
        `${DIRECTORY}${FILES[path]}${HTML_FILE_TYPE}`
      );
      return new Response(`${START_OF_FILE}${file}${END_OF_FILE}`, {
        headers: { "content-type": "text/html; charset=utf-8" },
        status: 200,
      });
    }
    case "/styles.css": {
      const file = await Deno.readFile(
        `${DIRECTORY}${FILES[path]}${CSS_FILE_TYPE}`
      );
      return new Response(file, {
        headers: {
          "content-type": "text/css",
        },
      });
    }
    default: {
      return new Response("404");
    }
  }
}
