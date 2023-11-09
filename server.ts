/** ---- CONSTANTS ---- */
// directories
const PUBLIC_DIRECTORY = "/public/";
const ASSETS_DIRECTORY = "/assets/";
const PAGES_DIRECTORY = "pages/";
const STYLES_DIRECTORY = "styles/";

// domains
const LOCALHOST_PORT = 8080;
const LOCALHOST = `http://localhost:${LOCALHOST_PORT}/`;
const HTTPS = "https://";
const SAMMY_DOT_PIZZA = `${HTTPS}sammy.pizza/`;
const SAMMYSAMKOUGH_DOT_COM = `${HTTPS}sammysamkough.com/`;

// file types
const TXT_FILE_TYPE = ".txt";
const CSS_FILE_TYPE = ".css";
const JPG_FILE_TYPE = ".jpg";
const PNG_FILE_TYPE = ".png";
const ICO_FILE_TYPE = ".ico";

// special files
const RESET_CSS_FILE = "reset.css";
const GLOBALS_CSS_FILE = "globals.css";
const FAVICON_ASSETS_FILE = "favicon.ico";

// naming conventions
const INDEX_NAME = "index";

/** ---- SERVER ---- */

const server = Deno.listen({ port: LOCALHOST_PORT });
console.log(`HTTP webserver running. Access it at: ${LOCALHOST}`);

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
    const pathResponse = await response(path, referrer ?? "");
    if (pathResponse) {
      requestEvent.respondWith(pathResponse);
    } else {
      requestEvent.respondWith(new Response("Server Error"));
    }
  }
}

/**
 * Proper response depending on the request event from the http connection.
 * @param path Pathname from the request event request url
 * @param referrer Referer from the request event request headers
 */
async function response(path: string, referrer: string) {
  // css
  if (path.endsWith(CSS_FILE_TYPE)) {
    // "globals.css" located in "/public/styles/" is a special file
    if (path.endsWith(GLOBALS_CSS_FILE)) {
      return await stylesheet(
        `${PUBLIC_DIRECTORY}${STYLES_DIRECTORY}${GLOBALS_CSS_FILE}`
      );
    }
    // "reset.css" located in "/public/styles/" is a special file
    if (path.endsWith(RESET_CSS_FILE)) {
      return await stylesheet(
        `${PUBLIC_DIRECTORY}${STYLES_DIRECTORY}${RESET_CSS_FILE}`
      );
    }
    return await stylesheet(path);
  }

  // asset
  if (
    path.endsWith(JPG_FILE_TYPE) ||
    path.endsWith(PNG_FILE_TYPE) ||
    path.endsWith(ICO_FILE_TYPE)
  ) {
    // "favicon.ico" located in "/assets/" is a special file
    if (path.endsWith(FAVICON_ASSETS_FILE)) {
      return await image(
        `${ASSETS_DIRECTORY}${FAVICON_ASSETS_FILE}`,
        ICO_FILE_TYPE
      );
    }

    let modifiedReferrer = referrer;
    if (referrer.startsWith(LOCALHOST)) {
      modifiedReferrer = modifiedReferrer.replace(LOCALHOST, "");
    }
    if (referrer.startsWith(SAMMY_DOT_PIZZA)) {
      modifiedReferrer = modifiedReferrer.replace(SAMMY_DOT_PIZZA, "");
    }
    if (referrer.startsWith(SAMMYSAMKOUGH_DOT_COM)) {
      modifiedReferrer = modifiedReferrer.replace(SAMMYSAMKOUGH_DOT_COM, "");
    }
    const modifiedPath = `${PUBLIC_DIRECTORY}${PAGES_DIRECTORY}${modifiedReferrer}${path}`;
    return await image(modifiedPath);
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
  const fullDirectoryPath = `${directory}${path ?? "404"}/`;
  const page = await Deno.readTextFile(
    `${fullDirectoryPath}${INDEX_NAME}.html`
  );

  // beginning of page
  const startOne = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}components/1_start_meta${TXT_FILE_TYPE}`
  );

  // links of the page
  const startTwo = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}components/2_start_links${TXT_FILE_TYPE}`
  );

  // closing the head and starting the body
  const startThree = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}components/3_start_header${TXT_FILE_TYPE}`
  );

  // end of page
  const endFour = await Deno.readTextFile(
    `.${PUBLIC_DIRECTORY}components/4_end_footer${TXT_FILE_TYPE}`
  );

  const htmlPage = `${startOne}${startTwo}${startThree}${page}${endFour}`;

  return new Response(`${htmlPage}`, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status: 200,
  });
}

async function stylesheet(path: string) {
  const pathOfFile = `.${path}`;
  try {
    const file = await Deno.readFile(pathOfFile);
    return new Response(file, {
      headers: {
        "content-type": "text/css",
      },
    });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(`File ${pathOfFile} not found`);
      return new Response(null, { status: 404 });
    }
  }
  return new Response(null, { status: 500 });
}

async function image(path: string, fileType?: string) {
  const pathOfFile = `.${path}`;
  try {
    const file = await Deno.readFile(pathOfFile);
    return new Response(file, {
      headers: {
        "content-type": fileType ?? "image/jpeg",
      },
    });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(`File ${pathOfFile} not found`);
      return new Response(null, { status: 404 });
    }
  }
  return new Response(null, { status: 500 });
}
