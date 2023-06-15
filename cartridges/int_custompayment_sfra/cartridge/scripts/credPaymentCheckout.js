/* eslint-disable  no-undef */
/* eslint-disable  no-param-reassign */
'use strict';

/**
 * Build Payment request for cred payment
 * @param {dw.order.Order} order - order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @returns {Object} an object that has payment request information
 */
function getPaymentRequest(order, paymentInstrument) {
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var Site = require('dw/system/Site');
    var lenderId = Site.current.getCustomPreferenceValue('jifitilenderId');
    var merchantId = Site.current.getCustomPreferenceValue('jifitimerchantId');
    var storeId = Site.current.getCustomPreferenceValue('jifitistoreId');
    var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
    var ArrayList = require('dw/util/ArrayList');
    var URLUtils = require('dw/web/URLUtils');
    var paymentReq = {};
    var ammount = paymentInstrument.paymentTransaction.amount.value;
    var currencyCode = order.getCurrencyCode();
    var orderNo = order.getOrderNo();
    var token = UUIDUtils.createUUID();
    Transaction.wrap(function () {
        order.custom.orderToken = token;
    });
    var parameters = {};
    parameters.orderID = orderNo;
    parameters.token = token;
    parameters.orderToken = order.getOrderToken();
    var callBackURL = urlHelper.appendQueryParams(URLUtils.http(Site.current.getCustomPreferenceValue('jifiticallBackURL')).toString(), parameters);
    var notificationAPIURL = urlHelper.appendQueryParams(Site.current.getCustomPreferenceValue('jifitiNotificationAPIURL'), parameters);
    var customerEmail = order.getCustomerEmail();
    var customerdetail = {};
    var billingAddressDetail = {};
    var shippingAddressDetail = {};
    var billingAddress = order.billingAddress;
    var shippingAddress = order.defaultShipment.shippingAddress;
    if (customer.authenticated && customer.registered) {
        customerdetail.FirstName = customer.profile.firstName;
        customerdetail.LastName = customer.profile.lastName;
        customerdetail.Email = customer.profile.email;
        customerdetail.MobilePhoneNumber = customer.profile.phoneHome;
        customerdetail.DateOfBirth = customer.profile.birthday;
        customerdetail.CustomerGovernmentId = '';
        customerdetail.Last4SSN = null;
    } else {
        customerdetail.FirstName = billingAddress.firstName ? billingAddress.firstName : '';
        customerdetail.LastName = billingAddress.lastName ? billingAddress.lastName : '';
        customerdetail.Email = customerEmail;
        customerdetail.MobilePhoneNumber = billingAddress.phone ? billingAddress.phone : '';
        customerdetail.DateOfBirth = null;
        customerdetail.CustomerGovernmentId = '';
        customerdetail.Last4SSN = null;
    }
    paymentReq.LenderId = lenderId;
    paymentReq.MerchantId = merchantId;
    paymentReq.StoreId = storeId;
    paymentReq.Customer = customerdetail;
    if (billingAddress) {
        billingAddressDetail.AddressLine1 = billingAddress.address1 ? billingAddress.address1 : '';
        billingAddressDetail.AddressLine2 = billingAddress.address2 ? billingAddress.address2 : '';
        billingAddressDetail.City = billingAddress.city ? billingAddress.city : '';
        billingAddressDetail.State = billingAddress.stateCode ? billingAddress.stateCode : '';
        billingAddressDetail.PostalCode = billingAddress.postalCode ? billingAddress.postalCode : '';
        billingAddressDetail.Country = billingAddress.countryCode ? billingAddress.countryCode.value.toUpperCase() : '';
    }
    if (shippingAddress) {
        shippingAddressDetail.AddressLine1 = shippingAddress.address1 ? billingAddress.address1 : '';
        shippingAddressDetail.AddressLine2 = shippingAddress.address2 ? billingAddress.address2 : '';
        shippingAddressDetail.City = shippingAddress.city ? billingAddress.city : '';
        shippingAddressDetail.State = shippingAddress.stateCode ? billingAddress.stateCode : '';
        shippingAddressDetail.PostalCode = shippingAddress.postalCode ? billingAddress.postalCode : '';
        shippingAddressDetail.Country = shippingAddress.countryCode ? billingAddress.countryCode.value.toUpperCase() : '';
    }
    paymentReq.BillingAddress = billingAddressDetail;
    paymentReq.ShippingAddress = shippingAddressDetail;
    // Loyalty information
    /* Commenting out Loyalty information as requested on JIRA EC-62.
    var customerLoyaltyDetail = {};
    customerLoyaltyDetail.LoyaltyNumber = customer.authenticated && customer.registered ? customer.profile.customerNo : '';
    customerLoyaltyDetail.LoyaltyStartDate = '';
    customerLoyaltyDetail.LoyaltyType = '';
    customerLoyaltyDetail.LoyaltyClassification = '';
    if ((customer.authenticated && customer.registered)) {
        paymentReq.CustomerLoyalty = customerLoyaltyDetail;
    }*/

    paymentReq.RequestedAmount = ammount;
    paymentReq.Currency = currencyCode;
    paymentReq.SourcePageType = Site.current.getCustomPreferenceValue('jifitisourcePageType').value;
    paymentReq.CallbackURL = callBackURL;
    paymentReq.NotificationAPIURL = notificationAPIURL;
    var productTypesValues = Site.current.getCustomPreferenceValue('jifitiproductTypes');
    var productTypesList = new ArrayList(productTypesValues);
    var productTypes = productTypesList.toArray();
    paymentReq.AllowedProductTypes = productTypes;
    paymentReq.ClientCustomData1 = '';
    paymentReq.ClientCustomData2 = '';
    var itemsDetails = [];
    var fees = 0;
    for (var i = 0; i < order.allProductLineItems.length; i++) {
        fees = 0;
        var productLineItem = order.allProductLineItems[i];
        if (!(productLineItem.bundledProductLineItem)) {
            var productDetail = {};
            productDetail.Name = productLineItem.productName;
            productDetail.SKU = productLineItem.productID;
            var productShippingLintItem = productLineItem.getShippingLineItem();
            if (productShippingLintItem !== null) {
                fees = productShippingLintItem ? productShippingLintItem.adjustedGrossPrice.value : 0.0;
            }
            var product = productLineItem.getProduct();
            var image = product ? product.getImage('small').getAbsURL().toString() : null;
            productDetail.Quantity = productLineItem.quantity.value;
            productDetail.Price = productLineItem.adjustedNetPrice.value;
            productDetail.Currency = order.currencyCode;
            productDetail.ImageURL = image;
            productDetail.Eligible = 'true';
            productDetail.OfferCategory = '';
            productDetail.SalesTax = productLineItem.adjustedTax.value;
            productDetail.Fees = fees;
            productDetail.TotalCost = productLineItem.adjustedGrossPrice.value + fees;
            itemsDetails.push(productDetail);
        }
    }
    var allShipments = order.getShipments();
    for (var p = 0; p < allShipments.length; p++) {
        for (var ind = 0; ind < allShipments[p].shippingLineItems.length; ind++) {
            var shippingDetail = {};
            var shipmentLineItem = allShipments[p].shippingLineItems[ind];
            shippingDetail.Name = shipmentLineItem.lineItemText;
            shippingDetail.SKU = shipmentLineItem.ID;
            shippingDetail.Quantity = 1;
            shippingDetail.Price = shipmentLineItem.adjustedNetPrice.value;
            shippingDetail.Currency = shipmentLineItem.grossPrice.currencyCode;
            shippingDetail.ImageURL = '';
            shippingDetail.Eligible = 'true';
            shippingDetail.OfferCategory = '';
            shippingDetail.SalesTax = shipmentLineItem.adjustedTax.value;
            shippingDetail.Fees = 0.0;
            shippingDetail.TotalCost = shipmentLineItem.adjustedGrossPrice.value;
            itemsDetails.push(shippingDetail);
        }
    }
    var orderPriceAdjustments = order.getPriceAdjustments();
    var index = 0;
    for (index = 0; index < orderPriceAdjustments.length; index++) {
        var priceAdjustDetail = {};
        var priceAdjust = orderPriceAdjustments[index];
        priceAdjustDetail.Name = 'Order Adjustment ' + priceAdjust.promotionID;
        priceAdjustDetail.SKU = priceAdjust.promotionID;
        priceAdjustDetail.Quantity = priceAdjust.quantity;
        priceAdjustDetail.Price = priceAdjust.netPrice.value;
        priceAdjustDetail.Currency = order.currencyCode;
        priceAdjustDetail.ImageURL = '';
        priceAdjustDetail.Eligible = 'true';
        priceAdjustDetail.OfferCategory = '';
        priceAdjustDetail.SalesTax = priceAdjust.tax.value;
        priceAdjustDetail.Fees = 0.0;
        priceAdjustDetail.TotalCost = priceAdjust.grossPrice.value;
        itemsDetails.push(priceAdjustDetail);
    }
    paymentReq.Items = itemsDetails;
    paymentReq.SourceChannel = Site.current.getCustomPreferenceValue('jifitiSourceChannel').value;
    paymentReq.CompletionMethod = Site.current.getCustomPreferenceValue('jifitiCompletionMethod').value;
    paymentReq.WindowBehavior = Site.current.getCustomPreferenceValue('jifitiwindowBehavior').value;
    paymentReq.OrderId = orderNo;

    return paymentReq;
}

module.exports = {
    getPaymentRequest: getPaymentRequest
};
