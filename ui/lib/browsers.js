// NOSJSHINT
/**
 * Extend underscore with some browser detection
 * and a matrix of supported browsers
 */

(function() {
    // to be continued, add as many known versions
    _.browserSupport = {
        IE              : {
            'isSupported' : false,
            '8' : false,
            '9' : false,
            '10': false
        },
        Opera           : {
            'isSupported' : false
        },
        Safari          : {
            'isSupported' : true,
            '5': true,
            '6': true
        },
        Chrome          : {
            'isSupported' : true,
            '21': true,
            '22': true,
            '23': true
        },
        Firefox         : {
            'isSupported' : false,
            '3.5': false,
            '15' : false
        },
        MobileSafari    : {
            'isSupported' : true,
            '3': false,
            '4': false,
            '5': true,
            '6': true
        },
        MobileFirefox   : {
            'isSupported' : false,
            '15': false
        },
        Android         : {
            'isSupported' : false,
            '2.2' : false,
            '2.3' : false,
            '2.3' : false,
            '3.0' : false,
            '4.0' : false
        },
        ChromeMobile    : {
            'isSupported' : false,
            '18': false
        },
        BB              : {
            'isSupported' : false
        }
    };



    _.browserDetect = {
        getBrowser: function() {
            var ua = navigator.userAgent, browser = {};
            var b =  {
                /** is IE? */
                IE: /MSIE/.test(ua),
                /** is Opera? */
                Opera: Object.prototype.toString.call(window.opera) === "[object Opera]",
                /** Safari */
                Safari: ua.indexOf('AppleWebKit/') > -1 && !ua.indexOf('Chrome/') > -1 && !/iPhone|iPad|iPod/.test(ua),
                /** Chrome */
                Chrome: ua.indexOf('AppleWebKit/') > -1 && ua.indexOf('Chrome/') > -1,
                /** is Firefox? */
                Firefox:  ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
                /** some mobile devices **/
                /** iOS with stock browser**/
                MobileSafari: /iPhone|iPad|iPod/.test(ua),
                /** Android **/
                Android:  /Android/.test(ua),
                ChromeMobile: /Android/.test(ua) && /Chrome/.test(ua),
                /** Blackberry **/
                BB: /BlackBerry/.test(ua)

            };
            _(b).each(function(value, key) {
                if (value === true) {
                    browser.type = key;
                }
            });
            return browser;
        }
    };
}());
