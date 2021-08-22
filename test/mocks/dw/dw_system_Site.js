'use strict';
// Helper Functions

// Used to map Value with DisplayValue
function SetOfString(value, displayValue) {
    return {
        value: value,
        displayValue: displayValue,
        getValue: () => {
            return value;
        },
        getDisplayValue: () => {
            return displayValue;
        }
    };
}

// Site Preferences Map
function PrefObject(value) {
    this.value = {
        text: value,
        equals: function (input) {
            return this.text.toLocaleLowerCase() === input.toLocaleLowerCase();
        }
    };
}

class Site {
    constructor() {
        this.preferenceMap = {
            countryCode: new SetOfString('US', 'USA'),
            allowedLocales: [{
                id: 'en_US',
                currencyCode: 'USD'
            }, {
                id: 'fr_CA',
                currencyCode: 'CAD'
            }, {
                id: 'en_CA',
                currencyCode: 'CAD'
            }],
            QAS_EnableAddressVerification: true,
            testString: 'test',
            testJson: '{"test": 1}',
            testStringAll: 'ALL',
            testStringUs: 'US',
            testStringNone: 'none',
            Paymetric_iframeURL: 'test',
            Paymetric_clientPath: 'test',
            sitesListBasic: '[{ "countryCode": "BE", "siteID": "PJG-BE", "locales": ["en_BE"], "currencyCode": "EUR" }, { "countryCode": "DE", "siteID": "PJG-DE", "locales": ["de_DE"], "currencyCode": "EUR" }]',
            sitesListFull: "{\"displayOrder\":[\"North_America\"]}",
            globalAccessCountries: '{CA: {url: "https://staging-ca.sfcc.ua-ecm.com/en-ca/"}, AU: {url: "https://staging.underarmour.com/en-au"}, KR: {url: "http://www.underarmour.co.kr/?cregion=%2Fen-us"}}',
            XSSListOfPatterns: "(<body)|(<iframe)|(.js$)|(javascript)|(<script>)|(<\/script>)|(<script\/>)|(<script)|(script>)|(script\/>)|(cookie)|(<img)|(vbscript)|(msgbox)|(alert())|<.*?>\\gmi|\\(.*?\\) ?\\gmi|(<)|(>)\\gmi",
            replaceableProductID: 'dummy',
            realTimeInventoryCallEnabled: true,
            MaoDomTokenChildOrgUsername: 'salesforce@ua-us.com',
            MaoDomTokenChildOrgPassword: 'Password1!',
            MaoDomSaveOrderEndpointUrl: 'https://uarms.omni.manh.com/order/api/order/order/save',
            maoViewDefinition: '{"ViewDefinitionId": "SFCC US","ViewName": "SFCC US"}',
            maoBOPISViewDefinition: '{"ViewDefinitionId": "BOPIS","ViewName": "BOPIS"}',
            realTimeInventoryCheckPoints: [new PrefObject('CartView'), new PrefObject('AddToCart'), new PrefObject('EditCart'), new PrefObject('StartCheckout'), new PrefObject('PlaceOrder')],
            MaoAvailabilityEndpointUrl: 'https://omni-uarms.omni.manh.com/inventory/api/availability/availabilitydetail',
            MaoAuthTokenEndpointUrl: 'https://uarms-auth.omni.manh.com/oauth/token',
            customerServicePhone: '18887276687',
            MaoBOPISAvailabilityEndpointUrl: 'https://omni-uarms.omni.manh.com/inventory/api/availability/location/availabilitydetail',
            billingCountryList: '{"US": "United States", "CA": "Canada"}',
            uaidmIsEnabled: true,
            uaidmUpdateProfileOnLogin: true,
            uaidmOauthProviderId: 'Under Armour',
            // eslint-disable-next-line spellcheck/spell-checker
            uaidmClientId: 'da7b4379-8281-491a-8816-ac2dc8e24a477',
            // eslint-disable-next-line spellcheck/spell-checker
            uaidmClientSecret: 'hjw3je7sh7xamczqwyjktz5eobh5i4adk5t7pkc6ouxy54bl5joq',
            uaidmJwtSigningKeyId: '32b681ab-96e3-4181-90b6-54f0908c0a2b',
            // eslint-disable-next-line spellcheck/spell-checker
            uaidmJwtSigningKey: 'k_wiqYne_5ZjN2HP2Q8rJgpW8muK964ifLDleyshiTmnOBOFVwSASoIkUEYdnmItp5B4CM4d274V2mQ6CgyzQA',
            uaidmSfccStorefrontPassword: '3131labs',
            uaidmRedirectURI: 'https://development-us.sfcc.ua-ecm.com/on/demandware.store/Sites-US-Site/en_US/Login-OAuthReentry',
            // eslint-disable-next-line spellcheck/spell-checker
            facebookAppID: '194992081310',
            addressVerificationProvider: 'QAS',
            addressProvider: 'FedEx',
            sr_enabled: true,
            eGiftCardAmountMin: 10,
            eGiftCardAmountMax: 2000,
            scheduledDeliveryDateMapping: '{"startDateOffset":30,"endDateOffset":60,"holidays":["01-01","21-04","01-05","07-09","12-10","02-11","15-11","25-12"]}'
        };
        this.preferences = {
            custom: this.preferenceMap
        };
    }

    getCustomPreferenceValue(key) {
        return this.preferenceMap[key];
    }
    setCustomPreferenceValue(key, value) {
        this.preferenceMap[key] = value;
    }
    // Access preferences by key/ID
    getID() {
        return 'TestID';
    }
    getDefaultCurrency() {
        return 'USD';
    }
    getPreferences() {
        return {
            getCustom: () => {
                return this.preferenceMap;
            },
            custom: this.preferenceMap
        };
    }
    // dw.system.Site methods
    static getCurrent() {
        if (Site.current) {
            return Site.current;
        }
        return new Site();
    }
}

Site.current = Site.getCurrent();

module.exports = Site;
