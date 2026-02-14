export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const body = req.body;
  const chatId = body.message?.chat?.id;
  const text = body.message?.text;

  if (!chatId) {
    return res.status(200).send("No chat");
  }

  if (text === "/rates") {
    try {
      const response = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
      const data = await response.json();

      const usd = data.Valute.USD.Value;
      const eur = data.Valute.EUR.Value;
      const cny = data.Valute.CNY.Value;
      const gold = data.Valute.XAU?.Value || "нет данных";
      const platinum = data.Valute.XPT?.Value || "нет данных";

      const message = `
💱 Курсы ЦБ РФ:

USD: ${usd} ₽
EUR: ${eur} ₽
CNY: ${cny} ₽

🥇 Золото: ${gold}
🥈 Платина: ${platinum}
      `;

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });

    } catch (err) {
      console.error(err);
    }
  }

  res.status(200).send("OK");
}
