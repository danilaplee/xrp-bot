const 	Telegraf 	= require('telegraf')
const 	Router 		= require('telegraf/router')
const 	Composer 	= require('telegraf/composer')
const 	Extra 		= require('telegraf/extra')
const 	session 	= require('telegraf/session')
const 	Stage 		= require('telegraf/stage')
const 	Markup 		= require('telegraf/markup')
const 	WizardScene = require('telegraf/scenes/wizard')
const 	model 		= require("./model")
var		currency 	= require("./currency")

///////////////////////////////////////////

const BOT_TOKEN = "504639171:AAE-W3XHavp1UtTfnXTWVSdg6QVghEvatLA"
const bot 		= new Telegraf(BOT_TOKEN)
const languages = ['🇺🇸 English', '🇷🇺 Русский']
const currencies = ['🇺🇸 USD', '🇷🇺 RUR']
const language 	= 
{
	"russian":
	{
		"welcome":"Добро пожаловать в *AnyCoin XRP-Ripple Бот*",
		"currency":"Выбрать валюту",
		"buy_xrp":"Купить XRP",
		"sell_xrp":"Продать XRP",
		"wallet":"Кошелёк",
		"your_wallet":"Ваш ID Кошелька XRP",
		"use_wallet":"Используйте его чтобы принимать XRP",
		"balance":"Ваш Баланс ",
		"change_language":"Сменить язык",
		"transfer_xrp":"Вывести средства",
		"market_price":"Рыночная Стоимость",
		"menu_text":"Главное меню",
		"select_currency":"Выберите валюту"
	},
	"english":
	{
		"welcome":"Welcome to *AnyCoin XRP-Ripple Bot*",
		"currency":"Select currency",
		"buy_xrp":"Buy XRP",
		"sell_xrp":"Sell XRP",
		"wallet":"Wallet",
		"your_wallet":"Your XRP Wallet ID",
		"use_wallet":"Use it to receive XRP",
		"balance":"Your Balance ",
		"change_language":"Change language",
		"transfer_xrp":"Transfer Balance",
		"market_price":"Market Price",
		"menu_text":"Main menu",
		"select_currency":"Select a currency"
	}
}

const mongoSession = function(ctx, next) {

	var id;
	
	if(ctx.update && ctx.update.message && ctx.update.message.from.id) id = ctx.update.message.from.id
	if(ctx.from.id) id = ctx.from.id
	
	ctx.id = id;

	if(next && ctx.session_data) return next()

	model._user.findOne({telegram_id:id.toString()}, function(err, data){
		if(err) console.error(err)
		ctx.session_data = data;
		if(next) next()
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
	console.log(ctx.session_data)
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
	console.log(ctx.session_data)
	var currency;
	if(ctx.session_data) currency = ctx.session_data.currency
	return new Promise((resolve, reject) => {
		model._user.update(
		   { telegram_id: ctx.id },
		   { "language": language },
		   function(err, numberAffected, rawResponse) {
		   		console.log(err,numberAffected, rawResponse)
		   		ctx.session_data = null;
		   		mongoSession(ctx, function() {
		   			if(!currency) return selectCurrency(ctx).then(resolve)
		   			return mainMenu(ctx).then(resolve)
		   		})
		   } 
		)
	})
}

const setCurrency = (ctx, currency) => {
	return new Promise((resolve, reject) => {
		model._user.update(
		   { telegram_id: ctx.id },
		   { "currency": currency },
		   (err, numberAffected, rawResponse) => {
		   		console.log(err,numberAffected, rawResponse)
		   		ctx.session_data = null;
		   		mongoSession(ctx, () => {
					mainMenu(ctx)
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
	    	resolve()
		})
	})
}

bot.use(session())

bot.use(mongoSession)

bot.command('start', ctx => {
	model._user.remove({}, function() {
		if(ctx.session_data == null) createUser(ctx).catch(err => {
			console.error(err)
		})
		selectLanguage(ctx)
	})

})

bot.hears('🇺🇸 English', ctx => setLanguage(ctx, "english"))
bot.hears('🇷🇺 Русский', ctx => setLanguage(ctx, "russian"))
bot.hears('🇺🇸 USD', ctx => setCurrency(ctx, "USD"))
bot.hears('🇷🇺 RUR', ctx => setCurrency(ctx, "RUR"))

bot.action('change_language', ctx => selectLanguage(ctx))

bot.action('currency', ctx => selectCurrency(ctx))

bot.action("transfer_xrp", ctx => {
	const lang = ctx.session_data.language
	ctx.reply("*"+language[lang].transfer_xrp+"*", {parse_mode:"Markdown"})
})

bot.action("currency", ctx => {
	const lang = ctx.session_data.language
	ctx.reply("*"+language[lang].currency+"*", {parse_mode:"Markdown"})
})

bot.action("buy_xrp", ctx => {
	const lang = ctx.session_data.language
	ctx.reply("*"+language[lang].buy_xrp+"*", {parse_mode:"Markdown"})
})

bot.action("sell_xrp", ctx => {
	const lang = ctx.session_data.language
	ctx.reply("*"+language[lang].sell_xrp+"*", {parse_mode:"Markdown"})
})

bot.action("wallet", ctx => {

	const lang = ctx.session_data.language
	const text = language[lang].your_wallet+"\n"+language[lang].use_wallet
	const text2 = language[lang].balance
	const sendUI = function() 
	{
		const wallet = ctx.session_data.wallet
		console.log("account info for wallet")
		console.log(wallet)
		currency.api.getAccountInfo(wallet)
		.then(data => {

			console.log(data)

			const balance = data.xrpBalance + " XRP"
			ctx.reply("*"+wallet+"*\n"+text+"\n"+text2+" *"+balance+"*", {parse_mode:"Markdown"})
		})
		.catch(err => {		
			console.error(err)

			const balance = "0 XRP"
			ctx.reply("*"+wallet+"*\n"+text+"\n"+text2+" *"+balance+"*", {parse_mode:"Markdown"})
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