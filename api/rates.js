export const config = {
  api: {
    bodyParser: true,
  },
};

function extractMetal(html, metalName) {
  const regex = new RegExp(`<td>${metalName}<\\/td>\\s*<td>([0-9,\\.\\s]+)<\\/td>`);
  const match = html.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\s/g, "").replace(",", ".");
  }
  return null;
}

export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const body = req.body;
    const chatId = body.message?.chat?.id;
    const text = body.message?.text;

    if (!chatId) {
      return res.status(200).send("No chat id");
    }

    if (text === "/rates") {

      // ===== Валюты (официальный XML ЦБ) =====
      const currencyRes = await fetch("https://www.cbr.ru/scripts/XML_daily.asp");
      const currencyXml = await currencyRes.text();

      const extractCurrency = (code) => {
        const regex = new RegExp(
          `<CharCode>${code}<\\/CharCode>[\\s\\S]*?<Value>([0-9,]+)<\\/Value>`
        );
        const match = currencyXml.match(regex);
        if (match && match[1]) {
          return match[1].replace(",", ".");
        }
        return "нет данных";
      };

      const usd = extractCurrency("USD");
      const eur = extractCurrency("EUR");
      const cny = extractCurrency("CNY");

      // ===== Металлы (официальная страница ЦБ) =====
      const metalRes = await fetch("https://www.cbr.ru/hd_base/metall/");
      const metalHtml = await metalRes.text();

      const gold = extractMetal(metalHtml, "Золото") || "нет данных";
      const silver = extractMetal(metalHtml, "Серебро") || "нет данных";
      const platinum = extractMetal(metalHtml, "Платина") || "нет данных";
      const palladium = extractMetal(metalHtml, "Палладий") || "нет данных";

      const message =
        `💱 Официальные курсы ЦБ РФ:\n\n` +
        `USD: ${usd} ₽\n` +
        `EUR: ${eur} ₽\n` +
        `CNY: ${cny} ₽\n\n` +
        `🥇 Золото: ${gold} ₽/г\n` +
        `⚪ Серебро: ${silver} ₽/г\n` +
        `🔷 Платина: ${platinum} ₽/г\n` +
        `🟣 Палладий: ${palladium} ₽/г`;

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });
    }

    res.status(200).send("OK");

  } catch (error) {
    console.error(error);
    res.status(200).send("Error");
  }
}
