const language 	= require("./language")
const model 	= require("./model")
const languages = require("./const/languages")
const currencies= require("./const/currencies")
const banks 	= require("./const/banks") 
const Markup 	= require('telegraf/markup')
const Stage 	= require('telegraf/stage')
const Scene 	= require('telegraf/scenes/base')
const mSession 	= require("./mongoSession")
const mongoose 	= require('mongoose');
const emojiStrip = require('emoji-strip')
const mongoSession 		= mSession.mongoSession
const mongoSessionUpdate = mSession.mongoSessionUpdate
var currency = {};

const selectCurrency = ctx => {
	const lang = ctx.session_data.language
	const select_currency = language[lang].select_currency
	return ctx.reply(select_currency, Markup
    .keyboard([currencies])
    .oneTime()
    .resize()
    .extra())
}

/////////////////// MAIN SCENE /////////////////// 

const mainMenuScene = new Scene('mainMenu')

const mainMenuKeyboard = function(ctx) {

	console.log("==== main_menu_keyboard =====")
	const lang 	= ctx.session_data.language
	const market = ctx.session_data.currency + " / XRP"
	const value = currency[ctx.session_data.currency.toLowerCase()]
	const price = language[lang].market_price + " *" + value+ " " + market +"*"
	const l 	= language[lang]
	const keyboard = [[l.wallet, l.menu_text]]

	return ctx.reply(price, {parse_mode:"Markdown"}) 
	.then(()=>{
		return ctx.reply("/", Markup.keyboard(keyboard).resize().extra())
	});
}

mainMenuScene.enter(ctx => {
	return mainMenuKeyboard(ctx)
})

mainMenuScene.on("text", ctx => {
	console.log(ctx.session_data)
	const text = ctx.message.text.toString();
	const lang = ctx.session_data.language
	if(text == language[lang].menu_text) return mainMenu(ctx);
	if(text == language[lang].wallet.toString()) return module.exports.openWallet(ctx);
	if(text == '🇺🇸 English') return module.exports.setLanguage(ctx, "english")
	if(text == '🇷🇺 Русский') return module.exports.setLanguage(ctx, "russian")
	if(text == '🇺🇸 USD') return module.exports.setCurrency(ctx, "USD")
	if(text == '🇷🇺 RUR') return module.exports.setCurrency(ctx, "RUR")
	return mainMenuKeyboard(ctx)
})

/////////////////// MAIN SCENE /////////////////// 

const mainMenu = (ctx) => {
	const lang = ctx.session_data.language 
	const welcome = language[lang].welcome
	const market = ctx.session_data.currency + " / XRP"
	const value = currency[ctx.session_data.currency.toLowerCase()]
	const price = language[lang].market_price + " *" + value+ " " + market +"*"
	const balance = ""
	const text = welcome
	const menu_text = language[lang].menu_text
	const keyboard = [
		[Markup.callbackButton(language[lang].currency, 'currency')],
		[Markup.callbackButton(language[lang].wallet, 'wallet')],
	    [Markup.callbackButton(language[lang].buy_xrp, 'buy_xrp')],
	    [Markup.callbackButton(language[lang].sell_xrp, 'sell_xrp')],
	    [Markup.callbackButton(language[lang].create_offer, 'create_offer')],
	    [Markup.callbackButton(language[lang].my_offers, 'my_offers')],
	    [Markup.callbackButton(language[lang].change_language, 'change_language')],
	    [Markup.callbackButton(language[lang].transfer_xrp, 'transfer_xrp')]
    ]
	return ctx.reply(menu_text,Markup.inlineKeyboard(keyboard).resize().extra())
	.then(()=>ctx.reply(text, {parse_mode:"Markdown"})) 
	.then(()=>{
		if(ctx.scene && ctx.scene.state == "mainMenu") return;
		return ctx.scene.enter("mainMenu")
	})
}

module.exports = {}

module.exports.injectServices = (services) => {
	currency = services.currency
}

module.exports.mainMenu = mainMenu

module.exports.selectCurrency = selectCurrency

module.exports.selectLanguage = ctx => {
	return ctx.reply('Select a language in the list', Markup
    .keyboard([languages])
    .oneTime()
    .resize()
    .extra())
}

module.exports.setLanguage = (ctx, language) => {
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

module.exports.setCurrency = (ctx, currency) => {
	var old;
	console.log("setting currency")
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

module.exports.createUser = (ctx) => {
	var from;
	if(ctx.update.message.from.id) from = ctx.update.message.from
	if(ctx.from.id) from = ctx.from
	return new Promise((resolve, reject) => {
		console.log(from)
		const new_user = 
		{
  			_id: new mongoose.Types.ObjectId(),
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
	    	console.log('======= created new user '+from.username+' =====');
	    	console.log(err)
	    	model._user.findOne({telegram_id:from.id.toString()}, function(err, data)
	    	{
				if(err) console.error("not found new user err", err)

	    		console.log("======= found user after create ======= ")
		    	console.log(data)
				ctx.session_data = data;
		    	resolve(ctx)
			})
		})
	})
}

module.exports.openWallet = (ctx) => {
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
}


module.exports.scenes = [mainMenuScene]