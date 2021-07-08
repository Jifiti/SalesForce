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
    var lenderId = Site.current.getCustomPreferenceValue('lenderId');
    var merchantId = Site.current.getCustomPreferenceValue('merchantId');
    var storeId = Site.current.getCustomPreferenceValue('storeId');
    var paymentReq = {};
    var ammount = paymentInstrument.paymentTransaction.amount.value;
    var currencyCode = order.getCurrencyCode();
    var orderNo = order.getOrderNo();
    var token = UUIDUtils.createUUID();
    Transaction.wrap(function () {
        order.custom.token = token;
    });
    var callBackURL = Site.current.getCustomPreferenceValue('callBackURL') + orderNo + '&&token=' + token;
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
        customerdetail.DateOfBirth = null;
        customerdetail.CustomerGovernmentId = '123456789';
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
    var customerLoyaltyDetail = {};
    customerLoyaltyDetail.LoyaltyNumber = customer.authenticated && customer.registered ? customer.profile.customerNo : '';
    customerLoyaltyDetail.LoyaltyStartDate = '';
    customerLoyaltyDetail.LoyaltyType = '';
    customerLoyaltyDetail.LoyaltyClassification = '';
    if ((customer.authenticated && customer.registered)) {
        paymentReq.CustomerLoyalty = customerLoyaltyDetail;
    }

    paymentReq.RequestedAmount = ammount;
    paymentReq.Currency = currencyCode;
    paymentReq.SourcePageType = Site.current.getCustomPreferenceValue('sourcePageType').value;
    paymentReq.CallbackURL = callBackURL;
    paymentReq.NotificationAPIURL = '';
    var productTypes1 = Site.current.getCustomPreferenceValue('productTypes');
    var productTypesList = new dw.util.ArrayList(productTypes1);
    var productTypes = productTypesList.toArray();
    paymentReq.AllowedProductTypes = productTypes;
    paymentReq.ClientCustomData1 = '';
    paymentReq.ClientCustomData2 = '';
    var itemsDetails = [];
    for (var i = 0; i < order.allProductLineItems.length; i++) {
        var productDetail = {};
        productDetail.Name = order.allProductLineItems[i].productName;
        productDetail.SKU = order.allProductLineItems[i].productID;
        productDetail.Quantity = order.allProductLineItems[i].quantity.value;
        productDetail.Price = order.allProductLineItems[i].price.value;
        productDetail.Currency = order.allProductLineItems[i].grossPrice.currencyCode;
        productDetail.ImageURL = '';
        productDetail.Eligible = 'true';
        productDetail.OfferCategory = '';
        productDetail.SalesTax = order.allProductLineItems[i].adjustedTax.value;
        productDetail.Fees = 0.0;
        productDetail.TotalCost = order.allProductLineItems[i].grossPrice.value;
        itemsDetails.push(productDetail);
    }
    paymentReq.Items = itemsDetails;
    paymentReq.SourceChannel = Site.current.getCustomPreferenceValue('SourceChannel').value;
    paymentReq.CompletionMethod = Site.current.getCustomPreferenceValue('CompletionMethod').value;
    paymentReq.WindowBehavior = Site.current.getCustomPreferenceValue('windowBehavior').value;
    paymentReq.OrderId = orderNo;

    return paymentReq;
}

module.exports = {
    getPaymentRequest: getPaymentRequest
};
