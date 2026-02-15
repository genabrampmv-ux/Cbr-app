// ===== Металлы (официальный сайт ЦБ) =====

const today = new Date();
const day = String(today.getDate()).padStart(2, "0");
const month = String(today.getMonth() + 1).padStart(2, "0");
const year = today.getFullYear();

const dateString = `${day}.${month}.${year}`;

const metalUrl = `https://www.cbr.ru/hd_base/metall/metall_base_new/?date_req=${dateString}`;

const metalRes = await fetch(metalUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0",
  },
});

const metalHtml = await metalRes.text();

function extractMetal(name) {
  const regex = new RegExp(`${name}[\\s\\S]*?<td>([0-9\\s,]+)<\\/td>`);
  const match = metalHtml.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\s/g, "").replace(",", ".");
  }
  return "нет данных";
}

const gold = extractMetal("Золото");
const silver = extractMetal("Серебро");
const platinum = extractMetal("Платина");
const palladium = extractMetal("Палладий");
