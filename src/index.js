const 	Telegraf 	= require('telegraf')
const 	Router 		= require('telegraf/router')
const 	Composer 	= require('telegraf/composer')
const 	Extra 		= require('telegraf/extra')
const 	session 	= require('telegraf/session')
const 	Stage 		= require('telegraf/stage')
const 	Markup 		= require('telegraf/markup')
const { enter, leave } 	= Stage

/////////////IMPORT CODE////////////
const 	model 		= require("./model")
const	currency 	= require("./currency")

const 	user 		= require("./user")
		user.injectServices({"currency":currency})

const 	offers 		= require("./offers")
		offers.injectServices({"currency":currency})

const 	mSession 	= require("./mongoSession")

//////ASSIGN GLOBALS///////
const selectCurrency 	= user.selectCurrency
const selectLanguage 	= user.selectLanguage
const setLanguage 		= user.setLanguage
const setCurrency 		= user.setCurrency
const createUser 		= user.createUser
const mongoSession 		= mSession.mongoSession
const mongoSessionUpdate = mSession.mongoSessionUpdate

///////////////////////////////////////////
const MAIN_BOT_TOKEN = "504639171:AAE-W3XHavp1UtTfnXTWVSdg6QVghEvatLA"
const DEV_BOT_TOKEN = "456077044:AAHrjwmWh068po1aqnnxIs4q5L0Pws_9IIA"
const dev_url 	= 't.me/rippletestbot?'
const prod_url 	= 't.me/AnyCoinXRP_bot?'
const BOT_URL 	= dev_url;
const BOT_TOKEN = DEV_BOT_TOKEN
const bot 		= new Telegraf(BOT_TOKEN)
const languages = require("./const/languages")
const currencies = require("./const/currencies")
const banks 	= require("./const/banks") 
const language 	= require("./language")
const scenes = offers.scenes
const stage = new Stage()
for (var i = 0; i < scenes.length; i++) stage.register(scenes[i])

bot.use(session())

bot.use(mongoSession)

bot.use(stage.middleware())

bot.command('start', ctx => {
	if(ctx.session_data == null) return createUser(ctx)
	.then(context => {
		selectLanguage(context)
	})
	.catch(err => {
		console.error(err)
	})
	mongoSessionUpdate(ctx, {is_waiting_for_sell_sum:null, is_waiting_for_buy_sum:null})
	.then(cc=>selectLanguage(cc))
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

bot.action("menu", 			ctx => user.mainMenu(ctx))

bot.action("buy_xrp", 		ctx => offers.bankKeyboard(ctx, "buy"))

bot.action("sell_xrp", 		ctx => offers.bankKeyboard(ctx, "sell"))

bot.action("create_offer", 	ctx => offers.create_offer(ctx))

bot.action("my_offers", 	ctx => offers.my_offers(ctx))

bot.action("wallet", 		ctx => user.openWallet(ctx))


bot.on('callback_query', ctx => {
	if(!ctx || !ctx.update || !ctx.update.callback_query.data) return;
	const data = ctx.update.callback_query.data.split(":")
	const action = data[0]
	if(action == "buybank") return offers.BankBuy(ctx, data[1])
	if(action == "sellbank") return offers.BankSell(ctx, data[1]) 
	if(action == "edit_offer") return offers.edit_offer(ctx, data[1])
	if(action == "delete_offer") return offers.delete_offer(ctx, data[1])
})

bot.startPolling()