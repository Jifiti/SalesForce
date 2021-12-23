'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var customPreferences = Site.current.preferences.custom;

base.jifitiMerchantId = 'jifitimerchantId' in customPreferences ? customPreferences.jifitimerchantId : '';
base.isJifitiEnabled = 'isJifitiEnabled' in customPreferences ? customPreferences.isJifitiEnabled : false;
base.jifitiWidgetLibraryURL = 'jifitiWidgetLibraryURL' in customPreferences ? customPreferences.jifitiWidgetLibraryURL : '';
base.enableCertInPDP = 'enableCertInPDP' in customPreferences ? customPreferences.enableCertInPDP : false;
base.enableCertInPLP = 'enableCertInPLP' in customPreferences ? customPreferences.enableCertInPLP : false;
base.enableCertInCart = 'enableCertInCart' in customPreferences ? customPreferences.enableCertInCart : false;

module.exports = base;
