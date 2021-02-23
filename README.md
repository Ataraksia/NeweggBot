# NeweggBot
Autonomously buy products from Newegg as soon as they become available

This bot is very much still in the early stages, and more than a little rough around the edges.  Expect the occasional hiccups if you decide to use it.

## Installation
You will require [Node.js 14](https://nodejs.org/en/) to run this.
After installing via git or by downloading the code and extracting it, navigate to the folder where the files are located via powershell(or equivalent console) and run `npm install` command.  If you end up experiencing the error `Error: Could not find browser revision latest` when running, you may also need to run the command `PUPPETEER-PRODUCT=firefox npm i puppeteer`.


## Configuration
Once that is finished, create a copy of config_template.json and name it config.json. Inside you will find the very basic customization options.  
- `cv2` refers to the three digit code on the back of your credit card.  
- `skip_TFA` refers to whether email 2FA should be skipped by waiting a set amount of time. Failsafe in case of 2FA coming up unexpectedly
- `do_first_TFA` refers to whether the first email 2FA should be skipped or not. I'd recommend inputting the first 2FA as it will be stored in the cookies/localStorage of the browser and not need to be asked again.
- `TFA_base_wait` refers to the base time to wait when skipping an email 2FA.
- `TFA_wait_add` refers to the amount of time to add to the 2FA wait time after a failed wait attempt.
- `TFA_wait_cap` refers to the max wait time for skipping a 2FA.
- `wishlist` refers to Newegg's wishlist number found at the end of the wishlist page URL. For example, the item number for 'https://secure.newegg.com/wishlist/md/12341234' is 12341234. This bot can attempt to buy multiple items at once if multiple items in the wishlist are in stock. Be cautious with as there are no checks in place to ensure that only one item of a certain type is purchased, so if by chance two cards you're attempting to purchase come in stock at the same time, the bot would attempt to purchase both.
- `auto_submit` refers to whether or not you want the bot to complete the checkout process. Setting it to 'true' will result in the bot completing the purchase, while 'false' will result in it completing all the steps up to but not including finalizing the purchase. It is mostly intended as a means to test that the bot is working without actually having it buy something. Note: nothing in place for confirmation in a headless session. Meaning the bot will stay at the last step without a way for you to confirm an order. If this is on, highly recommended to do a non-headless session.
- `price_limit` refers to the maximum cart subtotal price that the bot will allow.
- `over_price_limit_behavior` refers to the desired behavior for cases in which the subtotal price exceeds the specified `price_limit`. *"stop"* will instruct the bot to stop the process when the cart is over the limit allowing you to remove which items you want and continue through the checkout manually (note: wont work in headless session, no console UI for showing all items in cart, removing items, or confirming if you wish to continue). *"remove"* will remove items starting from the last entry of the cart until the subtotal price is under or equal to the limit.
- `multi_step_order` refers to whether you have the extra step "review your order" before being able to place the order. I believe this is location based but have no confirmations on it. So far from my limited understanding, US will be false and CAN will be true.
- `refresh_time` refers to the duration to wait in seconds between add-to-cart attempts. This should be specified as a number, rather than a string.
- `randomized_wait_ceiling` This value will set the ceiling on the random number of seconds to be added to the `refresh_time`. While not guaranteed, this should help to prevent - or at least delay - IP bans based on consistent traffic/timing. This should be specified as a number, rather than a string.
- `site_domain` refers to which site domain you want the bot to use ('ca' or 'com', potentially others aswell).
- `headless` refers to whether you want the bot to run a headless browser session. Meaning, whether the browser itself will be visible or not. However, with very minor testing this will incur the email 2FA multiple times due to NE seeing it as an untrsuted browser (probably from bot detection).
- `browser_executable_path` This will set the path to the browser to be used by the bot. Depending on the browser selected, you *may* need to install additional packages.

## Usage
After installation and configuration, the bot can then be run by using either `node neweggbot.js` or the `npm start` script. 

It is important if you've never used your Newegg account before that you setup your account with a valid address and payment information, and then run through the checkout process manually making any changes to shipping and payment as Newegg requests.  You don't need to complete that purchase, just correct things so that when you click `Secure Checkout` from the cart, it brings you to `Review`, not `Shipping` or `Payment`.

At the moment, in the event that a card comes in stock, but goes out of stock before the bot has been able to complete the purchase, it will likely break, and you will need to restart it.  In general, there are very likely to be occasional issues that break the bot and require you to restart it.