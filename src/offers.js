const Markup 			= require('telegraf/markup')
const Stage 			= require('telegraf/stage')
const Scene 			= require('telegraf/scenes/base')
const model 	 		= require("./model")
const languages 		= require("./const/languages")
const currencies 		= require("./const/currencies")
const banks 			= require("./const/banks") 
const mongoose 			= require('mongoose');
const language 			= require("./language")
const { single_offer }	= require("./templates")
const { enter, leave } = Stage
var currency, user;


const bankKeyboard = (ctx, operation) => {
	const lang = ctx.session_data.language
	const c = ctx.session_data.currency
	const b = []
	const keyboard = []
	model._offer.find({"type":operation,"currency":c}).distinct("bank", function(err, data)
	{
		if(data.length == 0) return ctx.reply(language[lang].no_operations)

		for (var i = 0; i < data.length; i++) b[i] = [data[i]]

		for (var i = 0; i < b.length; i++) {
			for (var d = 0; d < b[i].length; d++) {
				if(!keyboard[i]) keyboard[i] = []
				const url = operation+"bank:"+b[i][d]
				keyboard[i].push(Markup.callbackButton(b[i][d], url))
			}
		}
		return ctx.reply(language[lang].sell_xrp_select_bank,Markup.inlineKeyboard(keyboard).resize().extra())
	})
}

const bankFind = (bank, type) => {
	return new Promise((res, rej) =>{
		model
		._offer
		.find({bank:bank, type:type})
		.sort({ price: -1 })
		.populate("author")
		.exec(function(err, _data)
		{
			if(err) return rej(err)
			res(_data)
		})
	})
}

const bankReply = (ctx, bank, type) => {
	const lang = ctx.session_data.language
	const no_offers = language[lang].no_offers
	return bankFind(bank, type)
	.then(function(_data){
		if(_data.length == 0) return ctx.reply(no_offers)
		var title = language[lang][type+"_orders"] + " " + bank
		var keyboard = []
		try {
			for (var i = 0; i < _data.length; i++) {
				if(!_data[i] || !_data[i].price) continue;
				const text = _data[i].price + " " + _data[i].currency + " @" + _data[i].author.username
				keyboard.push([Markup.callbackButton(text, "open_offer:"+_data[i]._id)])
			}
		}
		catch(err) {
			console.error("==== bank reply error ====")
			console.error(err)
		}
		ctx.reply(title,Markup.inlineKeyboard(keyboard).resize().extra())
	})
}

module.exports.injectServices = (services) => {
	currency = services.currency
	user 	 = require("./user")
	user.injectServices({"currency":currency})
}

module.exports.bankKeyboard = bankKeyboard

module.exports.BankBuy 		= (ctx, bank) => bankReply(ctx, bank, "buy")

module.exports.BankSell 	= (ctx, bank) => bankReply(ctx, bank, "sell")

module.exports.create_offer = (ctx) => Stage.enter("offer")

module.exports.my_offers 	= (ctx) => {
	const lang = ctx.session_data.language
	console.log(languages, lang)
	const no_my_offers = language[lang].no_my_offers
	const your_offers  = language[lang].your_offers
	return new Promise((res,rej) => {
		model
		._offer
		.find({author:ctx.session_data._id})
		.exec(function(err, _data)
		{
			if(err) console.error(err)
			console.log(_data)
			if(_data.length == 0) return ctx.reply(no_my_offers)
			var keyboard = []
			for (var i = 0; i < _data.length; i++) {
				if(!_data[i] || !_data[i].price) continue;
				const operation = _data[i].type
				const text = operation+": "+_data[i].name + ": " + _data[i].bank + " / " + _data[i].price + " " + _data[i].currency
				keyboard.push([Markup.callbackButton(text, "edit_offer:"+_data[i]._id)])
			}
			return ctx.reply(your_offers,Markup.inlineKeyboard(keyboard).resize().extra())
		})
		.then(()=>{
			return ctx.scene.enter("mainMenu");
		}).then(res)
	})
}

module.exports.edit_offer   = (ctx, id) => {
	const lang = ctx.session_data.language
	const cancel = language[lang].cancel
	const remove = language[lang].delete_offer
	model._offer.find({_id:id}).exec(function(err, _data){
		if(_data.length == 0) return user.mainMenu(ctx);
		const frase = language[lang].edit_question + _data[0].name + "?"
		const keyboard = Markup.inlineKeyboard([Markup.callbackButton(remove, "delete_offer:"+id)])
		return ctx.reply(frase, keyboard.oneTime().resize().extra());
	})
} 

module.exports.delete_offer = (ctx, id) => {
	model._offer.remove({_id:id}).exec(function(err, _data){
		return module.exports.my_offers(ctx)
	})
}

