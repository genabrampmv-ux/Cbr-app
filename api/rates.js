export default async function handler(req, res) {
  try {
    // ===== Валюты =====
    const currencyRes = await fetch(
      'https://www.cbr-xml-daily.ru/daily_json.js'
    );
    const currencyData = await currencyRes.json();

    // ===== Металлы =====
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const date = `${day}/${month}/${year}`;

    const metalsRes = await fetch(
      `https://www.cbr.ru/scripts/xml_metall.asp?date_req1=${date}&date_req2=${date}`
    );
    const metalsText = await metalsRes.text();

    const goldMatch = metalsText.match(/Code="1"[\s\S]*?<Buy>([\d,]+)<\/Buy>/);
    const silverMatch = metalsText.match(/Code="2"[\s\S]*?<Buy>([\d,]+)<\/Buy>/);

    res.status(200).json({
      USD: currencyData.Valute.USD.Value,
      EUR: currencyData.Valute.EUR.Value,
      CNY: currencyData.Valute.CNY.Value,
      Gold: goldMatch ? goldMatch[1].replace(',', '.') : null,
      Silver: silverMatch ? silverMatch[1].replace(',', '.') : null,
      updated: new Date().toISOString()
    });

  } catch (e) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}
