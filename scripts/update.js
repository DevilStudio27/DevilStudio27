const path = require("path");
const { promises: fs } = require("fs");
const feedRead = require("davefeedread");
const username = "devilstudio27";
const channel = "public";
const dateStyle = "medium";

// (async () => {
//   const [template, codepenFeed] = await Promise.all([
//     loadTemplateReadme(),
//     getCodepenFeed(),
//   ]);
//   if (!codepenFeed.items.length) {
//     throw new Error("CodePen feed is empty");
//   }
//   const codepenTable = codepenFeedToTable(codepenFeed);
//   const replacers = [
//     ["{{CODEPEN_TABLE}}", codepenTable],
//     ["{{UPDATED_TIMESTAMP}}", new Date().toUTCString()],
//   ];
//   const result = replacers.reduce(
//     (p, [search, replace]) => p.replace(search, replace),
//     template
//   );
//   await saveReadme(result);
// })();

(async () => {
  try {
    // Load template and CodePen feed concurrently
    const [template, codepenFeed] = await Promise.all([
      loadTemplateReadme(),
      getCodepenFeed(),
    ]);

    // Check if CodePen feed is empty
    if (!codepenFeed.items.length) {
      throw new Error("CodePen feed is empty");
    }

    // Convert CodePen feed to a table format
    const codepenTable = codepenFeedToTable(codepenFeed);

    // Prepare replacements for template
    const replacers = [
      ["{{CODEPEN_TABLE}}", codepenTable],
      ["{{UPDATED_TIMESTAMP}}", new Date().toUTCString()],
    ];

    // Replace placeholders in the template with actual values
    const result = replacers.reduce(
      (p, [search, replace]) => p.replace(search, replace),
      template
    );

    // Save the updated README
    await saveReadme(result);

    console.log("README updated successfully.");
  } catch (error) {
    console.error("An error occurred:", error.message);
    // Additional error handling logic can go here
  }
})();

async function loadTemplateReadme() {
  try {
    const templatePath = path.resolve(__dirname, "./README.template.md");
    const template = await fs.readFile(templatePath, "utf8");
    return template;
  } catch (error) {
    console.error("Error loading README template:", error);
    throw error; // Re-throw the error after logging it
  }
}

/**
 * @returns {CodepenFeedData}
 */
function getCodepenFeed(username, channel) {
  // Starts at page 1
  const page = 1;
  const url = `https://codepen.io/${username}/${channel}/feed?page=${page}`;

  return new Promise((resolve, reject) => {
    feedRead.parseUrl(url, 30, (err, feed) => {
      if (err) {
        console.error("Error fetching the CodePen feed:", err);
        return reject(err);
      }
      resolve(feed);
    });
  });
}

/**
 * @param {string[]} title Title headers
 * @param {string[][]} rows Data rows
 */
function table(title, rows) {
  const titleRowInner = title.map((n) => `<th>${n}</th>`).join("\n\t\t");
  const titleRow = `<tr>\n\t\t${titleRowInner}\n\t</tr>`;
  const dataRowInner = (data) => data.join("</td>\n\t\t<td>");
  const dataRows = rows.map(
    (data) => `<tr>\n\t\t<td>${dataRowInner(data)}</td>\n\t</tr>`
  );
  return `<table>\n\t${titleRow}\n\t${dataRows.join("\n\t")}\n</table>`;
}

/**
 * Creates an HTML element as a string
 * @param {string} tag Element tag
 * @param {{ [key: string]: string; }} attr Element attributes
 * @param {string} content Content data
 */
function createElement(tag, attr, content) {
  let element = `<${tag}`;
  if (attr) {
    let a = Object.entries(attr).map(([key, val]) => `${key}="${val}"`);
    if (a) {
      element += " " + a.join(" ");
    }
  }
  element += ">";
  if (content === undefined || typeof content === "string") {
    if (tag !== "img") {
      if (typeof content === "string") {
        element += content;
      }
      element += `</${tag}>`;
    }
  }
  return element;
}

/**
 * Shorten a title text to a target, adding a ...
 * @param {string} title Title text
 * @param {number} target Target length
 */
function shortenTitle(title, target) {
  if (title.length <= target) return title;
  const parts = title.split(" ");
  let result = "";
  for (const part of parts) {
    if ((result + part).length + 1 > target) break;
    result += (result ? " " : "") + part;
  }
  if (result.length + 3 <= target) {
    result += "...";
  } else {
    result = result.slice(0, target - 3) + "...";
  }
  return result;
}

/**
 * @param {CodepenFeedData} feed
 */
function codepenFeedToTable(feed) {
  const { head, items } = feed;
  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle });
  const width = 100;
  const height = (9 / 16) * width;
  const itemsData = items.map((n) => {
    const { title, date, link } = n;
    const penID = link.split("/").pop();
    const ssBase = `https://assets.codepen.io/3/internal`;
    const ssEndpoint = `screenshots/pens/${penID}.default.png`;
    const ssQS = new URLSearchParams({ width, height, quality: 80 });
    const src = `${ssBase}/${ssEndpoint}?${ssQS}`;
    const imgTag = createElement("img", { src, width, height });
    const linkIt = (content) => {
      return createElement("a", { href: link, rel: "nofollow" }, content);
    };
    return [
      linkIt(imgTag),
      linkIt(shortenTitle(title, 32)),
      dateFormatter.format(date),
    ];
  });
  return table(["", "Title", "Last updated"], itemsData);
}

/**
 * @param {string} result
 */
function saveReadme(result) {
  return fs.writeFile(path.resolve(__dirname, "../README.md"), result);
}
