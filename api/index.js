const { Telegraf } = require(&#039;telegraf&#039;);

// Создаем бота, токен он возьмет из настроек Vercel (мы  их добавим позже)
const bot = new Telegraf(process.env.BOT_TOKEN);

// Функция для получения курса с сайта ЦБ (через зеркало)
async function getCBRRate() {
    try {
        const response = await fetch(&#039;https://www.cbr-xml-daily.ru&#039;);
        const data = await response.json();
        const usdRate = data.Valute.USD.Value.toFixed(2);
        const date = new Date(data.Date).toLocaleDateString(&#039;ru-RU&#039;);
        return `💵 Курс доллара: ${usdRate} ₽\n📅 На дату: ${date}`;
    } catch (error) {
        console.error(&#039;Ошибка ЦБ:&#039;, error);
        return &#039;Не удалось получить данные от ЦБ ❌&#039;;
    }
}

// Команда /start
bot.start((ctx) =&gt; {
    ctx.reply(&#039;Привет! Я бот курсов валют. Нажми на кнопку или напиши /rate&#039;, {
        reply_markup: {
            keyboard: [[{ text: &quot;📊 Узнать курс USD&quot; }]],
            resize_keyboard: true
        }
    });
});

// Ответ на текст кнопки или команду /rate
bot.hears(&#039;📊 Узнать курс USD&#039;, async (ctx) =&gt; {
    const rateMessage = await getCBRRate();
    await ctx.reply(rateMessage);
});

bot.command(&#039;rate&#039;, async (ctx) =&gt; {
    const rateMessage = await getCBRRate();
    await ctx.reply(rateMessage);
});

// Главная часть для Vercel: обработка входящих сообщений от Telegram
module.exports = async (req, res) =&gt; {
    try {
        // Проверяем, что это POST запрос от Telegram
        if (req.method === &#039;POST&#039;) {
            await bot.handleUpdate(req.body);
        }
        res.status(200).send(&#039;OK&#039;);
    } catch (err) {
        console.error(&#039;Ошибка обработки:&#039;, err);
        res.status(500).send(&#039;Error&#039;);
    }
};
