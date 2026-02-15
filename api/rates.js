export const config = {
  api: {
    bodyParser: true,
  },
};

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

      // Валюты
      const currencyResponse = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
      const currencyData = await currencyResponse.json();

      const usd = currencyData.Valute.USD.Value.toFixed(2);
      const eur = currencyData.Valute.EUR.Value.toFixed(2);
      const cny = currencyData.Valute.CNY.Value.toFixed(2);

      // Металлы (без падения если ошибка)
      let gold = "нет данных";
      let platinum = "нет данных";

      try {
        const metalResponse = await fetch("https://www.cbr-xml-daily.ru/daily_json_metall.json");
        const metalData = await metalResponse.json();

        if (metalData.XAU?.Value) {
          gold = metalData.XAU.Value.toFixed(2);
        }

        if (metalData.XPT?.Value) {
          platinum = metalData.XPT.Value.toFixed(2);
        }

      } catch (e) {
        console.log("Металлы не загрузились");
      }

      const message =
        `💱 Курсы ЦБ РФ:\n\n` +
        `USD: ${usd} ₽\n` +
        `EUR: ${eur} ₽\n` +
        `CNY: ${cny} ₽\n\n` +
        `🥇 Золото: ${gold} ₽\n` +
        `⚪ Платина: ${platinum} ₽`;

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