module.exports.open_offer = (ctx, id) => {
	const lang = ctx.session_data.language
	return new Promise((res,rej) => {
		model._offer.find({_id:id}).populate("author").exec((err, _data)=>{
			if(err) return rej(err)
			if(_data.length == 0) return res(null);
			res(_data)
		})
	})
	.then((d) => {
		if(!d) return null;
		const template = single_offer(ctx, d[0])
		const buy_text = language[lang].buy_offer
		const keyboard = Markup.inlineKeyboard([Markup.callbackButton(buy_text, "buy_offer:"+id)])
		return ctx.reply(template, keyboard.oneTime().resize().extra())
	})
	.then(() => {
		console.log("after html template")
	})

}

/////////////////// OFFER SCENE /////////////////// 

const offerScene = new Scene('offer')

const payment_keyboard = (ctx) => {
	console.log("==== payment_keyboard =====")
	const lang = ctx.session_data.language
	const select_payment = language[lang].select_payment

	return ctx.reply(select_payment, Markup.keyboard(banks[ctx.session_data.currency], language[lang].cancel)
    .oneTime()
    .resize()
    .extra())
}

const option_keyboard = ctx => {
	console.log("==== option_keyboard =====")
	const lang = ctx.session_data.language
	const type = language[lang].select_offer_type
	const keyboard = [language[lang].offer_type_sell, language[lang].offer_type_buy, language[lang].cancel]

	return ctx.reply(type, Markup.keyboard(keyboard)
    .oneTime()
    .resize()
    .extra())
}

const save_offer_keyboard = ctx => {
	console.log("==== save_keyboard =====")
	const lang = ctx.session_data.language
	const type = language[lang].save_offer
	const keyboard = [language[lang].save, language[lang].cancel, language[lang].restart]

	return ctx.reply(type, Markup.keyboard(keyboard)
    .oneTime()
    .resize()
    .extra())
}
const replyWithFraseAndCancel = (ctx, frase) => {
	const lang = ctx.session_data.language
	const cancel = language[lang].cancel
	const back = language[lang].back
	return ctx.reply(frase, Markup.keyboard([cancel, back])
    .oneTime()
    .resize()
    .extra());
}

const sendSubmitOfferError = (ctx, type) => {
	console.log("send error")

	const lang 					= ctx.session_data.language
	const invalid_offer_name 	= language[lang].invalid_offer_name
	const invalid_bank_name 	= language[lang].invalid_bank_name
	const enter_min_value 		= language[lang].enter_min_value.replace("{currency}", ctx.session_data.currency)
	const enter_max_value 		= language[lang].enter_max_value.replace("{currency}", ctx.session_data.currency)
	const enter_price 			= language[lang].enter_price.replace("{currency}", ctx.session_data.currency)
	
	if(type == "type") return option_keyboard(ctx);
	if(type == "name") return replyWithFraseAndCancel(ctx,invalid_offer_name);
	if(type == "bank") return replyWithFraseAndCancel(ctx,invalid_bank_name);
	if(type == "min_value") return replyWithFraseAndCancel(ctx,enter_min_value);
	if(type == "max_value") return replyWithFraseAndCancel(ctx,enter_max_value);
	if(type == "price") return replyWithFraseAndCancel(ctx, enter_price)
	if(type == "final") return save_offer_keyboard(ctx);
}

const validateInput = (ctx, input, type) => {
	return new Promise((res) => {
		if(type == "name" && input && input.length > 2) res(true)
		if(type == "bank" && input && input.length > 3) res(true)
		if(type == "description") res(true)
		if(type == "min_value" && parseInt(input) && parseInt(input) >= 1) res(true)
		if(type == "max_value" && parseInt(input) && parseInt(input) >= ctx.scene.state.offer.min_value) res(true)
		if(type == "price" && input && parseInt(input) >= 1) res(true)
		res(false)
	})
}

