const puppeteer = require('C:/servers/apache/data/htdocs/puppeteer.dom/www/node_modules/puppeteer'); // а вот ето хорошо!
const fs = require("fs"); // работа с файловой системой

var url = 'https://www.rbc.ru/';
var timestamp = Date.now();
var width = 1480;
var height = 1768;
var save_file = 'news.json';
var news_limit = 15;
var bad_elems = ['live-tv-popup'];
var all_news_class = 'news-feed__item';

//==========================================================================================

    (async() => 
        {
        // -----------------------------------------------------------------------------
        const browser = await puppeteer.launch( // Запустим браузер
            {
            width: width,
            height: height,
            args: 
                [
                //'--no-sandbox', // отрубает песочницу (выполнение скриптов в безопасной среде)
                // '--single-process',
                // '--no-zygote',
                //'--disable-setuid-sandbox', // отрубает песочницу(еще какую то) (выполнение скриптов в безопасной среде)
                '--disable-infobars', // отрубает сообщения типа "браузер выполняется автоматом"
                '--no-first-run',
                `--window-size=${width},${height}`,
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-skip-list',
                '--disable-dev-shm-usage', // что то насчет проблем с нехваткой места/памяти
                '--disable-accelerated-2d-canvas', // Disable gpu-accelerated 2d canvas
                '--disable-gpu', // Отключает аппаратное ускорение графического процессора. Если средство визуализации программного обеспечения отсутствует, процесс графического процессора не запустится
                '--hide-scrollbars', // Скрыть полосы прокрутки от скриншотов
                '--disable-notifications', // Отключает веб-уведомления и Push API.
                '--disable-extensions', // Отключить расширения
                '--force-color-profile=srgb', // Принудительно обрабатывать все мониторы, как если бы они имели указанный цветовой профиль. Допустимые значения: «srgb» и «generic-rgb» (в настоящее время используются тестами макетов Mac) и «color-spin-gamma24» (используются тестами макетов)
                '--mute-audio', // Отключение звука, передаваемого на аудиоустройство, чтобы оно не было слышно во время автоматического тестирования
                '--disable-background-timer-throttling', // Отключить регулирование задач таймера на фоновых страницах
                '--disable-backgrounding-occluded-windows', // Отключить фоновые рендеры для окклюдированных окон. Сделано для тестов, чтобы избежать недетерминированного поведения
                '--disable-breakpad', // Отключение отчетов о сбоях.
                '--disable-component-extensions-with-background-pages', // Отключите расширения компонентов по умолчанию для фоновых страниц - полезно для тестов производительности, где эти страницы могут влиять на результаты перфорации
                //'--disable-features=TranslateUI,BlinkGenPropertyTrees', // Comma-separated list of feature names to disable. See also kEnableFeatures.
                //'--disable-ipc-flooding-protection', // Отключает защиту от наводнений IPC. Он активирован по умолчанию. Некоторые функции javascript могут использоваться для заполнения процесса браузера IPC. Эта защита ограничивает скорость, с которой они могут быть использованы.
                '--disable-renderer-backgrounding', // Предотвратить фоновый процесс рендерера, когда установлен
                '--enable-features=TranslateUI,NetworkService,NetworkServiceInProcess',
                '--auto-open-devtools-for-tabs', // auto open devtool window
                '--deny-permission-prompts' // Предотвращает появление запросов на разрешение путем отказа вместо отображения запросов.
                ],
            //userDataDir: __dirname + '/asd',
            headless: true
            });

        page = await browser.newPage(); // Откроем новую страницу

        await page.setViewport(
            {
            width: width, // устанавливаем самое лучшее разрешение экрана
            height: height
            });


		await pupp_main(browser, url);


        await browser.close(); // Всё сделано, закроем браузер
        process.exit() // аналог die() в пышечке
        // -----------------------------------------------------------------------------
        }
    )();

//==========================================================================================

    async function pupp_main(browser, curr_url)
        {
        try 
            {
            await page.goto(url, {waitUntil: 'networkidle2'}); // Попробуем перейти по URL
			console.log(`page opening: ${url}`);
            await timeout(1000);
			
			await trach_erase(bad_elems);
			
			let news_list = await get_news_list(all_news_class); // получение списка урл на новости
			
			var news_data = [];
			
			if (news_list && news_list.length > 0)
				{
				let counter = 1;
				for (let one_new of news_list)
					{
					if (counter > news_limit){break;}
					
					url = one_new;
					
					await page.goto(url, {waitUntil: 'networkidle2'}); // Попробуем перейти по URL
					console.log('go to: ' + counter + '. ' + url);
					await trach_erase(bad_elems);
					//await timeout(1000);
					
					let one_news_data;
					one_news_data = await grab_news();

					if (one_news_data.length === 4)
						{
						console.log('data parsed');
						one_news_data.push(url);
						news_data.push(one_news_data);
						}
					counter++;
					}
				}
            }
        catch (error) 
            {
            console.log(`cant't open page: ${url} before error: ${error}`);
            }
        finally
            {
			news_data = await JSON.stringify(news_data);
			await fs.writeFileSync(save_file, news_data);
			console.log('news saved');
            }
        }

//===============================       FUNCTIONS       ====================================
function timeout(ms) 
    {
    return new Promise(resolve => setTimeout(resolve, ms));
    }

async function trach_erase(to_crop_arr)
	{
	await page.evaluate(function(to_crop_arr)
		{
		to_crop_arr.forEach(function(i)
			{
			if (document.querySelector('.'+i))
				{document.querySelector('.'+i).remove();}
			});
		}, to_crop_arr, {waitUntil: 'networkidle2'});
	}

async function get_news_list(news_class)
	{
	return await page.evaluate(function(news_class)
		{
		let all = document.querySelectorAll('.news-feed__item');
		
		var list = [];

		all.forEach(function(e)
			{
			if (/^https:\/\/www\.rbc\.ru/.test(e.href) === true)
				{
				list.push(e.href);
				}
			});
		
		return list;
		}, news_class, {waitUntil: 'networkidle2'});
	}

async function grab_news()
	{
	let content = await page.evaluate(function()
			{
			let title = '';
			let overview = '';
			let all_text = '';
			let image_link = '';
			let content = [];
			content['title'] = 'NO VALUE';
			content['overview'] = 'NO VALUE';
			content['text'] = 'NO VALUE';
			
			let main_elem = document.querySelector('.l-col-main');
			
			if (main_elem.querySelector('.article__header__title-in'))
				{title = main_elem.querySelector('.article__header__title-in').textContent;}
			if (main_elem.querySelector('.article__text__overview > span'))
				{overview = main_elem.querySelector('.article__text__overview > span').textContent;}
			if (main_elem.querySelector('.article__main-image__image'))
				{image_link = main_elem.querySelector('.article__main-image__image').getAttribute('src');}

			main_elem.querySelectorAll('p').forEach(function(e)
				{
				let text = e.textContent;

				if (text !== undefined && text.length > 0)
					{
					all_text += e.textContent.trim();
					}
				});
			
			if (title.length > 10) {content['title'] = title;}
			if (overview.length > 10) {content['overview'] = overview;}
			if (all_text.length > 10) {content['text'] = all_text;}
			if (all_text.length > 10) {content['image_link'] = image_link;}

			return [content['title'], content['overview'], content['text'], content['image_link']];

			return content;
			}, {waitUntil: 'networkidle2'});
	
	if (content.length === 4){ return content;}
	return false;
	}
