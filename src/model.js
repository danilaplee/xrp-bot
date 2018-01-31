const mongoose 	= require('mongoose');
	  mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
const Float = require('mongoose-float').loadType(mongoose);
	  mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const models = {
	"_user":mongoose.model('xrp_user', Schema({ 
		_id: Schema.Types.ObjectId,
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
		offers: [{ type: Schema.Types.ObjectId, ref: 'xrp_offer' }],
		trades: [{ type: Schema.Types.ObjectId, ref: 'xrp_trade' }],
		updated: { type: Date, default: Date.now }, 
	})),
	"_offer":mongoose.model('xrp_offer', Schema({
		_id: Schema.Types.ObjectId,
		author:{ type: Schema.Types.ObjectId, ref: 'xrp_user' },
		name: String, 
		price:Number,
		currency:String,
		bank:String,
		type:String,
		description:String,
		min_value:Number, 
		max_value:Number, 
  		updated: { type: Date, default: Date.now } 
 	})),
	"_trade":mongoose.model('xrp_trade', Schema({
		_id: Schema.Types.ObjectId,
		offer:{ type: Schema.Types.ObjectId, ref: 'xrp_offer' },
		buyer:{ type: Schema.Types.ObjectId, ref: 'xrp_user' },
		seller:{ type: Schema.Types.ObjectId, ref: 'xrp_user' },
		name: String, 
		volume:Float,
		crypto_volume:Float,
		comission:Float,
		currency: String,
		rate:Float,
		method:String,
		garant_id:String,
		garant_key:String,
		seller_paid:Boolean,
		buyer_received:Boolean,
		seller_confirmed:Boolean,
		buyer_confirmed:Boolean,
		canceled:Boolean,
		done:Boolean,
  		updated: { type: Date, default: Date.now } 
 	})),
 	"_currency":mongoose.model("xrp_currency", {
 		name:String,
 		code:String,
 		intCode:Number,
 		methods:[String]
 	})
}

module.exports = models 