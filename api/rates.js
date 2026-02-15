export const config = {
  api: {
    bodyParser: true,
  },
};

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function getMetals(chatId, TOKEN) {
  let date = new Date();

  for (let i = 0; i < 7; i++) {
    const formatted = formatDate(date);

    const url = `https://www.cbr.ru/scripts/xml_metall.asp?date_req1=${formatted}&date_req2=${formatted}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const xml = await res.text();

    // --- ОТЛАДКА ---
    if (!xml || !xml.includes("Record")) {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `DEBUG: ${formatted} — данных нет.\nОтвет ЦБ (первые 200 символов):\n${xml.substring(0, 200)}`,
        }),
      });

      date.setDate(date.getDate() - 1);
      continue;
    }

    const extract = (buyCode) => {
      const regex = new RegExp(
        `BuyCode="${buyCode}"[^>]*>[\\s\\S]*?<Buy>([^<]+)<\\/Buy>`,
        "i"
      );

      const match = xml.match(regex);

      if (!match) return "нет данных";

      return match[1]
        .replace(/[\s\u00A0]/g, "")
        .replace(",", ".");
    };

    return {
      date: formatted,
      gold: extract("1"),
      silver: extract("2"),
      platinum: extract("3"),
      palladium: extract("4"),
    };
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

      // ===== Валюты =====
      const currencyRes = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const currencyXml = await currencyRes.text();

      const extractCurrency = (code) => {
        const regex = new RegExp(
          `<CharCode>${code}<\\/CharCode>[\\s\\S]*?<Value>([^<]+)<\\/Value>`
        );

        const match = currencyXml.match(regex);

        if (!match) return "нет данных";

        return match[1]
          .replace(/[\s\u00A0]/g, "")
          .replace(",", ".");
      };

      const usd = extractCurrency("USD");
      const eur = extractCurrency("EUR");
      const cny = extractCurrency("CNY");

      // ===== Металлы =====
      const metals = await getMetals(chatId, TOKEN);

      const metalsText = metals
        ? `📅 Дата металлов: ${metals.date}\n\n` +
          `🥇 Золото: ${metals.gold} ₽/г\n` +
          `⚪ Серебро: ${metals.silver} ₽/г\n` +
          `🔷 Платина: ${metals.platinum} ₽/г\n` +
          `🟣 Палладий: ${metals.palladium} ₽/г`
        : `❌ Металлы: Данные не найдены за 7 дней`;

      const message =
        `💱 Курсы ЦБ РФ:\n\n` +
        `USD: ${usd} ₽\n` +
        `EUR: ${eur} ₽\n` +
        `CNY: ${cny} ₽\n\n` +
        metalsText;

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
