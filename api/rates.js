export default async function handler(req, res) {
  try {
    const currencyRes = await fetch(
      'https://www.cbr-xml-daily.ru/daily_json.js'
    );
    const currencyData = await currencyRes.json();

    const metalsRes = await fetch(
      'https://www.cbr.ru/hd_base/metall/metall_base_new/'
    );
    const metalsText = await metalsRes.text();

    const goldMatch = metalsText.match(/Золото[\s\S]*?<td>([\d,.]+)<\/td>/);
    const silverMatch = metalsText.match(/Серебро[\s\S]*?<td>([\d,.]+)<\/td>/);

    res.status(200).json({
      USD: currencyData.Valute.USD.Value,
      EUR: currencyData.Valute.EUR.Value,
      CNY: currencyData.Valute.CNY.Value,
      Gold: goldMatch ? goldMatch[1] : null,
      Silver: silverMatch ? silverMatch[1] : null,
      updated: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}
