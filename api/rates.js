export const config = {
  api: {
    bodyParser: false,
  },
};

function extractValueFromXml(xml, name) {
  const regex = new RegExp(`<Vcode>${name}<\\/Vcode>[\\s\\S]*?<Vcurs>([0-9.]+)<\\/Vcurs>`);
  const match = xml.match(regex);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
}

export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => resolve(data));
      req.on("error", () => reject(data));
    });

    const payload = JSON.parse(body);
    const chatId = payload.message?.chat?.id;
    const text = payload.message?.text;

    if (!chatId) {
      return res.status(200).send("NO CHAT");
    }

    if (text === "/rates") {

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yy = today.getFullYear();

      const soapBody = `
        <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                         xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                         xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
          <soap12:Body>
            <GetCursOnDateXML xmlns="http://web.cbr.ru/">
              <On_date>${dd}/${mm}/${yy}</On_date>
            </GetCursOnDateXML>
          </soap12:Body>
        </soap12:Envelope>
      `;

      const response = await fetch("https://www.cbr.ru/DailyInfoWebServ/DailyInfo.asmx", {
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        body: soapBody,
      });

      const xml = await response.text();

      const usd = extractValueFromXml(xml, "USD");
      const eur = extractValueFromXml(xml, "EUR");
      const cny = extractValueFromXml(xml, "CNY");

      const gold = extractValueFromXml(xml, "XAU"); // золото
      const platinum = extractValueFromXml(xml, "XPT"); // платина

      const message =
        `💱 Курсы ЦБ РФ на ${dd}.${mm}.${yy}:\n\n` +
        `USD: ${usd !== null ? usd.toFixed(2) + " ₽" : "нет данных"}\n` +
        `EUR: ${eur !== null ? eur.toFixed(2) + " ₽" : "нет данных"}\n` +
        `CNY: ${cny !== null ? cny.toFixed(2) + " ₽" : "нет данных"}\n\n` +
        `🥇 Золото (XAU): ${gold !== null ? gold.toFixed(2) + " ₽" : "нет данных"}\n` +
        `⚪ Платина (XPT): ${platinum !== null ? platinum.toFixed(2) + " ₽" : "нет данных"}`;

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });

    }

    return res.status(200).send("OK");

  } catch (error) {
    console.error(error);
    return res.status(500).send("Error");
  }
}
