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

async function getMetals() {
  let date = new Date();

  for (let i = 0; i < 7; i++) {
    const formatted = formatDate(date);

    const url = `https://www.cbr.ru/scripts/xml_metall.asp?date_req1=${formatted}&date_req2=${formatted}`;

    const res = await fetch(url);
    const xml = await res.text();

    if (xml.includes("<Record")) {

      const extract = (buyCode) => {
        const regex = new RegExp(
          `<Record[^>]*BuyCode="${buyCode}"[\\s\\S]*?<Buy>([\\s\\S]*?)<\\/Buy>`
        );

        const match = xml.match(regex);

        if (!match) return "нет данных";

        return match[1]
          .replace(/\s/g, "")     // удаляем все пробелы (включая неразрывные)
          .replace(",", ".");     // меняем запятую на точку
      };

      return {
        gold: extract("1"),
        silver: extract("2"),
        platinum: extract("3"),
        palladium: extract("4"),
      };
    }

    // если пусто — пробуем предыдущий день
    date.setDate(date.getDate() - 1);
  }

  return {
    gold: "нет данных",
    silver: "нет данных",
    platinum: "нет данных",
    palladium: "нет данных",
  };
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
      const currencyRes = await fetch("https://www.cbr.ru/scripts/XML_daily.asp");
      const currencyXml = await currencyRes.text();

      const extractCurrency = (code) => {
        const regex = new RegExp(
          `<CharCode>${code}<\\/CharCode>[\\s\\S]*?<Value>([\\s\\S]*?)<\\/Value>`
        );
        const match = currencyXml.match(regex);

        if (!match) return "нет данных";

        return match[1]
          .replace(/\s/g, "")
          .replace(",", ".");
      };

      const usd = extractCurrency("USD");
      const eur = extractCurrency("EUR");
      const cny = extractCurrency("CNY");

      // ===== Металлы =====
      const metals = await getMetals();

      const message =
        `💱 Официальные курсы ЦБ РФ:\n\n` +
        `USD: ${usd} ₽\n` +
        `EUR: ${eur} ₽\n` +
        `CNY: ${cny} ₽\n\n` +
        `🥇 Золото: ${metals.gold} ₽/г\n` +
        `⚪ Серебро: ${metals.silver} ₽/г\n` +
        `🔷 Платина: ${metals.platinum} ₽/г\n` +
        `🟣 Палладий: ${metals.palladium} ₽/г`;

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
