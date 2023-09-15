const SRC_DIRECTORY = "public/";
const ASSETS_DIRECTORY = "assets/";
const HTML_FILE_TYPE = ".html";
const CSS_FILE_TYPE = ".css";
const ICO_FILE_TYPE = ".ico";
const FILES = {
  "/": "index",
  "/about": "about",
  "/styles.css": "styles",
  "/favicon.ico": "favicon",
  "/assets/favicon.ico": "favicon",
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
    requestEvent.respondWith(await response(path));
  }
}

async function response(path: string) {
  switch (path) {
    case "/":
    case "/about":
      return await page(path);
    case "/styles.css": {
      return await stylesheet(path);
    }
    case "/favicon.ico":
    case "/assets/favicon.ico": {
      return await icon(path);
    }
    default: {
      return await page(path);
    }
  }
}

async function page(path: "/" | "/about" | string) {
  let page;
  switch (path) {
    case "/":
    case "/about": {
      page = await Deno.readTextFile(
        `${SRC_DIRECTORY}/pages/${FILES[path]}${HTML_FILE_TYPE}`
      );
      break;
    }
    default: {
      page = await Deno.readTextFile(
        `${SRC_DIRECTORY}/pages/404${HTML_FILE_TYPE}`
      );
    }
  }

  const start = await Deno.readTextFile(
    `${SRC_DIRECTORY}/components/start${HTML_FILE_TYPE}`
  );
  const end = await Deno.readTextFile(
    `${SRC_DIRECTORY}/components/end${HTML_FILE_TYPE}`
  );
  return new Response(`${start}${page}${end}`, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status: 200,
  });
}

async function stylesheet(path: "/styles.css") {
  const file = await Deno.readFile(
    `${SRC_DIRECTORY}${FILES[path]}${CSS_FILE_TYPE}`
  );
  return new Response(file, {
    headers: {
      "content-type": "text/css",
    },
  });
}

async function icon(path: "/favicon.ico" | "/assets/favicon.ico") {
  const file = await Deno.readFile(
    `${ASSETS_DIRECTORY}${FILES[path]}${ICO_FILE_TYPE}`
  );
  return new Response(file);
}
