const model = require("./model")

module.exports = {}

module.exports.mongoSession = function(ctx, next) {

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

module.exports.mongoSessionUpdate = (ctx, update) => {
	var old;
	var keys = Object.keys(update)
	for (var i = 0; i < keys.length; i++) ctx.session_data[keys[i]] = update[keys[i]]

	return new Promise((resolve, reject) => {
		model._user.update(
		   { telegram_id: ctx.id },
		   update,
		   (err, numberAffected, rawResponse) => {
		   		console.log(err,numberAffected, rawResponse)
		   		if(err) return reject(err)
		   		old = ctx.session_data;
		   		ctx.session_data = null;
		   		ctx.session_data = old
		   		resolve(ctx)
		   } 
		)
	})
}

