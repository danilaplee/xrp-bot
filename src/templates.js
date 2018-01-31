const language = require("./language")

module.exports.single_offer = (ctx, data) => {
	const lang= ctx.session_data.language
	const buy = language[lang][data.type+"_xrp"]
	var html  = buy.replace(" XRP", "")+" ("+data.bank+") \n@"+data.author.username
		html += "\n"+language[lang].verification+": ✅"+language[lang].documents
		html += "\n"+language[lang].rating+": 👶 (36.1) ✅"
		html += "\n"+language[lang].reviews+": (11)👍 (0)👎"
		html += "\n"+language[lang].last_seen+": "+language[lang].just_now
		html += "\n"+language[lang].description+": "+data.description
		html += "\n"
		html += "\n"+language[lang]["total1_"+data.type]+""+data.price+" "+data.currency+" "
		html += "\n"+language[lang].total2+""+data.min_value+" "+data.currency+" - "+data.max_value+" "+data.currency

		return html;
}