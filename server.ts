const PUBLIC_DIRECTORY = "/public/";
const PAGES_DIRECTORY = "pages/";
const ASSETS_DIRECTORY = "/assets/";
const TXT_FILE_TYPE = ".txt";
const CSS_FILE_TYPE = ".css";
const INDEX_NAME = "index";

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
    const pathResponse = await response(path);
    if (pathResponse) {
      requestEvent.respondWith(pathResponse);
    } else {
      requestEvent.respondWith(new Response("Server Error"));
    }
  }
}

async function response(path: string) {
  console.log("path", path);

  // TODO: figure out if there's a way to get / figure out
  // the original path of global stylesheet, favicon, etc.
  // essentially, figure out how to solve the issue of
  // subdirectories and the side-effects of having them

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
  const file = await Deno.readFile(`.${PUBLIC_DIRECTORY}${path}`);
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
