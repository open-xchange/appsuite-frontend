define('plugins/combinedDemo/mailAdvert/register',
        ['io.ox/core/extensions',
         'settings!plugins/combinedDemo/mailAdvert'],
         function (ext, settings) {
    'use strict';

    var settingsArr = ['show_mail_ad_top', 'show_mail_ad_bottom', 'show_mail_module_ad'],
        img = 'apps/plugins/mail/AdvertOxMail/img/banner.png',
        imghtml = '<img style="float: left;" src="' + img + '" />',
        txt = 'This month we are doing a special promotion for all our users: 50% off all bikes.<br/>Click here...',
        contentArray = [imghtml, txt],
        extPointInMail = ext.point('io.ox/mail/detail'),
        idForIndex = 'content',
        divClassName = 'adPluginContent';

    extPointInMail.extend({
        id: 'AdTopOfMailContent',
        before: idForIndex,
        draw: function () {
            if (settings.get(settingsArr[0])) {
                this.prepend(buildContentDiv(contentArray));
            }
        }
    });

    extPointInMail.extend({
        id: 'AdBelowMailContent',
        after: idForIndex,
        draw: function () {
            if (settings.get(settingsArr[1])) {
                this.append(buildContentDiv(contentArray));
            }
        }
    });

    extPointInMail.extend({
        id: 'AdTopOfMail',
        index: 'first',
        draw: function () {
            if (settings.get(settingsArr[2])) {
                var self = this;
                setTimeout(function () {
                    if (!self.parent().prev().children().first().hasClass(divClassName)) {
                        self.parent().prepend(buildContentDiv(contentArray));
                    }
                }, 0);
            }
        }
    });

    function buildContentDiv(contentArray) {
        var content = $('<div>').addClass(divClassName);
        $.each(contentArray, function (index, value) {
            content.append(value);
        });
        return content;
    }
});