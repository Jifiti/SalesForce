var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
describe('CheckoutServices-PlaceOrder', function () {
    this.timeout(15000);
    var {user, pass} = config.storefrontAuth;

    var cookieJar = request.jar();
    before(function () {
        var qty1 = 1;
        var variantPid1 = '013742000443M';
        var cookieString;

        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            auth: {
                user,
                pass
            }
        };
        myRequest.url = config.baseUrl + '/Cart-AddProduct';
        myRequest.form = {
            pid: variantPid1,
            quantity: qty1
        };

        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                cookieString = cookieJar.getCookieString(myRequest.url);
            })
            .then(function () {
                cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
            });
    });

    var myRequest = {
        url: '',
        method: '',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        auth: {
            user,
            pass
        }
    };
    it('CheckoutServices-PlaceOrder', function () {
        myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder';
        myRequest.method = 'POST';

        return request(myRequest)
            .then(function (basketResponse) {
                // Step2: Process Checkout
                assert.equal(basketResponse.statusCode, 200, 'StatusCode to be 200.');
            });
    });
});