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
    'gettext!io.ox/core/onboarding',
    'less!io.ox/onboarding/style'
], function (ext, Wizard, DisposableView, gt) {
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
            'title': gt('Mail + Calendar + Address Book'),
            'icon': 'fa-users',
            'app': 'emclient',
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
            'icon': 'fa-users',
            'app': 'calendar',
            'platform': 'android'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-users',
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
            'icon': 'fa-cloud',
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
            'icon': 'fa-users',
            'app': 'calendar',
            'platform': 'ios'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-users',
            'app': 'driveapp',
            'platform': 'ios'
        }
    ]);

    var settings = new Backbone.Model({

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
        'windows/drive/url': 'https://appsuite.open-xchange.com',
        'windows/emclient/url': 'https://appsuite.open-xchange.com',
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
                    $('<p class="link-info">').text(gt('Link')).append($('<a class="link">').text(self.url).attr('href', self.url))
                );
                return self;
            });

        }
    });

    var DownloadView = DisposableView.extend({
        tagName: 'div',
        className: 'content-container',
        initialize: function (options) {
            this.url = options.url;
        },
        render: function () {
            this.$el.append(
                $('<div class="description">').append(
                    $('<p class="prompt">').text(gt('Please download the configuration to autmatically setup your account.'))
                ),
                $('<button type="button" data-action="download" class="btn-primary download">').text(gt('Download')).attr('href', this.url)
            );
            return this;
        }
    });

    var MailSyncView = DisposableView.extend({
        tagName: 'div',
        className: 'content-container',
        initialize: function (options) {
            this.incoming = options.incoming;
            this.outgoing = options.outgoing;
            this.userData = options.userData;
        },
        render: function () {
            this.$el.append(
                $('<div class="description">')
                .append(
                    $('<p class="info">').html(gt('At first, please try to add your mail address ') + '<b>' + this.userData.get('email1') + '</b>' + gt(' to check whether Android Mail can automatically configure your email account.')),
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
            this.type = options.type;
        },
        render: function () {
            this.$el.append(
                $('<div class="description">')
                    .append(
                        $('<p class="info">').text(gt('Synchronize ') + this.type + gt(' data with your device:'))
                    )
            );
            return this;
        }
    });

    //all available setup scenarios
    var scenarios = {
        'windows': {
            'drive': function () { return new DownloadView({ url: settings.get('windows/drive/url') }); },
            'mailsync': function () { return new SyncView({ type: 'Mail' }); },
            'emclient': function () { return new DownloadView({ url: settings.get('windows/emclient/url') }); }
        },
        'android': {
            'mailsync': function () { return new MailSyncView({ incoming: settings.get('incoming'), outgoing: settings.get('outgoing'), userData: config.userData }); },
            'mailapp': function () { return new DownloadQrView({ url: settings.get('android/url') }); },
            'driveapp': function () { return new DownloadQrView({ url: settings.get('android/url') }); },
            'addressbook': function () { return new SyncView({ type: 'Addressbook' }); },
            'calendar': function () { return new SyncView({ type: 'Calendar' }); }
        },
        'macos': {
            'mailsync': function () { return new DownloadView({ url: settings.get('macos/mailsync/url') }); },
            'addressbook': function () { return new SyncView({ type: 'Addressbook' }); },
            'calendar': function () { return new SyncView({ type: 'Calendar' }); },
            'drive': function () { return new DownloadView({ url: settings.get('macos/drive/url') }); }
        },
        'ios': {
            'mailsync': function () { return new DownloadQrView({ url: settings.get('ios/mailsync/url') }); },
            'mailapp': function () { return new DownloadQrView({ url: settings.get('ios/url') }); },
            'driveapp': function () { return new DownloadQrView({ url: settings.get('ios/url') }); },
            'addressbook': function () { return new SyncView({ type: 'Addressbook' }); },
            'calendar': function () { return new SyncView({ type: 'Calendar' }); }
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
                list
                .filter(function (model) {
                    return self.model.get('platform') === undefined || self.model.get('platform') === model.get('platform');
                })
                .map(function (model) {
                    var view = new ListItemView({ model: model });
                    return view.render().$el;
                })
            );

        },
        onDispose: function () {
            console.log(this.cid);
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
            this.listenTo(this.model, 'change', this.render);
        },
        render: function () {
            var platform = this.model.get('platform'),
                app = this.model.get('app');

            this.$el.empty()
                .append($('<ul class="progress-steps">')
                .append(
                    $('<li class="progress-step-one">')
                    .text('1').addClass(!platform && !app ? 'active' : '')
                    .append($('<p class="progress-description">').text(platform ? platform : gt('Platform'))),
                    $('<li class="progress-step-two">')
                    .text('2').addClass(platform && !app ? 'active' : '')
                    .append($('<p class="progress-description">').text(app ? app : gt('App'))),
                    $('<li class="progress-step-three">')
                    .text('3').addClass(platform && app ? 'active' : '')
                    .append($('<p class="progress-description">').text(gt('Setup')))

                ));
            $('.progress-step-one').attr(!!platform ? { role: 'button', 'data-action': 'back' } : '');
            $('.progress-step-two').attr(!!app ? { role: 'button', 'data-action': 'back' } : '');
            return this;
        }
    });

    function drawScaffold() {
        this.$('div[role="document"]').addClass('connect-wizard');
        this.$('.wizard-title').text(title);
        this.$('.wizard-footer').empty().append(
            this.parent.currentStep === 0 ? '' : $('<button type="button" class="btn btn-default" data-action="back">').text(gt('Back')),
            $('<button type="button" class="btn btn-default" data-action="close">').text(gt('Close'))
        );
    }


    wizard = {
        run: function () {
            var options = {
                id: 'connect-wizard',
                title: title
            };

            if (!Wizard.registry.get('connect-wizard')) {
                Wizard.registry.add(options, function () {
                    var connectTour = new Wizard();

                    connectTour.userData = {};
                    connectTour.model = new Backbone.Model({ app: undefined, platform: undefined, currentStep: connectTour.currentStep });
                    connectTour.platformsView = new PlatformView({ model: connectTour.model });
                    connectTour.appsView = new AppView({ model: connectTour.model });
                    connectTour.progressView = new ProgressionView({ model: connectTour.model });
                    // ensure that everything is reset
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
                    connectTour.progressView.render();
                    connectTour.platformsView.render();
                    connectTour.appsView.render();

                    connectTour.step({
                        id: 'platform',
                        back: false,
                        next: false,
                        minWidth: '600px'
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
                    .end()
                    .step({
                        id: 'apps',
                        back: false,
                        next: false,
                        minWidth: '600px'
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
                    .on('back', function () {
                        connectTour.model.set('platform', undefined);
                    })
                    .end()
                    .step({
                        id: 'setup',
                        back: false,
                        next: false,
                        minWidth: '600px'
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
