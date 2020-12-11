# NeweggBot
Autonomously buy products from Newegg as soon as they become available

This bot is very much still in the early stages, and more than a little rough around the edges.  Expect the occasional hiccups if you decide to use it.

## Installation
You will require [Node.js 14](https://nodejs.org/en/) to run this.
After installing via git or by downloading the code and extracting it, navigate to the folder where the files are located via powershell(or equivalent console) and run `npm install` command.  If you end up experiencing the error `Error: Could not find browser revision latest` when running, you may also need to run the command `PUPPETEER-PRODUCT=firefox npm i puppeteer`.


## Configuration
Once that is finished, create a copy of config_template.json and name it config.json.  Inside you will find the very basic customization options.  
- `cv2` refers to the three digit code on the back of your credit card.  
- `refresh_time` refers to the duration to wait in seconds between add-to-cart attempts. This should be specified as a number, rather than a string.
- `item_number` refers to Newegg's item number found at the end of the card page URL.  For example, the item number for 'https://www.newegg.com/evga-geforce-rtx-3080-10g-p5-3897-kr/p/N82E16814487518' is N82E16814487518.  This bot can attempt to buy multiple card models at once by including multiple item numbers separated by a comma.  For example, 'N82E16814487518,N82E16814137598'.  Be cautious with this however, as there are no checks in place to ensure that only one card is purchased, so if by chance two cards you're attempting to purchase come in stock at the same time, the bot would attempt to purchase both.    
- `auto_submit` refers to whether or not you want the bot to complete the checkout process.  Setting it to 'true' will result in the bot completing the purchase, while 'false' will result in it completing all the steps up to but not including finalizing the purchase.  It is mostly intended as a means to test that the bot is working without actually having it buy something.
- `price_limit` refers to the maximum price that the bot will attempt to purchase a card for.  It is based on the combined subtotal of your cart. 
- `over_price_limit_behavior` Defines the behavior for cases in which the cart total exceeds the specified `price_limit`. Currently, the only valid value is *"stop"*. This will instruct the bot to end the process when the cart is over the limit. The option was added as a string, as opposed to a boolean, to allow some flexibility for  other potential actions. 
- `randomized_wait_ceiling` This value will set the ceiling on the random number of seconds to be added to the **refresh_time**. While not guaranteed, this should help to prevent - or at least delay - IP bans based on consistent traffic/timing. This should be specified as a number, rather than a string.
- `browser_executable_path` This will set the path to the browser to be used by the bot. Depending on the browser selected, you *may* need to install additional packages.

## Usage
After installation and configuration, the bot can then be run by using either `node neweggbot.js` or the `npm start` script. 

It is important if you've never used your Newegg account before that you setup your account with a valid address and payment information, and then run through the checkout process manually making any changes to shipping and payment as Newegg requests.  You don't need to complete that purchase, just correct things so that when you click `Secure Checkout` from the cart, it brings you to `Review`, not `Shipping` or `Payment`.

At the moment, in the event that a card comes in stock, but goes out of stock before the bot has been able to complete the purchase, it will likely break, and you will need to restart it.  In general, there are very likely to be occasional issues that break the bot and require you to restart it.

