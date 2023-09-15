const SRC_DIRECTORY = "public/";
const ASSETS_DIRECTORY = "assets/";
const HTML_FILE_TYPE = ".html";
const TXT_FILE_TYPE = ".txt";
const CSS_FILE_TYPE = ".css";
const ICO_FILE_TYPE = ".ico";
const JPG_FILE_TYPE = ".jpg";
const FILES = {
  "/": "index",
  "/about": "about",
  "/adventures": "adventures",
  "/latin-america-2023-trip": "latin-america-2023-trip",
  "/styles.css": "styles",
  "/favicon.ico": "favicon",
  "/assets/favicon.ico": "favicon",
  "/assets/latin-america-2023-trip/yech-01.jpg": "yech-01",
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
  console.log("path", path);
  switch (path) {
    case "/":
    case "/about":
    case "/adventures":
    case "/latin-america-2023-trip":
      return await page(path);
    case "/styles.css": {
      return await stylesheet(path);
    }
    case "/favicon.ico":
    case "/assets/favicon.ico": {
      return await icon(path);
    }
    case "/assets/latin-america-2023-trip/yech-01.jpg": {
      return await image(path);
    }
    default: {
      return await page(path);
    }
  }
}

async function page(
  path: "/" | "/about" | "/adventures" | "latin-america-2023-trip" | string
) {
  let page;
  switch (path) {
    case "/":
    case "/about":
    case "/adventures":
    case "/latin-america-2023-trip": {
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
    `${SRC_DIRECTORY}/components/start${TXT_FILE_TYPE}`
  );
  const end = await Deno.readTextFile(
    `${SRC_DIRECTORY}/components/end${TXT_FILE_TYPE}`
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

async function image(path: "/assets/latin-america-2023-trip/yech-01.jpg") {
  const file = await Deno.readFile(
    `${ASSETS_DIRECTORY}latin-america-2023-trip/${FILES[path]}${JPG_FILE_TYPE}`
  );
  return new Response(file);
}
