const path = require("path");
const { promises: fs } = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const username = "devilstudio27";

(async () => {
  try {
    const template = await loadTemplateReadme();
    const feed = await getCodepenFeed(username);

    const table = generateTable(feed.items);

    const result = template
      .replaceAll("{{CODEPEN_TABLE}}", table)
      .replaceAll("{{UPDATED_TIMESTAMP}}", new Date().toUTCString());

    await saveReadme(result);

    console.log("✅ README updated successfully");

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();

async function loadTemplateReadme() {
  const file = path.resolve(__dirname, "./README.template.md");
  return fs.readFile(file, "utf8");
}

async function getCodepenFeed(username) {
  const url = `https://codepen.io/${username}/pens/public/`;

  console.log("Scraping:", url);

  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const items = [];

  $("article").each((_, el) => {
    const title = $(el).find("h2 a").text().trim();
    const href = $(el).find("h2 a").attr("href");

    if (title && href) {
      items.push({
        title,
        link: `https://codepen.io${href}`,
      });
    }
  });

  if (!items.length) {
    throw new Error("No pens found");
  }

  return { items: items.slice(0, 5) }; // limit to 5
}

function generateTable(items) {
  return items
    .map(
      (item) =>
        `- 🔗 [${item.title}](${item.link})`
    )
    .join("\n");
}

async function saveReadme(content) {
  const file = path.resolve(__dirname, "../README.md");
  const current = await fs.readFile(file, "utf8");

  if (current !== content) {
    await fs.writeFile(file, content);
    console.log("📄 README updated");
  } else {
    console.log("⚠️ No changes detected");
  }
}