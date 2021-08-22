var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
describe('CredPaymentController-HandleCloseIframe', function () {
    this.timeout(15000);

    var cookieJar = request.jar();
    var {user, pass} = config.storefrontAuth;

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
        },
        form: {
            orderNo: 'TESTING_ORDER'
        }
    };

    it('Checkout-Begin', function () {
        myRequest.url = config.baseUrl + '/CredPaymentController-HandleCloseIframe';
        myRequest.method = 'POST';

        return request(myRequest)
            .then(function (basketResponse) {
                assert.equal(basketResponse.statusCode, 200, 'StatusCode to be 200.');
            });
    });
});
