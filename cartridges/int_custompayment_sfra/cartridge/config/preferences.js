/* eslint-disable  consistent-return */
/* eslint-disable  wrap-iife */
'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var customPreferences = Site.current.preferences.custom;

base.bnplIsEnabled = 'bnplIsEnabled' in customPreferences ? customPreferences.bnplIsEnabled : false;
base.bnplAuthToken = 'bnplAuthToken' in customPreferences ? customPreferences.bnplAuthToken : false;
base.bnplWidgetLibraryURL = (function () {
    var System = require('dw/system/System');
    var Logger = require('dw/system/Logger');

    try {
        var instance = 'https://toolbox-uat.jifiti.com/Widgets/1.0.4/jifiti-widget.min.js';
        switch (System.getInstanceType()) {
            case System.PRODUCTION_SYSTEM:
                instance = 'https://toolbox.jifiti.com/Widgets/1.0.4/jifiti-widget.min.js';
                break;
            case System.STAGING_SYSTEM:
                instance = 'https://toolbox-uat.jifiti.com/Widgets/1.0.4/jifiti-widget.min.js';
                break;
            default:
                break;
        }

        return instance;
    } catch (exp) {
        Logger.error('Could not get bnplWidgetLibraryURL' + exp);
    }
})();
base.bnplEnableInPDP = 'bnplEnableInPDP' in customPreferences ? customPreferences.bnplEnableInPDP : false;
base.bnplEnableInPLP = 'bnplEnableInPLP' in customPreferences ? customPreferences.bnplEnableInPLP : false;
base.bnplEnableInCart = 'bnplEnableInCart' in customPreferences ? customPreferences.bnplEnableInCart : false;

base.bnplContainerStyle = 'bnplContainerStyle' in customPreferences ? customPreferences.bnplContainerStyle : '{}';
base.bnplText = 'bnplText' in customPreferences ? customPreferences.bnplText : '';
base.bnplTextStyle = 'bnplTextStyle' in customPreferences ? customPreferences.bnplTextStyle : '{}';
base.bnplLinkText = 'bnplLinkText' in customPreferences ? customPreferences.bnplLinkText : '';
base.bnplLinkStyle = 'bnplLinkStyle' in customPreferences ? customPreferences.bnplLinkStyle : '{}';

base.bnplLinkBehaviour = 'bnplLinkBehaviour' in customPreferences ? customPreferences.bnplLinkBehaviour.value : 0;
base.bnplLinkHref = 'bnplLinkHref' in customPreferences ? customPreferences.bnplLinkHref : '';
base.bnplCurrencySymbol = 'bnplCurrencySymbol' in customPreferences ? customPreferences.bnplCurrencySymbol : '';

base.bnplOfferCategory = 'bnplOfferCategory' in customPreferences ? customPreferences.bnplOfferCategory : '';
base.bnplTemplateName = 'bnplTemplateName' in customPreferences ? customPreferences.bnplTemplateName.value : '';
base.bnplFlow = 'bnplFlow' in customPreferences ? customPreferences.bnplFlow.value : '';

module.exports = base;
