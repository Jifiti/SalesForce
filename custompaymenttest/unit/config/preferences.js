'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('./mockModuleSuperModule');
var preferences;
var Base = function () {}
describe('int_custompayment_sfra/cartridge/config/preferences.js', () => {

    before(() => {
        mockSuperModule.create(Base);

        preferences = proxyquire('../../../cartridges/int_custompayment_sfra/cartridge/config/preferences.js', {
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {}
                    }
                }
            },
            'dw/system/System': {
                getInstanceType: function () {
                    return 'PRODUCTION_SYSTEM'
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return "error";
                }
            },
        });
    });

    it('Testing config preferences properties', () => {
        assert.equal(preferences.bnplIsEnabled, false);
    });
});
