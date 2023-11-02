const PUBLIC_DIRECTORY = "/public/";
const PAGES_DIRECTORY = "pages/";
const ASSETS_DIRECTORY = "/assets/";
const TXT_FILE_TYPE = ".txt";
const CSS_FILE_TYPE = ".css";
const INDEX_NAME = "index";

// special files
const GLOBALS_CSS_FILE = "globals.css";
const FAVICON_ASSETS_FILE = "favicon.ico";

const server = Deno.listen({ port: 8080 });
console.log(`HTTP webserver running. Access it at: http://localhost:8080`);

for await (const conn of server) {
  serve(conn);
}

async function serve(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const requestUrlString = requestEvent.request.url;
    const requestUrl = new URL(requestUrlString);
    const path = requestUrl.pathname;
    const referrer = requestEvent.request.headers.get("referer");
    // console.log("headers", referrer);
    // console.log("requestUrl", requestUrl);
    const pathResponse = await response(path, referrer ?? "");
    if (pathResponse) {
      requestEvent.respondWith(pathResponse);
    } else {
      requestEvent.respondWith(new Response("Server Error"));
    }
  }
}

/**
 *
 * @param path
 * @param referrer
 * @returns
 */
async function response(path: string, referrer: string) {
  console.log("path", path);

  // css
  if (path.endsWith(CSS_FILE_TYPE)) {
    console.log("CSS");
    // "globals.css" located in "/public/styles/" is a special file
    if (path.endsWith(GLOBALS_CSS_FILE)) {
      return await stylesheet(`/public/styles/${GLOBALS_CSS_FILE}`);
    }
    return await stylesheet(path);
  }

  // asset
  if (path.endsWith(".jpg") || path.endsWith(".png") || path.endsWith(".ico")) {
    console.log("ASSET");
    // "favicon.ico" located in "/assets/" is a special file
    if (path.endsWith(FAVICON_ASSETS_FILE)) {
      return await image(`/assets/${FAVICON_ASSETS_FILE}`);
    }

    let modifiedReferrer = referrer;
    if (referrer.startsWith("http://localhost:8080/")) {
      modifiedReferrer = modifiedReferrer.replace("http://localhost:8080/", "");
    }
    if (referrer.startsWith("https://sammy.pizza/")) {
      modifiedReferrer = modifiedReferrer.replace("https://sammy.pizza/", "");
    }
    if (referrer.startsWith("https://sammysamkough.com/")) {
      modifiedReferrer = modifiedReferrer.replace(
        "https://sammysamkough.com/",
        ""
      );
    }
    const modifiedPath = `/public/pages/${modifiedReferrer}${path}`;
    return await image(modifiedPath);
  }

  // page
  console.log("PAGE");
  const arrayOfPathDirectories = path.split("/");
  const pathName = arrayOfPathDirectories[arrayOfPathDirectories.length - 1];
  let directory = `.${PUBLIC_DIRECTORY}${PAGES_DIRECTORY}`;

  // retrieves the correct directory
  if (arrayOfPathDirectories.length > 2) {
    let depth = 1;
    const initialDirectory = directory;
    while (depth < arrayOfPathDirectories.length - 1) {
      for await (const dirEntry of Deno.readDir(initialDirectory)) {
        const { name, isDirectory } = dirEntry;
        if (isDirectory && arrayOfPathDirectories[depth] === name) {
          directory = `${directory}${name}/`;
          break;
        }
      }
      depth += 1;
    }
  }

  const filePath = await findFileName(pathName, directory);
  return await page(filePath, directory);
}

async function findFileName(path: string, directory: string) {
  for await (const dirEntry of Deno.readDir(directory)) {
    const { name, isDirectory } = dirEntry;

    // special case (homepage)
    if (isDirectory && path.length === 0 && name.includes(INDEX_NAME)) {
      return name;
    }

    // generic case
    if (isDirectory && path.length !== 0 && name.includes(path)) {
      return name;
    }
  }

  return null;
}

async function page(path: string | null, directory: string) {
  const page = await Deno.readTextFile(
    `${directory}${path ?? "404"}/index.html`
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
  const file = await Deno.readFile(`.${path}`);
  return new Response(file, {
    headers: {
      "content-type": "text/css",
    },
  });
}

async function image(path: string) {
  const file = await Deno.readFile(`.${path}`);
  return new Response(file, {
    // TODO: do content type (if its png, or x-icon, etc.)
    // headers: {
    //   "content-type": "image/jpeg",
    // },
  });
}
