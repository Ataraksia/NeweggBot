const puppeteer = require('puppeteer')
const config = require('./config.json')
const log4js = require("log4js")

const logger = log4js.getLogger("Newegg Shopping Bot")
logger.level = "trace"

/** 
 * This value will set the ceiling on the random number of seconds to be added to the **refresh_time**.
 * To override the default value (11), set the randomized_wait_ceiling variable in the config.json.
 */ 
var randomizedWaitCeiling = config.randomized_wait_ceiling | 11;

async function check_cart(page) {
	await page.waitForTimeout(250)
	const amountElementName = ".summary-content-total"
	try {
		await page.waitForSelector(amountElementName, { timeout: 1000 })
		var amountElement = await page.$(amountElementName)
		var text = await page.evaluate(element => element.textContent, amountElement)
		// Check that the Cart total is not zero - indicating that the cart has items
		if (parseInt(text.split('$')[1]) === 0) {
			throw new Error("There are no items in the cart")
		}
		if (parseInt(text.split('$')[1]) > config.price_limit) {
			logger.error("Price exceeds limit, removing from cart")
			var button = await page.$$('button.btn.btn-mini')
			while (true) {
				try {
					await button[1].click()
				} catch (err) {
					break
				}
			}
			if (config.over_price_limit_behavior === "stop") {
				logger.error("Over Price Limit Behavior is 'stop'. Ending Newegg Shopping Bot process")
				process.exit(0);
			} else {
				return false
			}
		}
		logger.info("Item added to cart, attempting to purchase")
		return true
	} catch (err) {
		logger.error(err.message)
		var nextCheckInSeconds = config.refresh_time + Math.floor(Math.random() * Math.floor(randomizedWaitCeiling))
		logger.info(`The next attempt will be performed in ${nextCheckInSeconds} seconds`)
		await page.waitForTimeout(nextCheckInSeconds * 1000)
		return false
	}
}


async function run() {
	logger.info("Newegg Shopping Bot Started")
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1920, height: 1080 },
		executablePath: config.browser_executable_path
	})
	const page = await browser.newPage()
	await page.setCacheEnabled(false)
	while (true) {
		await page.goto('https://secure.newegg.com/NewMyAccount/AccountLogin.aspx', { waitUntil: 'networkidle0' })
		if (page.url().includes('signin')) {
			await page.waitForSelector('button.btn.btn-orange')
			await page.type('#labeled-input-signEmail', config.email)
			await page.click('button.btn.btn-orange')
			await page.waitForTimeout(1500)
			try {
				await page.waitForSelector('#labeled-input-signEmail', { timeout: 500 })
			} catch (err) {
				try {
					await page.waitForSelector('#labeled-input-password', { timeout: 2500 })
					await page.waitForSelector('button.btn.btn-orange')
					await page.type('#labeled-input-password', config.password)
					await page.click('button.btn.btn-orange')
					await page.waitForTimeout(1500)
					try {
						await page.waitForSelector('#labeled-input-password', { timeout: 500 })
					} catch (passwordSelectorErr) {
						break
					}
				} catch (passwordInputErr) {
					logger.warn("Manual authorization code required by Newegg.  This should only happen once.")
					while (page.url().includes('signin')) {
						await page.waitForTimeout(500)
					}
					break
				}
			}
		} else if (page.url().includes("areyouahuman")) {
			await page.waitForTimeout(1000)
		}
	}

	logger.trace("Logged in")
	logger.info("Checking for Item")

	while (true) {
		try {
			await page.goto('https://secure.newegg.com/Shopping/AddtoCart.aspx?Submit=ADD&ItemList=' + config.item_number, { waitUntil: 'networkidle0' })
			if (page.url().includes("cart")) {
				if (await check_cart(page)) {
					break
				}
			} else if (page.url().includes("ShoppingItem")) {
				await page.goto('https://secure.newegg.com/Shopping/ShoppingCart.aspx', { waitUntil: 'load' })
				if (await check_cart(page)) {
					break
				}
			} else if (page.url().includes("areyouahuman")) {
				await page.waitForTimeout(1000)
			}
		} catch (err) {
			continue
		}
	}

	// Find the "Secure Checkout" button and click it (if it exists)
	try {
		const [button] = await page.$x("//button[contains(., 'Secure Checkout')]")
		if (button) {
			logger.info("Starting Secure Checkout")
			await button.click()
		}
	} catch (err) {
		logger.error("Cannot find the Secure Checkout button")
		logger.error(err)
	}

	// Wait for the page
	await page.waitForTimeout(5000)
	try {
		await page.waitForSelector("#btnCreditCard", { timeout: 3000 })
		await inputCVV(page)
		await submitOrder(page)
	} catch (err) {
		logger.error("Cannot find the Place Order button.")
		logger.warn("Please make sure that your Newegg account defaults for: shipping address, billing address, and payment method have been set.")
	}

}

/**
 * Input the Credit Verification Value (CVV)
 * @param {*} page The page containing the element
 */
async function inputCVV(page) {
	while (true) {
		logger.info("Waiting for CVV input element")
		try {
			await page.waitForSelector("[placeholder='CVV2']", { timeout: 3000 })
			await page.focus("[placeholder='CVV2']", { timeout: 5000 })
			await page.type("[placeholder='CVV2']", config.cv2)
			logger.info("CVV data inputted")
			break
		} catch (err) {
			logger.warn("Cannot find CVV input element")
		}
	}
}

/**
 * Submit the order
 * @param {*} page The page containing the order form
 */
async function submitOrder(page) {

	if (config.auto_submit) {
		await page.click('#btnCreditCard')
		logger.info("Completed purchase")
	} else {
		logger.warn("Order not submitted because 'auto_submit' is not enabled")
	}
}


run()