const submitOfferInfo = (ctx, type) => {
	const lang = ctx.session_data.language
	const enter_min_value 	= language[lang].enter_min_value.replace("{currency}", ctx.session_data.currency)
	const enter_max_value 	= language[lang].enter_max_value.replace("{currency}", ctx.session_data.currency)
	const enter_description = language[lang].enter_description
	const enter_price 		= language[lang].enter_price.replace("{currency}", ctx.session_data.currency)
	const enter_name 		= language[lang].enter_name
	const input 			= ctx.message.text
	if(type == "type") 
	{
		if(ctx.message.text == language[lang].offer_type_sell) ctx.scene.state.offer.type = "buy"
		if(ctx.message.text == language[lang].offer_type_buy) ctx.scene.state.offer.type = "sell"
		if(!ctx.scene.state.offer.type) return sendSubmitOfferError(ctx, type);
		ctx.scene.state.entering_type = false
		ctx.scene.state.entering_name = true
		return replyWithFraseAndCancel(ctx, enter_name)
	}
	validateInput(ctx, input, type).then(valid => {

		if(!valid) return sendSubmitOfferError(ctx, type)
		ctx.scene.state.offer[type] = input

		if(type == "name") {
			ctx.scene.state.entering_name = false;
			ctx.scene.state.entering_payment = true;
			return payment_keyboard(ctx)
		}

		if(type == "bank") {
			ctx.scene.state.entering_payment = false;
			ctx.scene.state.entering_min_value = true;
			return replyWithFraseAndCancel(ctx,enter_min_value)
		}
		if(type == "min_value") {
			ctx.scene.state.entering_min_value = false;
			ctx.scene.state.entering_max_value = true;
			return replyWithFraseAndCancel(ctx,enter_max_value)
		}
		if(type == "max_value") {
			ctx.scene.state.entering_max_value = false;
			ctx.scene.state.entering_price = true;
			return replyWithFraseAndCancel(ctx,enter_price)
		}
		if(type == "price") {
			ctx.scene.state.entering_price = false;
			ctx.scene.state.entering_description = true;
			return replyWithFraseAndCancel(ctx, enter_description)
		}
		if(type == "description") {
			ctx.scene.state.entering_description = false;
			ctx.scene.state.saving = true;
			return save_offer_keyboard(ctx)
		}
	})
}

const submitOffer = ctx => {
	const lang = ctx.session_data.language
	const offer = ctx.scene.state.offer
	offer._id = new mongoose.Types.ObjectId()
	if(ctx.message.text == language[lang].save) {
		var o = new model._offer(offer)
			o.save(function(err, data) 
			{
		    	console.log('======= new offer =====');
		    	console.log(data[0])
		    	module.exports.my_offers(ctx)
			});
	}
}

const cancelOffer = enter("mainMenu")

const rewindOffer = (ctx) => {

	if(ctx.scene.state.entering_name) return ctx.scene.enter("offer")
	if(ctx.scene.state.entering_min_value) {
		ctx.message.text = ctx.scene.state.offer.name
		ctx.scene.state.entering_min_value = false;
		return submitOfferInfo(ctx, "name")
	}
	if(ctx.scene.state.entering_max_value) {
		ctx.message.text = ctx.scene.state.offer.bank
		ctx.scene.state.entering_max_value = false;
		return submitOfferInfo(ctx, "bank")
	}
	if(ctx.scene.state.entering_price)  {
		ctx.message.text = ctx.scene.state.offer.min_value
		ctx.scene.state.entering_price = false;
		return submitOfferInfo(ctx, "min_value")
	}
	if(ctx.scene.state.entering_description) {
		ctx.message.text = ctx.scene.state.offer.max_value
		ctx.scene.state.entering_description = false;
		return submitOfferInfo(ctx, "max_value")
	}
	if(ctx.scene.state.saving) {
		ctx.message.text = ctx.scene.state.offer.price
		ctx.scene.state.saving = false;
		return submitOfferInfo(ctx, "price")
	}
}

offerScene.enter(ctx => {
	console.log("==== entered offer scene ====")
	const lang = ctx.session_data.language
	const type = language[lang].select_offer_type
	const keyboard = [language[lang].offer_type_sell, language[lang].offer_type_buy, language[lang].cancel]
	return ctx.reply(type, Markup.keyboard(keyboard).oneTime().resize().extra()).then(()=>{
		console.log("==== reply ====")
		return new Promise(resolve =>resolve(ctx))
	})
})

offerScene.leave(ctx => {
	console.log(ctx.scene.state)
})

offerScene.on('text', (ctx) => {
	// console.log(ctx.session_data)
	const lang = ctx.session_data.language
	if(ctx.message.text == language[lang].cancel) return cancelOffer(ctx)
	if(ctx.message.text == language[lang].back) return rewindOffer(ctx)
	if(ctx.message.text == language[lang].restart) return ctx.scene.enter("offer")
	if(ctx.scene.state.saving) return submitOffer(ctx)
	if(ctx.scene.state.entering_type) return submitOfferInfo(ctx, "type")
	if(ctx.scene.state.entering_name) return submitOfferInfo(ctx, "name")
	if(ctx.scene.state.entering_payment) return submitOfferInfo(ctx, "bank")
	if(ctx.scene.state.entering_price) return submitOfferInfo(ctx, "price")
	if(ctx.scene.state.entering_min_value) return submitOfferInfo(ctx, "min_value")
	if(ctx.scene.state.entering_max_value) return submitOfferInfo(ctx, "max_value")
	if(ctx.scene.state.entering_description) return submitOfferInfo(ctx, "description")
})

/////////////////// OFFER SCENE /////////////////// 


module.exports.scenes 		= [offerScene]