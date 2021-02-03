/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

define('io.ox/onboarding/main', [
    'io.ox/core/tk/wizard',
    'io.ox/core/http',
    'io.ox/onboarding/views',
    'io.ox/onboarding/util',
    'settings!io.ox/onboarding',
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/style'
], function (Wizard, http, views, util, settings, gt) {
    'use strict';

    var wizard,
        config,
        title = gt('Connect your device');

    function getUserData() {
        return require(['io.ox/core/api/user']).then(function (api) {
            return api.getCurrentUser().then(function (data) {
                return data;
            });
        });
    }

    function getStoreIcon(platform) {
        var languagePrefix = ox.language.slice(0, 2).toUpperCase(),
            country = _.contains(['EN', 'DE', 'ES', 'FR'], languagePrefix) ? languagePrefix : 'EN';
        return settings.get(platform + '/storeIcon').replace('$country', country);
    }

    function getOnbboardingConfig(actionId) {
        if (!config) {
            config = http.GET({
                module: 'onboarding',
                params: {
                    action: 'config'
                }
            });
        }

        return config.then(function (config) {
            var action = config.actions.find(function (action) {
                return action.id === actionId;
            });
            return action && action.data;
        });
    }

    function getMailConfig() {
        var configModel = new Backbone.Model();
        getOnbboardingConfig('display/mailmanual').then(function (data) {
            configModel.set('data', data);
        });
        return configModel;
    }

    function getCalendarConfig() {
        var configModel = new Backbone.Model();
        getOnbboardingConfig('display/davmanual').then(function (data) {
            configModel.set('url', data.caldav_url);
            configModel.set('login', data.caldav_login);
        });
        return configModel;
    }

    function getContactsConfig() {
        var configModel = new Backbone.Model();
        getOnbboardingConfig('display/davmanual').then(function (data) {
            configModel.set('url', data.carddav_url);
            configModel.set('login', data.carddav_login);
        });
        return configModel;
    }

    function getEasConfig() {
        var configModel = new Backbone.Model();
        getOnbboardingConfig('display/easmanual').then(function (data) {
            configModel.set('url', data.eas_url);
            configModel.set('login', data.eas_login);
        });
        return configModel;
    }
    //all available setup scenarios
    var scenarios = {
        'windows': {
            'drive': function () { return new views.DownloadView({ link: settings.get('windows/driveapp/url') }); },
            'mailsync': function () { return new views.MailSyncView({ userData: config.userData, expanded: true, config: getMailConfig() }); }
        },
        'android': {
            'mailsync': function () { return new views.MailSyncView({ userData: config.userData, expanded: true, config: getMailConfig() }); },
            'mailapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('android/mailapp'),
                        title: settings.get('productNames/mail'),
                        storeIcon: getStoreIcon('android'),
                        iconClass: 'mailapp playstore'
                    });
                }
                return new views.DownloadQrView({ title: util.titles.android.mailapp, url: settings.get('android/mailapp/url') });
            },
            'driveapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('android/driveapp'),
                        title: settings.get('productNames/drive'),
                        storeIcon: getStoreIcon('android'),
                        iconClass: 'driveapp playstore'
                    });
                }
                return new views.DownloadQrView({ title: util.titles.android.driveapp, url: settings.get('android/driveapp/url') });
            },
            'addressbook': function () {
                return new views.SyncView({
                    description: gt('To synchronize Address Book with your phone, please enter the following settings in your CardDav client:'),
                    config: getContactsConfig()
                });
            },
            'calendar': function () {
                return new views.SyncView({
                    description: gt('To synchronize Calendar with your phone, please enter the following settings in your CalDav client:'),
                    config: getCalendarConfig()
                });
            }
        },
        'macos': {
            'mailsync': function () { return new views.DownloadConfigView({ type: 'mail', config: getMailConfig() }); },
            'addressbook': function () { return new views.DownloadConfigView({ type: 'carddav', config: getContactsConfig() }); },
            'calendar': function () { return new views.DownloadConfigView({ type: 'caldav', config: getCalendarConfig() }); },
            'drive': function () {
                return new views.MobileDownloadView({
                    app: settings.get('macos/driveapp'),
                    title: settings.get('productNames/drive'),
                    storeIcon: getStoreIcon('macos'),
                    iconClass: 'driveapp macappstore'
                });
            }
        },
        'ios': {
            'mailsync': function () {
                if (_.device('smartphone')) {
                    return new views.DownloadConfigView({
                        type: 'mail',
                        userData: config.userData,
                        config: getMailConfig()
                    });
                }
                return new views.DownloadQrView({
                    type: 'mail',
                    title: util.titles.ios.mailsync,
                    description: gt('Please scan this code with your phone\'s camera:'),
                    config: getMailConfig()
                });
            },
            'mailapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('ios/mailapp'),
                        title: settings.get('productNames/mail'),
                        storeIcon: getStoreIcon('ios'),
                        iconClass: 'mailapp appstore'
                    });
                }
                return new views.DownloadQrView({ title: util.titles.ios.mailapp, url: settings.get('ios/mailapp/url') });
            },
            'driveapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('ios/driveapp'),
                        title: settings.get('productNames/drive'),
                        storeIcon: getStoreIcon('ios'),
                        iconClass: 'driveapp appstore'
                    });
                }
                return new views.DownloadQrView({ title: util.titles.ios.driveapp, url: settings.get('ios/driveapp/url') });
            },
            'eassync': function () {
                return new views.SyncView({
                    description: gt('To synchronize Mail, Calendar and Address Book via Exchange Active Sync, please enter the following settings:'),
                    config: getEasConfig()
                });
            },
            'addressbook': function () {
                if (_.device('smartphone')) {
                    return new views.DownloadConfigView({
                        type: 'carddav',
                        config: getContactsConfig()
                    });
                }
                return new views.DownloadQrView({ title: util.titles.ios.addressbook, type: 'carddav', config: getContactsConfig() });
            },
            'calendar': function () {
                if (_.device('smartphone')) {
                    return new views.DownloadConfigView({
                        type: 'caldav',
                        config: getCalendarConfig()
                    });
                }
                return new views.DownloadQrView({ title: util.titles.ios.calendar, type: 'caldav', config: getCalendarConfig() });
            }
        }
    };

    function drawScaffold() {
        this.$('div[role="document"]').addClass('connect-wizard');
        this.$('.wizard-title').text(title);
        this.$('.wizard-footer').empty().append(
            $('<button type="button" class="btn btn-default col-xs-12 col-sm-3" data-action="close">').text(gt('Close')),
            this.parent.currentStep === 0 ? '' : $('<button type="button" class="btn btn-default col-xs-12 col-sm-3" data-action="back">').text(gt('Back'))
        );
    }

    function focus() {
        this.$('.content-container').find('button:not(:disabled):visible:first').focus();
    }

    wizard = {
        run: function () {
            var options = {
                id: 'connect-wizard',
                title: title
            };

            if (!Wizard.registry.get('connect-wizard')) {
                Wizard.registry.add(options, function () {
                    var connectWizard = new Wizard({ disableMobileSupport: true }),
                        platform;

                    // set platform if mobile device detected
                    if (_.device('ios && smartphone')) {
                        platform = 'ios';
                    } else if (_.device('android && smartphone')) {
                        platform = 'android';
                    } else {
                        platform = undefined;
                    }

                    // setup model and views
                    connectWizard.userData = {};
                    connectWizard.model = new Backbone.Model({ app: undefined, platform: platform });
                    connectWizard.platformsView = new views.PlatformView({ model: connectWizard.model });
                    connectWizard.appsView = new views.AppView({ model: connectWizard.model });
                    connectWizard.progressView = new views.ProgressionView(connectWizard);

                    // ensure that everything is reset on close
                    connectWizard.on('stop', function () {
                        connectWizard.model = null;
                        connectWizard.platformsView.remove();
                        connectWizard.platformsView = null;
                        connectWizard.appsView.remove();
                        connectWizard.appsView = null;
                        connectWizard.progressView.remove();
                        connectWizard.progressView = null;
                        connectWizard = null;
                    });
                    connectWizard.on('reset', function () {
                        connectWizard.model.set({ app: undefined, platform: platform });
                        connectWizard.shift(0 - connectWizard.currentStep);
                    });
                    connectWizard.appsView.render();
                    connectWizard.progressView.render();
                    // dont start with platforms view on mobile
                    if (!_.device('smartphone')) {
                        connectWizard.platformsView.render();

                        connectWizard.step({
                            id: 'platform',
                            back: false,
                            next: false,
                            disableMobileSupport: true
                        })
                        .on('before:show', function () {
                            // draw list of available platforms
                            drawScaffold.call(this);
                            this.$('.wizard-content').append(
                                connectWizard.progressView.$el,
                                connectWizard.platformsView.$el
                            );
                            // trigger next step only once
                            connectWizard.model.once('change', function (model) {
                                if (!model.get('platform')) return;
                                connectWizard.next();
                            });
                        })
                        .on('show', function () { focus.call(this); })
                        .end();
                    }
                    connectWizard.step({
                        id: 'apps',
                        back: false,
                        next: false,
                        disableMobileSupport: true
                    })
                    .on('before:show', function () {
                        // draw list of apps for chosen platform
                        drawScaffold.call(this);
                        this.$('.wizard-content').append(
                            connectWizard.progressView.$el,
                            connectWizard.appsView.$el
                        );

                        // trigger next step only once
                        connectWizard.model.once('change', function (model) {
                            if (!model.get('app') && !model.get('platform')) return;
                            connectWizard.next();
                        });
                    })
                    .on('show', function () { focus.call(this); })
                    .on('back', function () {
                        connectWizard.model.set('platform', undefined);
                    })
                    .end()
                    .step({
                        id: 'setup',
                        back: false,
                        next: false,
                        disableMobileSupport: true
                    })
                    .on('before:show', function () {
                        var self = this;
                        // draw scenario for chosen app and platform
                        drawScaffold.call(this);
                        var view = scenarios[connectWizard.model.get('platform')][connectWizard.model.get('app')]();
                        view.render();
                        self.$('.wizard-content').empty().append(
                            connectWizard.progressView.$el,
                            view.$el);
                    })
                    .on('show', function () { focus.call(this); })
                    .on('back', function () {
                        connectWizard.model.set('app', undefined);
                    })
                    .end();
                    connectWizard.start();
                    window.connectWizard = connectWizard;
                });
            }
            Wizard.registry.run('connect-wizard');
        },
        load: function () {
            settings.load();
            getOnbboardingConfig();
            getUserData().then(function (data) {
                config.userData = data;
                wizard.run();
            });
        }
    };
    return wizard;
});
