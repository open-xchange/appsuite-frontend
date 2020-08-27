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
    'io.ox/core/extensions',
    'io.ox/core/tk/wizard',
    'io.ox/backbone/views/disposable',
    'io.ox/core/http',
    'settings!io.ox/onboarding',
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/style'
], function (ext, Wizard, DisposableView, http, settings, gt) {
    'use strict';

    var wizard,
        config = {},
        title = gt('Connect your device');

    function getUserData() {
        return require(['io.ox/core/api/user']).then(function (api) {
            return api.getCurrentUser().then(function (data) {
                return data;
            });
        });
    }

    function createQr(url) {
        return require(['static/3rd.party/qrcode/qrcode.js']).then(function (qrcode) {
            var qr;
            qrcode.toDataURL(url, function (err, url) {
                qr = url;
            });
            return qr;
        });
    }

    function getDownloadUrl(type) {
        return http.GET({
            module: 'onboarding',
            params: {
                action: 'link',
                type: type
            }
        }).then(function (data) {
            return data;
        });
    }

    function getStoreIcon(platform) {
        var languagePrefix = ox.language.slice(0, 2).toUpperCase(),
            country = _.contains(['EN', 'DE', 'ES', 'FR'], languagePrefix) ? languagePrefix : 'EN';
        return settings.get(platform + '/storeIcon').replace('$country', country);
    }

    var titles = {
        'windows': {
            'title': gt('Windows'),
            'drive': gt('Drive App'),
            'mailsync': gt('Windows Mail'),
            'emclient': gt('EM Client')
        },
        'android': {
            'title': gt('Android'),
            'mailsync': gt('Android Mail'),
            'mailapp': gt('OX Mail App'),
            'addressbook': gt('Contacts'),
            'calendar': gt('Calendar'),
            'driveapp': gt('OX Drive App')
        },
        'macos': {
            'title': gt('MacOS'),
            'drive': gt('Drive App'),
            'mailsync': gt('Apple Mail'),
            'calendar': gt('Calendar'),
            'addressbook': gt('Contacts')
        },
        'ios': {
            'title': gt('iOS'),
            'mailsync': gt('iOS Mail'),
            'mailapp': gt('OX Mail App'),
            'addressbook': gt('Addressbook'),
            'calendar': gt('Calendar'),
            'driveapp': gt('OX Drive App')
        }
    };

    var platformList = new Backbone.Collection([
        {
            'title': gt('Windows PC'),
            'icon': 'fa-windows',
            'platform': 'windows'
        },
        {
            'title': gt('Android phone or tablet'),
            'icon': 'fa-android',
            'platform': 'android'
        },
        {
            'title': gt('MacOS'),
            'icon': 'fa-apple',
            'platform': 'macos'
        },
        {
            'title': gt('iPhone or iPad'),
            'icon': 'fa-apple',
            'platform': 'ios'
        }
    ]);

    var appList = new Backbone.Collection([
        {
            'title': gt('Drive App'),
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'windows'
        },
        {
            'title': gt('Mail'),
            'icon': 'fa-envelope-o',
            'app': 'mailsync',
            'platform': 'windows'
        },
        {
            'title': gt('Email über Android Mail'),
            'icon': 'fa-cloud',
            'app': 'mailsync',
            'platform': 'android'
        },
        {
            'title': gt('Email über die OX Mail App'),
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'android'
        },
        {
            'title': gt('Contacts'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'android'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'android'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'android'
        },
        {
            'title': gt('Email über Apple Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'macos'
        },
        {
            'title': gt('Contacts'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'macos'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'macos'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'macos'
        },
        {
            'title': gt('Email über iOS Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'ios'
        },
        {
            'title': gt('Email über die OX Mail App'),
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'ios'
        },
        {
            'title': gt('Contacts'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'ios'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'ios'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'ios'
        }
    ]);


    settings.set({

        'incoming': {
            'server': 'imap.open-xchange.com',
            'port': '993',
            'connection': 'SSL/TLS'
        },
        'outgoing': {
            'server': 'smtp.open-xchange.com',
            'port': '465',
            'connection': 'SSL/TLS'
        },
        'caldav': {
            'url': 'https://dav-appsuite-dev.open-xchange.com',
            'login': '123'
        },
        'carddav': {
            'url': 'https://dav-appsuite-dev.open-xchange.com',
            'login': '123'
        },
        'android': {
            'mailapp': {
                'title': gt('OX Mail App'),
                'url': 'https://play.google.com/store/apps/details?id=com.openxchange.mobile.oxmail'
            },
            'driveapp': {
                'title': gt('OX Drive App'),
                'url': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla'
            },
            'storeIcon': 'apps/themes/icons/default/googleplay/google-play-badge_$country.svg'
        },
        'ios': {
            'mailapp': {
                'title': gt('OX Mail App'),
                'url': 'https://itunes.apple.com/us/app/ox-mail-v2/id1385582725'
            },
            'driveapp': {
                'title': gt('OX Drive App'),
                'url': 'https://itunes.apple.com/de/app/ox-drive/id798570177'
            },
            'storeIcon': 'apps/themes/icons/default/appstore/App_Store_Badge_$country_135x40.svg'
        },
        'macos': {
            'driveapp': {
                'title': gt('OX Drive App'),
                'url': 'https://itunes.apple.com/de/app/ox-drive/id818195014'
            },
            'storeIcon': 'apps/themes/icons/default/appstore/Mac_App_Store_Badge_$country_165x40.svg'
        },
        'windows/drive/url': 'https://appsuite.open-xchange.com',
        'android/url': 'https://play.google.com/store/apps/details?id=com.openxchange.mobile.oxmail&hl=en',
        'macos/mailsync/url': 'https://apsuite.open-xchange.com',
        'macos/drive/url': 'https://apsuite.open-xchange.com',
        'ios/mailsync/url': 'https://apsuite.open-xchange.com',
        'ios/url': 'https://apsuite.open-xchange.com'

    });

    var DownloadQrView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.url = options.url;
        },
        render: function () {
            var self = this;
            createQr(this.url).then(function (qr) {
                self.$el.append(
                    $('<div class="description">').append($('<p class="prompt">').text(gt('Please scan this code with your phone\'s camera:'))),
                    $('<img class="qrcode">').attr('src', qr),
                    $('<p class="link-info">').text(gt('Link: ')).append($('<a class="link">').text(self.url).attr('href', self.url))
                );
                return self;
            });

        }
    });

    var DownloadView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.link = options.link;
        },
        events: {
            'click .download': 'onClick'
        },
        render: function () {
            this.$el.append(
                $('<div class="description">').append(
                    $('<p class="prompt">').text(gt('Please download the application.'))
                ),
                $('<button type="button" data-action="download" class="btn-primary download">').text(gt('Download'))
            );
            return this;
        },
        onClick: function () {
            window.open(this.link);
        }
    });

    var DownloadConfigView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.type = options.type;
            this.config = options.config;
        },

        events: {
            'click .btn.download': 'onClick',
            'click .btn.manual-toggle': 'onToggle'
        },

        render: function () {
            this.syncView = this.type === 'mail' ? new MailSyncView({ incoming: this.config.incoming, outgoing: this.config.outgoing, userData: this.config.userData }) :
                new SyncView({ config: this.config });
            this.syncView.renderManualConfig();

            this.$el.append(
                $('<div class="description">').append(
                    $('<p class="info">').text(gt('Please download the configuration to automatically setup your account.'))
                ),
                $('<button type="button" data-action="download" class="btn btn-primary download">').text(gt('Download configuration'))
            );
            this.$el.append(
                $('<button class="btn btn-link manual-toggle" aria-expanded="false">').text(gt('Manual Configuration'))
                .prepend($('<i class="fa fa-chevron-right" aria-hidden="true">')),
                this.syncView.$el.hide()
            );
            return this;
        },

        onClick: function () {
            getDownloadUrl(this.type).then(function (url) {
                require(['io.ox/core/download'], function (download) {
                    download.url(url);
                });
            });
        },

        onToggle: function (e) {
            $(e.currentTarget).find('i.fa').toggleClass('fa-chevron-right fa-chevron-down').end()
                .attr('aria-expanded', function (i, v) { return v === 'false'; });
            this.syncView.$el.toggle();
        }
    });

    var MobileDownloadView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container mobile-download',

        initialize: function (options) {
            this.appIconClass = options.iconClass;
            this.storeIcon = options.storeIcon;
            this.url = options.app.url;
            this.title = options.app.title;
        },
        events: {
            'click .applink': 'onClick'
        },
        render: function () {
            this.$el.append(
                //$('<a href="#" class="app">').append(
                $('<img class="app-icon applink" role="button">')
                    .addClass(this.appIconClass)
                    .attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
                //),
                $('<p class="app-info">').text(this.title),
                //$('<a href="#" class="store">').append(
                $('<img class="store-icon applink" role="button">').attr('src', this.storeIcon)
                //)
            );
        },
        onClick: function () {
            window.open(this.url);
        }
    });

    var MailSyncView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.incoming = options.incoming;
            this.outgoing = options.outgoing;
            this.userData = options.userData;
            this.type = options.title;
        },
        render: function () {
            this.$el.append(
                $('<div class="description">')
                .append(
                    $('<p class="info">').html(gt('At first, please try to add your mail address ') + '<b>' + this.userData.get('email1') + '</b>' + gt(' to check whether %1$s can automatically configure your email account.', this.type)),
                    $('<p class="info">').text(gt('If an automatic configuration is not possible, please use the following information to manually setup your mail account:'))
                )
            );
            this.renderManualConfig();
            return this;
        },
        renderManualConfig: function () {
            this.$el.append(
                $('<div class="manual-description">').text(gt('Incoming Server Settings (IMAP)')),
                $('<pre class="manual-config">')
                    .append(
                        $('<div class="title incoming">')
                            .append(
                                $('<div class="server">').text(gt('Server')),
                                $('<div class="port">').text(gt('Port')),
                                $('<div class="username">').text(gt('Username')),
                                $('<div class="connection">').text(gt('Connection'))
                            ),
                        $('<div class="values incoming">')
                            .append(
                                $('<div class="server">').text(this.incoming.server),
                                $('<div class="port">').text(this.incoming.port),
                                $('<div class="username">').text(this.userData.get('login_info')),
                                $('<div class="connection">').text(this.incoming.connection)
                            )
                    ),
                $('<div class="manual-description">').text(gt('Outgoing Server Settings')),
                $('<pre class="manual-config">')
                    .append(
                        $('<div class="title outgoing">')
                            .append(
                                $('<div class="server">').text(gt('Server')),
                                $('<div class="port">').text(gt('Port')),
                                $('<div class="username">').text(gt('Username')),
                                $('<div class="connection">').text(gt('Connection'))
                            ),
                        $('<div class="values outgoing">')
                            .append(
                                $('<div class="server">').text(this.outgoing.server),
                                $('<div class="port">').text(this.outgoing.port),
                                $('<div class="username">').text(this.userData.get('login_info')),
                                $('<div class="connection">').text(this.outgoing.connection)
                            )
                    )
            );
        }
    });

    var SyncView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.type = options.name;
            this.config = options.config;
        },
        render: function () {
            this.$el.append(
                $('<div class="description">')
                    .append(
                        $('<p class="info">').text(gt('Synchronize ') + this.type + gt(' data with your device:'))
                    )
            );
            this.renderManualConfig();
            return this;
        },
        renderManualConfig: function () {
            this.$el.append(
                //$('<button class="manual-description">').text(gt('Manual Configuration')),
                $('<pre class="manual-config">')
                        .append(
                            $('<div class="title">')
                                .append(
                                    $('<div class="url">').text(gt('URL')),
                                    $('<div class="login">').text(gt('Login'))
                                ),
                            $('<div class="values">')
                                .append(
                                    $('<div class="url">').text(this.config.url),
                                    $('<div class="login">').text(this.config.login)
                                )
                        )
            );
        }
    });

    //all available setup scenarios
    var scenarios = {
        'windows': {
            'drive': function () { return new DownloadView({ link: settings.get('windows/drive/url') }); },
            'mailsync': function () { return new MailSyncView({ incoming: settings.get('incoming'), outgoing: settings.get('outgoing'), userData: config.userData, title: titles.windows.mailsync }); }
        },
        'android': {
            'mailsync': function () { return new MailSyncView({ incoming: settings.get('incoming'), outgoing: settings.get('outgoing'), userData: config.userData, title: titles.android.mailsync }); },
            'mailapp': function () { return _.device('smartphone') ? new MobileDownloadView({ app: settings.get('android/mailapp'), storeIcon: getStoreIcon('android'), iconClass: 'mailapp playstore' }) : new DownloadQrView({ url: settings.get('android/mailapp/url') }); },
            'driveapp': function () { return _.device('smartphone') ? new MobileDownloadView({ app: settings.get('android/driveapp'), storeIcon: getStoreIcon('android'), iconClass: 'driveapp playstore' }) : new DownloadQrView({ url: settings.get('android/driveapp/url') }); },
            'addressbook': function () { return new SyncView({ name: titles.android.addressbook, config: settings.get('carddav') }); },
            'calendar': function () { return new SyncView({ name: titles.android.calendar, config: settings.get('caldav') }); }
        },
        'macos': {
            'mailsync': function () { return new DownloadConfigView({ type: 'mail', config: { incoming: settings.get('incoming'), outgoing: settings.get('outgoing'), userData: config.userData } }); },
            //'addressbook': function () { return new SyncView({ type: titles.macos.addressbook, config: settings.get('carddav') }); },
            'addressbook': function () { return new DownloadConfigView({ type: 'carddav', config: settings.get('carddav') }); },
            //'calendar': function () { return new SyncView({ type: titles.macos.calendar, config: settings.get('caldav') }); },
            'calendar': function () { return new DownloadConfigView({ type: 'caldav', config: settings.get('caldav') }); },
            'drive': function () { return new MobileDownloadView({ app: settings.get('macos/driveapp'), storeIcon: getStoreIcon('macos'), iconClass: 'driveapp macappstore' }); }
        },
        'ios': {
            'mailsync': function () { return new DownloadQrView({ url: settings.get('ios/mailsync/url') }); },
            'mailapp': function () { return _.device('smartphone') ? new MobileDownloadView({ app: settings.get('ios/mailapp'), storeIcon: getStoreIcon('ios'), iconClass: 'mailapp appstore' }) : new DownloadQrView({ url: settings.get('ios/mailapp/url') }); },
            'driveapp': function () { return _.device('smartphone') ? new MobileDownloadView({ app: settings.get('ios/driveapp'), storeIcon: getStoreIcon('ios'), iconClass: 'driveapp appstore' }) : new DownloadQrView({ url: settings.get('ios/driveapp/url') }); },
            'addressbook': function () { return new SyncView({ name: titles.ios.addressbook, config: settings.get('carddav') }); },
            'calendar': function () { return new SyncView({ name: titles.ios.calendar, config: settings.get('caldav') }); }
        }
    };

    var PlatformView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function () {
            this.listView = new ListView({ collection: platformList, model: this.model });
        },

        render: function () {
            this.$el.append(
                $('<div class="description">')
                .append(
                    $('<p class="info">').text(gt('This wizard helps you to use App Suite on other devices.')),
                    $('<p class="prompt">').text(gt('Which device do you want to configure?'))
                ),
                this.listView.render().$el
            );
            return this;
        }
    });

    var AppView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function () {
            this.listView = new ListView({ collection: appList, model: this.model });
        },

        render: function () {
            this.$el.append(
                $('<div class="description">')
                .append(
                    $('<p class="prompt">').text(gt('Which application do you want to use?'))
                ),
                this.listView.render().$el
            );
            return this;
        }
    });

    var ListView = DisposableView.extend({

        tagName: 'ul',
        className: 'content-list',

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },
        events: {
            'click .list-btn': 'selectItem'
        },
        selectItem: function (e) {
            var target = $(e.currentTarget);
            this.model.set('app', target.attr('data-app'));
            this.model.set('platform', target.attr('data-platform'));
        },

        render: function () {
            this.$el.empty();
            this.renderListItems();
            return this;
        },

        renderListItems: function () {
            var list = this.collection,
                self = this;

            self.$el.append(
                // filter for selected items
                // create List items from selection
                list
                .filter(function (model) {
                    return self.model.get('platform') === undefined || self.model.get('platform') === model.get('platform');
                })
                .map(function (model) {
                    var view = new ListItemView({ model: model });
                    return view.render().$el;
                })
            );
        }
    });

    var ListItemView = DisposableView.extend({
        tagName: 'li',
        className: 'list-item',

        render: function () {
            this.$el
                .append(
                    $('<button type="button" class="list-btn">')
                    .addClass(this.model.get('data'))
                    .attr('data-platform', this.model.get('platform'))
                    .attr('data-app', this.model.get('app'))
                    .append(
                        $('<i class="icon-btn fa">').addClass(this.model.get('icon')),
                        $('<div class="list-description">').text(this.model.get('title')),
                        $('<i class="icon-next fa fa-chevron-right">')
                    ));
            return this;
        }
    });

    var ProgressionView = Backbone.View.extend({

        tagName: 'div',
        className: 'progress-container',

        initialize: function () {
            this.listenTo(this.model, 'change', _.device('smartphone') ? this.renderMobile : this.render);
        },
        render: function () {
            var platform = this.model.get('platform'),
                app = this.model.get('app'),
                platformTitle = platform ? titles[platform].title : undefined,
                appTitle = app ? titles[platform][app] : undefined;

            this.$el.empty()
                .append($('<ul class="progress-steps">')
                .append(
                    $('<li class="progress-step-one">')
                        .append(
                            $('<button type="button" class="btn progress-btn" data-action="back">')
                            .prop('disabled', true)
                            .append(
                                $('<span>').text('1'),
                                $('<span class="sr-only">').text(platformTitle ? platformTitle : gt('Platform'))
                            )
                        )
                        .addClass(!platform && !app ? 'active' : '')
                        .append($('<span class="progress-description aria-hidden="true">').text(platformTitle ? platformTitle : gt('Platform'))),
                    $('<li class="progress-step-two">')
                        .append(
                            $('<button type="button" class="btn progress-btn" data-action="back">')
                            .prop('disabled', true)
                            .append(
                                $('<span>').text('2'),
                                $('<span class="sr-only">').text(appTitle ? appTitle : gt('App'))
                            )
                        )
                        .addClass(platform && !app ? 'active' : '')
                        .append($('<span class="progress-description" aria-hidden="true">').text(appTitle ? appTitle : gt('App'))),
                    $('<li class="progress-step-three">')
                        .append(
                            $('<button type="button" class="btn progress-btn">')
                            .prop('disabled', true)
                            .append(
                                $('<span>').text('3'),
                                $('<span class="sr-only">').text(gt('Setup'))
                            )
                        )
                        .addClass(platform && app ? 'active' : '')
                        .append($('<span class="progress-description" aria-hidden="true">').text(gt('Setup')))
                ));

            $('.progress-step-one .btn').prop(platform ? { 'disabled': false } : '');
            $('.progress-step-two .btn').prop(app ? { 'disabled': false } : '');
            return this;
        },
        renderMobile: function () {
            var platform = this.model.get('platform'),
                app = this.model.get('app'),
                appTitle = app ? titles[platform][app] : undefined;

            this.$el.empty()
                .append($('<ul class="progress-steps">')
                .append(
                    $('<li class="progress-step-one">')
                        .append(
                            $('<button type="button" class="btn progress-btn" data-action="back">')
                            .prop('disabled', true)
                            .append(
                                $('<span>').text('1'),
                                $('<span class="sr-only">').text(appTitle ? appTitle : gt('App'))
                            )
                        )
                        .addClass(!app ? 'active' : '')
                        .append($('<span class="progress-description">').text(appTitle ? appTitle : gt('App'))),
                    $('<li class="progress-step-three">')
                        .append(
                            $('<button type="button" class="btn progress-btn">')
                            .prop('disabled', true)
                            .append(
                                $('<span>').text('2'),
                                $('<span class="sr-only">').text(gt('Setup'))
                            )
                        )
                        .addClass(app ? 'active' : '')
                        .append($('<span class="progress-description">').text(gt('Setup')))
                ));

            $('.progress-step-one .btn').prop(app ? { 'disabled': false } : '');
            return this;
        }
    });

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
                    connectTour.model = new Backbone.Model({ app: undefined, platform: platform, currentStep: connectTour.currentStep });
                    connectTour.platformsView = new PlatformView({ model: connectTour.model });
                    connectTour.appsView = new AppView({ model: connectTour.model });
                    connectTour.progressView = new ProgressionView({ model: connectTour.model });

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
                    connectTour.appsView.render();

                    // dont start with platforms view on mobile
                    if (!_.device('smartphone')) {
                        connectTour.platformsView.render();
                        connectTour.progressView.render();

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
                    } else {
                        connectTour.progressView.renderMobile();
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
                });
            }
            Wizard.registry.run('connect-wizard');
            console.log(title);
        },
        load: function () {
            getUserData().then(function (data) {
                config.userData = data;
                wizard.run();
            });
        }
    };
    return wizard;

});
