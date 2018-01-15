const 	Telegraf 	= require('telegraf')
const 	Router 		= require('telegraf/router')
const 	Composer 	= require('telegraf/composer')
const 	Extra 		= require('telegraf/extra')
const 	session 	= require('telegraf/session')
const 	Markup 		= require('telegraf/markup')
const 	model 		= require("./model")
const	currency 	= require("./currency")

///////////////////////////////////////////

const BOT_TOKEN = "504639171:AAE-W3XHavp1UtTfnXTWVSdg6QVghEvatLA"
const bot 		= new Telegraf(BOT_TOKEN)
const languages = ['🇺🇸 English', '🇷🇺 Русский']
const currencies = ['🇺🇸 USD', '🇷🇺 RUR']
const banks = {
	"USD":[["Bank of America"],[ "Raiffaissen"],["Citibank"]],
	"RUR":[["QIWI", "Сбербанк"],["Альфа-банк", "Газпромбанк"],["Райфайзен", "ВТБ 24"]]
}
const transfer_min = 1
const language 	= 
{
	"russian":
	{
		"welcome":"Добро пожаловать в *AnyCoin XRP-Ripple Бот*",
		"currency":"💱Выбрать валюту",
		"buy_xrp":"📈 Купить XRP",
		"sell_xrp":"📉 Продать XRP",
		"sell_xrp_not_allowed":"Продажа доступна от баланса "+transfer_min+" XRP",
		"wallet":"🔑 Кошелёк",
		"your_wallet":"Ваш ID Кошелька XRP",
		"use_wallet":"Используйте его чтобы принимать XRP",
		"balance":"Ваш Баланс",
		"change_language":"Сменить язык",
		"transfer_xrp":"Вывести средства",
		"transfer_xrp_not_allowed":"Вывод средств доступен от баланса "+transfer_min+" XRP",
		"market_price":"Рыночная Стоимость",
		"menu_text":"Главное меню",
		"select_currency":"Выберите валюту",
		"sell_xrp_select_bank":"Выберите банк"
	},
	"english":
	{
		"welcome":"Welcome to *AnyCoin XRP-Ripple Bot*",
		"currency":"💱Select currency",
		"buy_xrp":"📈 Buy XRP",
		"sell_xrp":"📉 Sell XRP",
		"sell_xrp_not_allowed":"Selling is available starting from balance "+transfer_min+" XRP",
		"wallet":"🔑 Wallet",
		"your_wallet":"Your XRP Wallet ID",
		"use_wallet":"Use it to receive XRP",
		"balance":"Your Balance",
		"change_language":"Change language",
		"transfer_xrp":"Transfer Balance",
		"transfer_xrp_not_allowed":"Transfer is available starting from balance "+transfer_min+" XRP",
		"market_price":"Market Price",
		"menu_text":"Main menu",
		"select_currency":"Select a currency",
		"sell_xrp_select_bank":"Select a bank"
	}
}

const mongoSession = function(ctx, next) {

	if(ctx.update && ctx.update.message && ctx.update.message.from.id) ctx.id = ctx.update.message.from.id
	if(ctx.from.id) ctx.id = ctx.from.id

	const id = ctx.id;

	if(next && ctx.session_data) return next()

	model._user.findOne({telegram_id:id.toString()}, function(err, data){
		if(err) console.error(err)
	
		ctx.session_data = data;

		if(next) next(ctx)
	})
}

const selectCurrency = ctx => {
	const lang = ctx.session_data.language
	const select_currency = language[lang].select_currency
	return ctx.reply(select_currency, Markup
    .keyboard([currencies])
    .oneTime()
    .resize()
    .extra())
}

const selectLanguage = ctx => {
	return ctx.reply('Select a language in the list', Markup
    .keyboard([languages])
    .oneTime()
    .resize()
    .extra())
}

const mainMenu = (ctx) => {

	const lang = ctx.session_data.language 
	const welcome = language[lang].welcome
	const market = ctx.session_data.currency + " / XRP"
	const value = currency[ctx.session_data.currency.toLowerCase()]
	const price = language[lang].market_price + " *" + value+ " " + market +"*"
	const balance = ""
	const text = welcome+"\n"+price+""+"\n"+balance
	const menu_text = language[lang].menu_text
	const keyboard = [
			[
		      Markup.callbackButton(language[lang].currency, 'currency'),
		      Markup.callbackButton(language[lang].wallet, 'wallet')
		    ],
		    [
		      Markup.callbackButton(language[lang].buy_xrp, 'buy_xrp'),
		      Markup.callbackButton(language[lang].sell_xrp, 'sell_xrp')
		    ],
		    [
		      Markup.callbackButton(language[lang].change_language, 'change_language')
		    ]
	    ]
	if(ctx.session_data.wallet) keyboard[2].push(Markup.callbackButton(language[lang].transfer_xrp, 'transfer_xrp'))
	return ctx.reply(text, {parse_mode:"Markdown"}).then(()=>{
		ctx.reply(menu_text,Markup.inlineKeyboard(keyboard).extra())
	})
}

const setLanguage = (ctx, language) => {
	console.log("set language "+language)
	var old, currency;
	if(ctx.session_data) currency = ctx.session_data.currency
	return new Promise((resolve, reject) => {
		model._user.update(
		   { telegram_id: ctx.id },
		   { "language": language },
		   function(err, numberAffected, rawResponse) {
		   		console.log(err,numberAffected, rawResponse)
		   		old = ctx.session_data;
		   		ctx.session_data = null;
		   		mongoSession(ctx, function() {
		   			console.log("after update mongo")
		   			var new_ctx = ctx
		   			new_ctx.session_data = old
		   			new_ctx.session_data.language = language;
		   			if(!currency) return selectCurrency(new_ctx).then(resolve)
		   			return mainMenu(new_ctx).then(resolve)
		   		})
		   } 
		)
	})
}

