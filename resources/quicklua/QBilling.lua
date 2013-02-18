--[[/*
 * (C) 2012-2013 Marmalade.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */--]]

--[[

/**
 Global unified in-app purchasing API that supports the following platforms:
 - Android
 - BlackBerry
 - iOS

 Function descriptions:
 - billing:isAvailable() - Returns true if billing is available, otherwise false
 - billing:init() - Initialises the billing system, returns true on success
 - billing:terminate() - Terminates the billing system
 - billing:queryProduct(productId) - Queries billing for information for the product specified by product id
 - billing:purchaseProduct(productId) - Starts the purchase of the product specified by product id
 - billing:finishTransaction(data) - Finishes / finalises a transaction
 - billing:restoreTransactions() - Restores previously purchased products
 - billing:setTestMode(enable) - Sets test or live mode

 Depending upon the platform a product id is defined as:
 - iOS - The Product ID as defined in the in-app purchases section of the app on Apple iTunes Connect, e.g. com.companyname.appname.itemname
 - Android - The in-app Product ID as defined in the in-app purchases section of the app on Google Play's developer console, e.g. com.companyname.appname.itemname
 - BlackBerry - The Product SKU as defined in the virtual goods section of the app on the BlackBerrys developer portal, e.g. appname_itemname

 Billing errors descriptions:
 - BILLING_ERROR_CLIENT_INVALID			- The client is invalid
 - BILLING_ERROR_PAYMENT_CANCELLED		- Payment was cancelled
 - BILLING_ERROR_PAYMENT_INVALID		- Payment request is invalid
 - BILLING_ERROR_PAYMENT_NOT_ALLOWED	- Payment is prohibited by the device
 - BILLING_ERROR_PURCHASE_UNKNOWN		- Purchase failed for unknown reason
 - BILLING_ERROR_PURCHASE_DISABLED		- Purchasing is disabled
 - BILLING_ERROR_NO_CONNECTION			- No connection to store available
 - BILLING_ERROR_RESTORE_FAILED			- Product restore failed
 - BILLING_ERROR_UNKNOWN_PRODUCT		- Product was not found in the store
 - BILLING_ERROR_DEVELOPER_ERROR		- The application making the request is not properly signed
 - BILLING_ERROR_UNAVAILABLE			- The billing extension is not available
 - BILLING_ERROR_FAILED					- General failure
 - BILLING_ERROR_UNKNOWN_ERROR			- An unknown error has occurred

 Product refunds:
 The API does not directly force a product refund, however should one occur the refundAvailable event will be raised. The refundAvailable 
 event table is defined as follows:
 - productId			- Product identifier
 - finaliseData			- Data used to finalise the transaction

 Note that finishTransaction() should be called to inform the store that the refund was completed.

 Refunds are only supported by the Android platform.

 Android Public Key:
 For the Android platform you must set your public key in the app.icf file as shown below:
 
 [BILLING]
 androidPublicKey1="Part of Android public key"
 androidPublicKey2="Part of Android public key"
 androidPublicKey3="Part of Android public key"
 androidPublicKey4="Part of Android public key"
 androidPublicKey5="Part of Android public key"

 Note that the key is split across up to 5 settings, each setting can carry a max of 127 characters. The complete key will be a concatenation 
 of all 5 settings.

*/

--]]

billing = {}

--[[
/**
@brief Checks available of in-app purchasing.

@return True if the app store system is available, false otherwise.
*/
--]]
function billing:isAvailable()
	return quick.QBilling:isAvailable()
end

--[[
/**
@brief Initialises the billing system.

@return True if billing was initialised, false otherwise.
*/
--]]
function billing:init()
	return quick.QBilling:init()
end

--[[
/**
@brief Terminates the billing system.

*/
--]]
function billing:terminate()
	quick.QBilling:terminate()
end

--[[
/**
@brief Queries product information.

Queries billing for information for the supplied product. 
Please note the following platform restrictions:
- Android - Product query is not available
- BlackBerry - Only product price details are available

When the product information becomes available the infoAvailable event will be raised providing information about the product. 
The infoAvailable event table is defined as follows:
- productId				- Product identifier
- title					- The title of the product
- description			- The localised description of the product
- price					- The localised price of the product

If an error occurs then the billingError event will be raised providing information about the error that occurred. The billingError 
event table is defined as follows:
- productId				- Product identifier
- error					- The error that occurred

@param productId The product id of the product to query.

@return true if a successful query request was created, false otherwise.
*/
--]]
function billing:queryProduct(productId)
	return quick.QBilling:queryProduct(productId)
end

--[[
/**
@brief Purchases a product.

Upon successfull purchase the receiptAvailable event will be raised providing access to product information. The receiptAvailable 
event table is defined as follows:
- productId				- Product identifier
- transactionId			- Transaction identifier
- date					- Date of purchase
- receipt				- Transaction receipt
- finaliseData			- Data used to finalise the transaction
- restored				- true if item was restored, false if item was purchased

If an error occurs then the billingError event will be raised providing information about the error that occurred. The billingError 
event table is defined as follows:
- productId				- Product identifier
- error					- The error that occurred

@param productId The product id of the product to start purchasing.

@return true if a successful product purchase request was created, false otherwise.
*/
--]]
function billing:purchaseProduct(productId)
	return quick.QBilling:purchaseProduct(productId)
end

--[[
/**
@brief Restores previous purchased products. Supported only on the iOS platform.

For each product that is restored the receiptAvailable event will be raised providing access to product information. The receiptAvailable 
event table is defined as follows:
- productId				- Product identifier
- transactionId			- Transaction identifier
- date					- Date of purchase
- receipt				- Transaction receipt
- finaliseData			- Data used to finalise the transaction
- restored				- true if item was restored, false if item was purchased

If an error occurs then the billingError event will be raised providing information about the error that occurred. The billingError 
event table is defined as follows:
- productId				- Product identifier
- error					- The error that occurred

@return true if a successful product restore request was created, false otherwise.
*/
--]]
function billing:restoreTransactions()
	return quick.QBilling:restoreTransactions()
end

--[[
/**
@brief Finishes / finalises a transaction. 

When a purchase request is made it is not finalised until this function is called. This gives the developer the opportunity to validate 
the transaction / download content before notifying the store that the purchase was successfully completed. If the app exits before the 
purchase has been finished, the system will inform the app of the purchase again in the future. Not required for the BlackBerry platform.

@return true if product was finalised, false otherwise.
*/
--]]
function billing:finishTransaction(data)
	return quick.QBilling:finishTransaction(data)
end

--[[
/**
Converts an error number to an error string.

@return Error string.
*/
function billing:getErrorString(error)
	return quick.QBilling:getErrorString(error)
end
--]]

--[[
/**
@brief Specifies live or test mode (BlackBerry only). 

Test mode will allow the return of test responses, whilst live mode will carry out valid in-app purchases.

@param	enable	True to set test mode, otherwise live mode is set.

*/
--]]
function billing:setTestMode(enable)
	return quick.QBilling:setTestMode(enable)
end

