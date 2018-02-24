const Markup 			= require('telegraf/markup')
const Stage 			= require('telegraf/stage')
const Scene 			= require('telegraf/scenes/base')
const model 	 		= require("./model")
const languages 		= require("./const/languages")
const currencies 		= require("./const/currencies")
const banks 			= require("./const/banks") 
const mongoose 			= require('mongoose');
const language 			= require("./language")

var user, currency;

const trade_scene = new Scene('trade')

const enterTradeSum = (ctx) => {
	console.log("entering trade sum")
	const lang = ctx.session_data.language
	var enter_sum = language[lang].enter_trade_sum
	const input = ctx.message.text
	const _data = ctx.scene.state.offer
	enter_sum = enter_sum.replace("{min}", _data.min_value).replace("{max}", _data.max_value).replace(/{currency}/g, _data.currency)
	console.log(parseInt(input))
	if(!parseInt(input) || !Number.isInteger(parseInt(input))) return ctx.reply(enter_sum);
	if(parseInt(input) > _data.max_value || parseInt(input) < _data.min_value) return ctx.reply(enter_sum);
	ctx.scene.state.enter_trade_sum = false;
	const confirm_trade = language[lang].confirm_trade;
	ctx.scene.state.trade_sum = input
	const cancel = language[lang].cancel
	const confirm = language[lang].confirm

	return validateOffer(ctx).then(context=>{
		const trade_id = context.scene.state.trade._id
		const keyboard = Markup.inlineKeyboard([Markup.callbackButton(cancel, 'cancel_trade:'+trade_id),Markup.callbackButton(confirm, 'confirm_trade:'+trade_id)])
		context.reply(confirm_trade, keyboard.resize().extra())
	})
}

const validateOffer = (ctx) => {
	return new Promise((res, rej)=> {
		const _id 		= ctx.scene.state.offer._id
		const _sum 		= parseInt(ctx.scene.state.trade_sum)
		const _currency = ctx.scene.state.offer.currency
		const _rate 	= parseInt(ctx.scene.state.offer.price)
		const crypto_volume =  _sum / _rate; 

		console.log("validating trade for offer #"+_id+" and value = "+_sum+" "+_currency+" at rate "+_rate)
		console.log("total trade xrp = "+crypto_volume)

		var _data = {
			_id:new mongoose.Types.ObjectId(),
			offer:_id,
			buyer:ctx.session_data._id,
			seller:ctx.scene.state.offer.author._id,
			volume:_sum,
			crypto_volume:crypto_volume,
			rate:_rate,
			currency:_currency,
			method:ctx.scene.state.offer.bank
		}

		var tr = new model._trade(_data)
		tr.save((err,data)=>{
			if(err) return rej(err)
			console.log("==== after save ====")
			console.log(err,data)
			ctx.scene.state.trade = data
			res(ctx)
		})
	})
} 


trade_scene.enter((ctx,next) => {
	console.log("==== entering trade scene ====")
	ctx.scene.state = {
		enter_trade_sum:false,
		offer:{}
	}
	return next(ctx)
})

trade_scene.on('text', (ctx, next) => {
	console.log("entering trade text "+ctx.message.text)
	console.log(ctx.scene.state)
	if(ctx.scene.state.enter_trade_sum) enterTradeSum(ctx)
	return next()
})

module.exports.injectServices = (services) => {
	user = services.user
	currency = services.currency
}

module.exports.scenes = [trade_scene]

module.exports.create_trade = (ctx, offer_id) => {
	
	const lang = ctx.session_data.language
	var enter_sum = language[lang].enter_trade_sum
	return new Promise((res,rej) => {
		model
		._offer
		.find({_id:offer_id})
		.populate("author")
		.exec((err, _data)=> {
			if(err) return rej(err)
			console.log(_data[0])
			ctx.scene.enter("trade")
			ctx.scene.state.offer = _data[0]; 
			ctx.scene.state.enter_trade_sum = true;
			enter_sum = enter_sum.replace("{min}", _data[0].min_value).replace("{max}", _data[0].max_value).replace(/{currency}/g, _data[0].currency)
			ctx
			.reply(enter_sum)
			.then((context)=>{
				res(_data[0]);
			})
				
		})
	})
}

module.exports.confirm_trade = (ctx, _id) => {
	const lang = ctx.session_data.language
	const trade_confirmed = language[lang].trade_confirmed
	const waiting_for_trader = language[lang].waiting_for_trader
	const trade_canceled = language[lang].trade_canceled
	return new Promise((res,rej) => {
		model
		._trade
		.find({_id:_id})
		.populate(["buyer", "seller", "offer"])
		.exec((err, _data)=> {
			console.log(_data)
			res(ctx.reply(trade_confirmed).then(()=>{return ctx.reply(waiting_for_trader)}))
			setTimeout(()=>ctx.reply(trade_canceled), 60000*5)
		})
	});
}


module.exports.cancel_trade = (ctx, _id) => {
	const lang = ctx.session_data.language
	const trade_canceled = language[lang].trade_canceled
	return new Promise((res,rej) => {
		model
		._trade
		.find({_id:_id})
		.populate(["buyer", "seller", "offer"])
		.exec((err, _data)=> {
			console.log(_data)
			res(ctx.reply(trade_canceled))
		})
	});
}












