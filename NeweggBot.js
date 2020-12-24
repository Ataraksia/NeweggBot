const puppeteer = require('puppeteer')
const config = require('./config.json')

async function report (log) {
	currentTime = new Date();
	console.log(currentTime.toString().split('G')[0] + ': ' + log)
}
async function check_cart (page) {
	const amountElementName = ".summary-content-total"
	
	await page.waitForTimeout(250)
	try {
		await page.waitForSelector('button.close' , { timeout: 6000 })
		var maskCloseButton = await page.$$('button.close')
		if (maskCloseButton.length > 0) {
			await maskCloseButton[0].click()
		}

		await page.waitForSelector(amountElementName, { timeout: 1000 })
		var amountElement = await page.$(amountElementName)
		var text = await page.evaluate(element => element.textContent, amountElement)
		// Check that the Cart total is not zero - indicating that the cart has items
		if (parseInt(text.split('$')[1]) === 0) {
			throw new Error("There are no items in the cart")
		}
		if (parseInt(text.split('$')[1]) > config.price_limit) {
			await report("Price exceeds limit, removing from cart")
			var button = await page.$$('button.btn.btn-mini');
			while (true) {
				try {
					await button[1].click()
				} catch (err) {
					break
				}
			}
			return false
		}
		await report("Card added to cart, attempting to purchase")
		return true
	} catch (err) {
		await report(err)
		await report("Card not in stock")
		await page.waitForTimeout(config.refresh_time * 1000)
		return false
	}
}


async function run () {
	await report("Started")
	const browser = await puppeteer.launch({
			args: ['-wait-for-browser', '--single-process'],
			headless: false,
			product: 'firefox',
        	defaultViewport: { width: 1366, height: 768 }
    	})
    const page = await browser.newPage()
	
    while (true) {
		await page.goto('https://secure.newegg.com/NewMyAccount/AccountLogin.aspx?nextpage=https%3a%2f%2fwww.newegg.com%2f' , {waitUntil: 'load' })
		if (page.url().includes('signin')) {
			await page.waitForSelector('button.btn.btn-orange')
			await page.type('#labeled-input-signEmail', config.email)
			await page.click('button.btn.btn-orange')
			await page.waitForTimeout(1500)
			try {
				await page.waitForSelector('#labeled-input-signEmail', {timeout: 500})
			} catch (err) {
				try {
					await page.waitForSelector('#labeled-input-password' , {timeout: 2500})
					await page.waitForSelector('button.btn.btn-orange')
					await page.type('#labeled-input-password', config.password)
					await page.click('button.btn.btn-orange')
					await page.waitForTimeout(1500)
					try {
						await page.waitForSelector('#labeled-input-password', {timeout: 500})
					} catch (err) {
						break
					}
				} catch (err) {
					report("Manual authorization code required by Newegg.  This should only happen once.")
					while (page.url().includes('signin'))
					{
						await page.waitForTimeout(500)
					}
					break
				}
			}
		} else if (page.url().includes("areyouahuman")) {
			await page.waitForTimeout(1000)
		}
	}

	await report("Logged in")
	await report("Checking for card")

	while (true)
	{
		try {
			await page.goto('https://secure.newegg.com/Shopping/AddtoCart.aspx?Submit=ADD&ItemList=' + config.item_number, { waitUntil: 'load' })
			if (page.url().includes("Cart")) {
				var check = await check_cart(page)
				if (check) {
					break
				}
			} else if (page.url().includes("ShoppingItem")) {
				await page.goto('https://secure.newegg.com/Shopping/ShoppingCart.aspx', { waitUntil: 'load' })
				var check = await check_cart(page)
				if (check){
					break
				}
			} else if (page.url().includes("areyouahuman")) {
				await page.waitForTimeout(1000)
			}
		} catch (err) {
			continue
		}
	}
	try {
		const [button] = await page.$x("//button[contains(., 'Secure Checkout')]")
		if (button) {
			await report("Starting Secure Checkout")
			await button.click()
		}
	} catch (err) {
	}
	
	while (true) {
		try {
			await page.waitForSelector("[placeholder='CVV2']", { timeout: 3000 })
			await page.focus("[placeholder='CVV2']", { timeout: 5000 })
			await page.type("[placeholder='CVV2']", config.cv2)
			break
		} catch (err) {
		}
		try {
			await page.waitForSelector('#creditCardCVV2' , {timeout: 500})
			await page.type('#creditCardCVV2', config.cv2)
			break
		} catch (err) {
		}
	}

	try {
		await page.waitForSelector('#term' , {timeout: 5000})	
		await page.click('#term')
	} catch (err) {
	}

	if (config.auto_submit == 'true') {
		await page.click('#btnCreditCard')
	}
	await report("Completed purchase")
    	//await browser.close()
}


run()
