const PUBLIC_DIRECTORY = "/public/";
const PAGES_DIRECTORY = "pages/";
const ASSETS_DIRECTORY = "/assets/";
const TXT_FILE_TYPE = ".txt";
const CSS_FILE_TYPE = ".css";
const HOMEPAGE_NAME = "index";

const server = Deno.listen({ port: 8080 });
console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);

for await (const conn of server) {
  serve(conn);
}

async function serve(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const requestUrlString = requestEvent.request.url;
    const requestUrl = new URL(requestUrlString);
    const path = requestUrl.pathname;
    const pathResponse = await response(path);
    if (pathResponse) {
      requestEvent.respondWith(pathResponse);
    }
  }
}

async function response(path: string) {
  // css
  if (path.endsWith(CSS_FILE_TYPE)) {
    return await stylesheet(path);
  }
  // asset
  if (path.startsWith(ASSETS_DIRECTORY)) {
    return await image(path);
  }

  // page
  const arrayOfPathDirectories = path.split("/");
  const pathname = arrayOfPathDirectories[arrayOfPathDirectories.length - 1];
  const directory = `.${PUBLIC_DIRECTORY}${PAGES_DIRECTORY}`;

  const fileName = await findFileName(pathname, directory);
  return await page(fileName);
}

async function findFileName(path: string, directory: string) {
  for await (const dirEntry of Deno.readDir(directory)) {
    const { name, isFile } = dirEntry;

    // special case (homepage)
    if (isFile && path.length === 0 && name.includes(HOMEPAGE_NAME)) {
      return name;
    }

    // generic case
    if (isFile && path.length !== 0 && name.includes(path)) {
      return name;
    }
  }

  return null;
}

async function page(path: string | null) {
  const page = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}${PAGES_DIRECTORY}${path ?? "404"}`
  );
  const start = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}components/start${TXT_FILE_TYPE}`
  );
  const end = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}components/end${TXT_FILE_TYPE}`
  );

  return new Response(`${start}${page}${end}`, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status: 200,
  });
}

async function stylesheet(path: string) {
  const file = await Deno.readFile(`.${PUBLIC_DIRECTORY}${path}`);
  return new Response(file, {
    headers: {
      "content-type": "text/css",
    },
  });
}

async function image(path: string) {
  const file = await Deno.readFile(`.${path}`);
  return new Response(file);
}
