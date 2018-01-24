const RippleAPI = require('ripple-lib').RippleAPI;
const request = require("request")
const api = new RippleAPI({
  	server: 'wss://s1.ripple.com' // Public rippled server
});

const xrp_usd = "https://api.cryptonator.com/api/ticker/xrp-usd"
const xrp_rur = "https://api.cryptonator.com/api/ticker/xrp-rur"


class Currency {
	constructor() 
	{
		this.api = api
		
		this.api.connect().then(() => {
			console.log(this.api.isConnected())
		})

		this.xrp_usd = () => {
			return new Promise(resolve => {
				request(xrp_usd, function (error, response, body) {
					resolve(body)
				})
			})
		}
		this.xrp_rur = () => {
			return new Promise(resolve => {
				request(xrp_rur, function (error, response, body) {
					resolve(body)
				})
			})
		}
		this.reloadPrices = () => {
			this.xrp_usd().then(data=>{ this.usd = JSON.parse(data).ticker.price })
			this.xrp_rur().then(data=>{ this.rur = JSON.parse(data).ticker.price })
		}
		setInterval(this.reloadPrices, 60000)
		this.reloadPrices()
		return this
	}
}

module.exports = new Currency()