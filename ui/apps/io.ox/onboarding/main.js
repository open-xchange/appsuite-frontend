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
    //all available setup scenarios
    var scenarios = {
        'windows': {
            'drive': function () { return new views.DownloadView({ link: settings.get('windows/drive_url') }); },
            'mailsync': function () { return new views.MailSyncView({ userData: config.userData, title: util.titles.windows.mailsync }); }
        },
        'android': {
            'mailsync': function () { return new views.MailSyncView({ userData: config.userData, title: util.titles.android.mailsync }); },
            'mailapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('android/mailapp'),
                        storeIcon: getStoreIcon('android'),
                        iconClass: 'mailapp playstore'
                    });
                }
                return new views.DownloadQrView({ url: settings.get('android/mailapp/url') });
            },
            'driveapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('android/driveapp'),
                        storeIcon: getStoreIcon('android'),
                        iconClass: 'driveapp playstore'
                    });
                }
                return new views.DownloadQrView({ url: settings.get('android/driveapp/url') });
            },
            'addressbook': function () {
                return new views.SyncView({ name: util.titles.android.addressbook, config: getContactsConfig() });
            },
            'calendar': function () {
                return new views.SyncView({ name: util.titles.android.calendar, config: getCalendarConfig() });
            }
        },
        'macos': {
            'mailsync': function () { return new views.DownloadConfigView({ type: 'mail', userData: config.userData }); },
            'addressbook': function () { return new views.DownloadConfigView({ type: 'carddav', config: getContactsConfig() }); },
            'calendar': function () { return new views.DownloadConfigView({ type: 'caldav', config: getCalendarConfig() }); },
            'drive': function () { return new views.MobileDownloadView({ app: settings.get('macos/driveapp'), storeIcon: getStoreIcon('macos'), iconClass: 'driveapp macappstore' }); }
        },
        'ios': {
            'mailsync': function () {
                if (_.device('smartphone')) {
                    new views.DownloadConfigView({
                        type: 'mail',
                        userData: config.userData
                    });
                }
                return new views.DownloadQrView({ type: 'mail', title: util.titles.ios.mailsync });
            },
            'mailapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('ios/mailapp'),
                        storeIcon: getStoreIcon('ios'),
                        iconClass: 'mailapp appstore'
                    });
                }
                return new views.DownloadQrView({ url: settings.get('ios/mailapp/url') });
            },
            'driveapp': function () {
                if (_.device('smartphone')) {
                    return new views.MobileDownloadView({
                        app: settings.get('ios/driveapp'),
                        storeIcon: getStoreIcon('ios'),
                        iconClass: 'driveapp appstore'
                    });
                }
                return new views.DownloadQrView({ url: settings.get('ios/driveapp/url') });
            },
            'eassync': function () {
                if (_.device('smartphone')) {
                    return new views.DownloadConfigView({
                        type: 'eassync',
                        config: settings.get('ios/eassync')
                    });
                }
                return new views.DownloadQrView({ url: settings.get('ios/eassync/url') });
            },
            'addressbook': function () {
                if (_.device('smartphone')) {
                    return new views.DownloadConfigView({
                        type: 'carddav',
                        config: getContactsConfig()
                    });
                }
                return new views.DownloadQrView({ type: 'carddav', config: getContactsConfig() });
            },
            'calendar': function () {
                if (_.device('smartphone')) {
                    return new views.DownloadConfigView({
                        type: 'caldav',
                        config: getCalendarConfig()
                    });
                }
                return new views.DownloadQrView({ type: 'caldav', config: getCalendarConfig() });
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
                    var connectTour = new Wizard({ disableMobileSupport: true }),
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
                    connectTour.userData = {};
                    connectTour.model = new Backbone.Model({ app: undefined, platform: platform });
                    connectTour.platformsView = new views.PlatformView({ model: connectTour.model });
                    connectTour.appsView = new views.AppView({ model: connectTour.model });
                    connectTour.progressView = new views.ProgressionView(connectTour);

                    // ensure that everything is reset on close
                    connectTour.on('stop', function () {
                        console.log('close');
                        connectTour.model = null;
                        connectTour.platformsView.remove();
                        connectTour.platformsView = null;
                        connectTour.appsView.remove();
                        connectTour.appsView = null;
                        connectTour.progressView.remove();
                        connectTour.progressView = null;
                        connectTour = null;
                    });
                    connectTour.on('reset', function () {
                        console.log('reset');
                        connectTour.model.set({ app: undefined, platform: platform });
                        connectTour.shift(0 - connectTour.currentStep);
                    });
                    connectTour.appsView.render();
                    connectTour.progressView.render();
                    // dont start with platforms view on mobile
                    if (!_.device('smartphone')) {
                        connectTour.platformsView.render();

                        connectTour.step({
                            id: 'platform',
                            back: false,
                            next: false,
                            disableMobileSupport: true
                        })
                        .on('before:show', function () {
                            // draw list of available platforms
                            drawScaffold.call(this);
                            this.$('.wizard-content').append(
                                connectTour.progressView.$el,
                                connectTour.platformsView.$el
                            );
                            // trigger next step only once
                            connectTour.model.once('change', function (model) {
                                if (!model.get('platform')) return;
                                connectTour.next();
                            });
                        })
                        .on('show', function () { focus.call(this); })
                        .end();
                    }
                    connectTour.step({
                        id: 'apps',
                        back: false,
                        next: false,
                        disableMobileSupport: true
                    })
                    .on('before:show', function () {
                        // draw list of apps for chosen platform
                        drawScaffold.call(this);
                        this.$('.wizard-content').append(
                            connectTour.progressView.$el,
                            connectTour.appsView.$el
                        );

                        // trigger next step only once
                        connectTour.model.once('change', function (model) {
                            if (!model.get('app') && !model.get('platform')) return;
                            connectTour.next();
                        });
                    })
                    .on('show', function () { focus.call(this); })
                    .on('back', function () {
                        connectTour.model.set('platform', undefined);
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
                        var view = scenarios[connectTour.model.get('platform')][connectTour.model.get('app')]();
                        view.render();
                        self.$('.wizard-content').empty().append(
                            connectTour.progressView.$el,
                            view.$el);
                    })
                    .on('show', function () { focus.call(this); })
                    .on('back', function () {
                        connectTour.model.set('app', undefined);
                    })
                    .end();
                    connectTour.start();
                    window.connectTour = connectTour;
                });
            }
            Wizard.registry.run('connect-wizard');
            console.log(title);
        },
        load: function () {
            getOnbboardingConfig();
            getUserData().then(function (data) {
                config.userData = data;
                console.log(config);
                wizard.run();
            });
        }
    };
    return wizard;
});
