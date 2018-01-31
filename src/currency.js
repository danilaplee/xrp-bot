const RippleAPI = require('ripple-lib').RippleAPI;
const request = require("request")
const api = new RippleAPI({
  	server: 'wss://s.altnet.rippletest.net:51233' // Public rippled server
});

const xrp_usd = "https://api.cryptonator.com/api/ticker/xrp-usd"
const xrp_rur = "https://api.cryptonator.com/api/ticker/xrp-rur"
const multi_xrp = "https://min-api.cryptocompare.com/data/price?fsym=XRP&tsyms=BTC,USD,EUR,RUR"


class Currency {
	constructor() 
	{
		this.api = api
		
		this.api.connect().then(() => {
			console.log("connected to riple network == "+this.api.isConnected())
		})

		this.multi_xrp = () => {
			return new Promise(resolve => {
				request(multi_xrp, function (error, response, body) {
					resolve(body)
				})
			})

		}

		this.reloadPrices = () => {
		
			this.multi_xrp().then(data=>{ 

				const d = JSON.parse(data)
				console.log("=====================")
				console.log("cryptocompare result:")
				console.log(d)
				console.log("=====================")
				this.usd = d.USD
				this.rur = d.RUR
				this.eur = d.EUR
				this.btc = d.BTC

			})
		
		}
		setInterval(this.reloadPrices, 60000)
		this.reloadPrices()
		return this
	}
}

module.exports = new Currency()