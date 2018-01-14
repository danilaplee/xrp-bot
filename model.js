const mongoose 	= require('mongoose');
	  mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
	  mongoose.Promise = global.Promise;

const models = {
	"_user":mongoose.model('xrp_user', { 
		username: String,
		first_name:String,
		last_name:String,
		is_bot:Boolean,
		account:String,
		trades:[String],
		telegram_id: String,
		language:String,
		chat_id:String,
		matrix_id:String,
		currency:String,
		xrp_secret:String,
		wallet:String,
		updated: { type: Date, default: Date.now }, 
	}),
	"_offer":mongoose.model('xrp_offer', {
		author:String,
		name: String, 
		price:Number,
		currency:String,
		bank:String,
		volume_min: Number, 
		volume_max:Number, 
  		updated: { type: Date, default: Date.now } 
 	}),
	"_trade":mongoose.model('xrp_trade', {
		buyer:String,
		seller:String,
		name: String, 
		volume:Number,
		currency: String,
		method:String,
		blocked:Boolean,
		done:Boolean,
  		updated: { type: Date, default: Date.now } 
 	}),
 	"_currency":mongoose.model("xrp_currency", {
 		name:String,
 		code:String,
 		intCode:Number,
 		methods:[String]
 	})
}

module.exports = models 