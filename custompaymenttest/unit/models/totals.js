'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var mockSuperModule = require('../config/mockModuleSuperModule');
var baseTotalModelMock = function () {};

var lineItemContainer = {
    totalGrossPrice: {
        value: 99
    },
    getTotalGrossPrice: function () {
        return 100;
    }
};

describe('int_custompayment_sfra/cartridge/models/totals.js', () => {

    before(function () {
        mockSuperModule.create(baseTotalModelMock);
    });

    it('Testing totals --> lineItemContainer not null', () => {
        var TotalModel = proxyquire('../../../cartridges/int_custompayment_sfra/cartridge/models/totals.js', {});
        var total = new TotalModel(lineItemContainer);
        assert.isDefined(total.grandTotalValue, 'grandTotalValue should be defined');
    });

    it('Testing totals --> lineItemContainer is null', () => {
        var TotalModel = proxyquire('../../../cartridges/int_custompayment_sfra/cartridge/models/totals.js', {});
        var total = new TotalModel(null);
        assert.isDefined(total.grandTotalValue, 'grandTotalValue should be defined');
        assert.equal(total.grandTotalValue, 0)
    });

});