const setCurrency = (ctx, currency) => {
	var old;
	return new Promise((resolve, reject) => {
		model._user.update(
		   { telegram_id: ctx.id },
		   { "currency": currency },
		   (err, numberAffected, rawResponse) => {
		   		console.log(err,numberAffected, rawResponse)
		   		old = ctx.session_data;
		   		ctx.session_data = null;
		   		mongoSession(ctx, () => {
		   			console.log("== after setting currency ==")
		   			var new_ctx = ctx
		   			new_ctx.session_data = old
		   			new_ctx.session_data.currency = currency;
		   			console.log(new_ctx.session_data)
					mainMenu(new_ctx)
		   		})
		   } 
		)
	})
}

const createUser = (ctx) => {
	var from;
	if(ctx.update.message.from.id) from = ctx.update.message.from
	if(ctx.from.id) from = ctx.from
	return new Promise((resolve, reject) => {
		const new_user = 
		{
			username:from.username,
			first_name:from.first_name,
			last_name:from.last_name,
			is_bot:from.is_bot,
			telegram_id:from.id
		}
		var user = new model._user(new_user)
		user.save(function (err, data) 
		{
		  	if (err) return reject(err)
	    	console.log('======= new user =====');
	    	console.log(data)
	    	model._user.findOne({telegram_id:from.id.toString()}, function(err, data)
	    	{
				if(err) console.error(err)
				ctx.session_data = data;
		    	resolve(ctx)
			})
		})
	})
}

const bankKeyboard = (ctx, operation) => {
	const lang = ctx.session_data.language
	const c = ctx.session_data.currency
	const b = banks[c]
	const keyboard = []
	for (var i = 0; i < b.length; i++) {
		for (var d = 0; d < b[i].length; d++) {
			if(!keyboard[i]) keyboard[i] = []
			keyboard[i].push(Markup.callbackButton(b[i][d], operation+" bank"))
		}
	}
	return ctx.reply(language[lang].sell_xrp_select_bank,Markup.inlineKeyboard(keyboard).extra())
}

bot.use(session())

bot.use(mongoSession)

bot.command('start', ctx => {
	if(ctx.session_data == null) return createUser(ctx)
	.then(context => {
		selectLanguage(context)
	})
	.catch(err => {
		console.error(err)
	})
	selectLanguage(ctx)
})

bot.hears('🇺🇸 English', ctx => setLanguage(ctx, "english"))
bot.hears('🇷🇺 Русский', ctx => setLanguage(ctx, "russian"))
bot.hears('🇺🇸 USD', ctx => setCurrency(ctx, "USD"))
bot.hears('🇷🇺 RUR', ctx => setCurrency(ctx, "RUR"))

bot.action('change_language', ctx => selectLanguage(ctx))

bot.action('currency', ctx => selectCurrency(ctx))

bot.action("transfer_xrp", ctx => {
	const lang = ctx.session_data.language
	const wallet = ctx.session_data.wallet
	currency.api.getAccountInfo(wallet)
	.then(data => {
		const balance = data.xrpBalance + " XRP"
		ctx.reply("*"+language[lang].transfer_xrp+"*", {parse_mode:"Markdown"})
	})
	.catch(err => {		
		console.error(err)
		ctx.reply("*"+language[lang].transfer_xrp_not_allowed+"*", {parse_mode:"Markdown"})
	})
})

bot.action("buy_xrp", ctx => {
	const curr = ctx.session_data.currency
	const lang = ctx.session_data.language
	return bankKeyboard(ctx, "buy")
})

bot.action("buy bank", ctx => {
	// console.log(ctx.update.callback_query)
	console.log(ctx.callbackQuery)
})


bot.action("sell_xrp", ctx => {

	const lang = ctx.session_data.language
	const wallet = ctx.session_data.wallet
	const curr = ctx.session_data.currency
	const replyWithNotAllowed = () => {
		ctx.reply("*"+language[lang].sell_xrp_not_allowed+"*", {parse_mode:"Markdown"})
	}
	return currency.api.connect()
	.then(()=>{ return currency.api.getAccountInfo(wallet) })
	.then(data => {
		const balance = data.xrpBalance + " XRP"
		if(balance < 1) return replyWithNotAllowed()
		return bankKeyboard(ctx, "sell")
	})
	.catch(err => {		
		console.error(err)
		replyWithNotAllowed()
	})

})

bot.action("wallet", ctx => {

	const lang = ctx.session_data.language
	const text2 = language[lang].balance
	const sendUI = function() 
	{
		const wallet 	= ctx.session_data.wallet
		const text 		= language[lang].your_wallet+": *"+wallet+"*\n"+language[lang].use_wallet
		currency.api.connect().then(()=>{ return currency.api.getAccountInfo(wallet) })
		.then(data => {

			console.log(data)
			const balance = data.xrpBalance + " XRP"
			ctx.reply(text+"\n"+text2+" *"+balance+"*", {parse_mode:"Markdown"})
		})
		.catch(err => {		
			console.error(err)

			const balance = "0 XRP"
			ctx.reply(text+"\n"+text2+" *"+balance+"*", {parse_mode:"Markdown"})
		})
	}
	if(!ctx.session_data.wallet) return currency.api.connect()
	.then(()=>{ return currency.api.generateAddress() })
	.then(data => {
		return new Promise(resolve => {
			model._user.update(
			{telegram_id:ctx.id},
			{
				wallet:data.address,
				xrp_secret:data.secret
			}, 
			function(){
				ctx.session_data = null
				mongoSession(ctx, resolve)
			})
		})
	})
	.then(sendUI);
	sendUI()
})

bot.startPolling()