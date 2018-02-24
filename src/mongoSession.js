const model = require("./model")

module.exports = {}

module.exports.mongoSession = function(ctx, next) {
	
	if(ctx.update && ctx.update.message && ctx.update.message.from.id) ctx.id = ctx.update.message.from.id
	if(ctx.from.id) ctx.id = ctx.from.id

	const id = ctx.id;

	if(next && ctx.session_data) return next()
	return new Promise(resolve=>{
		model._user.findOne({telegram_id:id.toString()}, function(err, data){
			if(err) console.error(err)
			console.log("found user from db ", data)
			ctx.session_data = data;
			if(next) return resolve(next(ctx))
			return resolve()
		})
	})
}

module.exports.mongoSessionUpdate = (ctx, update) => {
	var old;
	var keys = Object.keys(update)
	console.log(ctx.session_data)
	for (var i = 0; i < keys.length; i++) ctx.session_data[keys[i]] = update[keys[i]]

	return new Promise((resolve, reject) => {
		model._user.update(
		   { telegram_id: ctx.id },
		   update,
		   (err, numberAffected, rawResponse) => {
		   		console.log(err, numberAffected, rawResponse)
		   		if(err) return reject(err)
		   		old = ctx.session_data;
		   		ctx.session_data = null;
		   		ctx.session_data = old
		   		resolve(ctx)
		   } 
		)
	})
}

