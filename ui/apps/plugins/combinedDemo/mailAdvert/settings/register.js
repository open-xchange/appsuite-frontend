define('plugins/combinedDemo/mailAdvert/settings/register',
        ['io.ox/core/extensions',
         'settings!plugins/mail/AdvertOxMail',
         'gettext!plugins/mail/AdvertOxMail/settings',
         'io.ox/backbone/basicModel',
         'io.ox/backbone/views',
         'io.ox/backbone/forms'
         ],
         function (ext, settings, gt, BasicModel, views, forms) {
    'use strict';

    var point = views.point('plugins/mail/AdvertOxMail/settings/entry'),
    SettingView = point.createView({ tagName: 'form', className: 'form-horizontal'}),

    settingsArr = [['show_mail_ad_top', 'show_mail_ad_bottom', 'show_mail_module_ad'],  //variable names from settings
                   ['adTopOfMailContent', 'adBelowMailContent', 'adTopOfMail'],         //ids for checkbox extension-point
                   [gt('Email advert top'), gt('Email advert bottom'), gt('Advert in OX Mail')]],   //Labels for checkboxes

    headline = gt('Advertisement');

    ext.point('io.ox/settings/pane').extend({
        id: 'plugins/mail/AdvertOxMail',
        title: headline,
        ref: 'plugins/mail/AdvertOxMail',
        loadSettingPane: false,
        index: 400,
        lazySaveSettings: true
    });

    ext.point('plugins/mail/AdvertOxMail/settings/detail').extend({
        index: 50,
        id: 'extensions',
        draw: function () {
            var model = settings.createModel(BasicModel);
            model.on('change', function () {
                settings.save();
            });
            this.addClass('settings-container').append(
                $('<h1>').text(headline)
            );
            new SettingView({model: model}).render().$el.appendTo(this);
        }
    });

    $.each(settingsArr[0], function (index, value) {
        point.extend(new forms.CheckBoxField({
            id: settingsArr[1][index],
            index: 100,
            attribute: value,
            label: settingsArr[2][index]
        }));
    });

});