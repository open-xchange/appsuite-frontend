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

define('io.ox/onboarding/views', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/http',
    'io.ox/core/capabilities',
    'io.ox/onboarding/util',
    'gettext!io.ox/core/onboarding'
], function (DisposableView, http, capabilities, util, gt) {

    function getAccountData() {
        return require(['io.ox/core/api/account']).then(function (api) {
            return api.get(0).then(function (data) {
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

    var DownloadQrView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.url = options.url;
            this.type = options.type;
            this.config = options.config;
            this.title = options.title;
            this.qrCode = new Backbone.Model();
            this.generatedUrl = !this.url ? new Backbone.Model() : undefined;
            //#. 1$s type of application to synchronize, which is either Address Book or Calendar
            this.description = options.description || gt('Scan this code with your phone\'s camera to synchronize your "%1$s":', this.title);
            this.listenTo(this.qrCode, 'change', this.updateQr);
            this.listenTo(this.generatedUrl, 'change', this.updateUrl);
        },

        render: function () {
            // url only specified for store links
            // show manual config additionally
            if (this.url) return this.renderQr();

            this.syncView = this.type === 'mail' ? new MailSyncView({}) :
                new SyncView({ config: this.config });

            this.$el.busy().append(
                $('<div class="description">').append($('<p class="prompt">').text(this.description)),
                $('<img class="qrcode">'),
                $('<p class="link-info">').text(gt('Link: ')).append($('<a class="link">')),
                $('<p class="hint">').text(gt('Please note: After downloading you will have to enable the profile in the settings App to complete the installation.')),
                this.syncView.render().$el
            );
            this.getQrUrl();
            return this;
        },

        renderQr: function () {
            this.$el.busy().append(
                //#. 1$s name of the product to install, e.g. OX Mail or Drive
                $('<div class="description">').append($('<p class="prompt">').text(gt('To install %1$s, please scan this code with your phone\'s camera:', this.title))),
                $('<img class="qrcode">'),
                $('<p class="link-info">').text(gt('Link: ')).append($('<a class="link">').text(this.url).attr('href', this.url))
            );
            this.getQr();
            return this;
        },

        getQr: function () {
            var self = this;
            createQr(this.url).then(function (qr) {
                self.qrCode.set('src', qr);
            });
        },

        getQrUrl: function () {
            var self = this;
            getDownloadUrl(this.type).then(function (url) {
                self.url = url;
                self.generatedUrl.set('url', url);
                self.getQr();
            });
        },

        updateUrl: function () {
            var url = this.generatedUrl.get('url');
            this.$('.link-info .link').text(url).attr('href', url);
        },

        updateQr: function () {
            this.$('.qrcode').attr('src', this.qrCode.get('src'));
            this.$el.idle();
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
                    //#. 1$s name of the product, usually OX Drive
                    $('<p class="prompt">').text(gt('Download %1$s for Windows', util.titles.windows.drive))
                ),
                //#. 1$s name of the product, usually OX Drive
                $('<button type="button" data-action="download" class="btn btn-link download">').text(gt('%1$s for Windows', util.titles.windows.drive)).append(
                    $('<i class="fa fa-download">')
                )
            );
            return this;
        },

        onClick: function () {
            var self = this;
            require(['io.ox/core/download']).then(function (download) {
                download.url(self.link);
            });
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
            'click .btn.download': 'onClick'
        },

        render: function () {
            this.syncView = this.type === 'mail' ? new MailSyncView({}) :
                new SyncView({ config: this.config });

            this.$el.append(
                $('<div class="description">').append(
                    $('<p class="prompt">').text(gt('Please download the configuration to automatically set up your account.'))
                ),
                $('<button type="button" data-action="download" class="btn btn-primary download">').text(gt('Download configuration')),
                this.syncView.render().$el
            );
            return this;
        },

        onClick: function () {
            getDownloadUrl(this.type).then(function (url) {
                require(['io.ox/core/download'], function (download) {
                    download.url(url);
                });
            });
        }
    });

    var MobileDownloadView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container mobile-download',

        initialize: function (options) {
            this.appIconClass = options.iconClass;
            this.storeIcon = options.storeIcon;
            this.url = options.app.url;
            this.title = options.title;
            if (options.app.icon) {
                this.appIcon = options.app.icon;
                this.appIconClass = '';
            }
        },

        events: {
            'click .applink': 'onClick'
        },

        render: function () {
            this.$el.append(
                $('<div class="app-icon-container">').append(
                    $('<img class="app-icon applink" role="button">')
                    .addClass(this.appIconClass)
                    .attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
                    .css('background-image', this.appIcon ? 'url(' + this.appIcon + ')' : ''),
                    $('<p class="app-info">').text(this.title)
                ),
                $('<img class="store-icon applink" role="button">').attr('src', this.storeIcon)
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
            this.userData = options.userData;
            this.type = options.title;
            this.expanded = options.expanded || false;
            this.mailConfig = new Backbone.Model();
            this.listenTo(this.mailConfig, 'change', this.updateMailConfig);
        },

        events: {
            'click .manual-toggle': 'onToggle'
        },

        render: function () {
            if (this.userData) {
                this.$el.append(
                    $('<div class="description">')
                    .append(
                        //#, %1s primary email address of the curent user
                        $('<p class="info">').html(gt('Please try to add your mail address <b>%1$s</b> to check whether your mail client can automatically configure your email account.', this.userData.get('email1'))),
                        $('<p class="info">').text(gt('If an automatic configuration is not possible, please use the following information to manually setup your mail account:'))
                    )
                );
            }
            console.log('expanded', this, this.expanded);
            this.$el.append(
                this.expanded ? $('<div class="manual-container">') :
                    [
                        $('<a href="#" role="button" class="manual-toggle" aria-expanded="false">').text(gt('Show manual configuration options')),
                        $('<div class="manual-container">').hide()
                    ]
            );
            this.renderManualConfig();
            this.getMailConfig();
            return this;
        },

        renderManualConfig: function () {
            this.$('.manual-container').append(
                $('<div class="manual-description">').text(gt('Incoming Server Settings (IMAP)')),
                $('<pre class="manual-config">')
                    .append(
                        $('<div class="title incoming">')
                            .append(
                                $('<div class="server">').text(gt('Server')),
                                $('<div class="port">').text(gt('Port')),
                                $('<div class="username">').text(gt('Username')),
                                $('<div class="connection">').text(gt('Connection')),
                                $('<div class="pass">').text(gt('Password'))
                            ),
                        $('<div class="values incoming">')
                            .append(
                                $('<div class="server">'),
                                $('<div class="port">'),
                                $('<div class="username">'),
                                $('<div class="connection">'),
                                $('<div class="pass">')
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
                                $('<div class="connection">').text(gt('Connection')),
                                $('<div class="pass">').text(gt('Password'))
                            ),
                        $('<div class="values outgoing">')
                            .append(
                                $('<div class="server">'),
                                $('<div class="port">'),
                                $('<div class="username">'),
                                $('<div class="connection">'),
                                $('<div class="pass">')
                            )
                    )
            );
        },

        getMailConfig: function () {
            var self = this;
            getAccountData().then(function (data) {
                self.mailConfig.set(data);
            });
        },

        updateMailConfig: function () {
            this.$('.values.incoming').empty()
                .append(
                    $('<div class="server">').text(this.mailConfig.get('mail_server')),
                    $('<div class="port">').text(this.mailConfig.get('mail_port')),
                    $('<div class="username">').text(this.mailConfig.get('login')),
                    $('<div class="connection">').text(this.mailConfig.get('mail_secure') ? 'SSL/TLS' : ''),
                    $('<div class="pass">').text(gt('Your account password'))
                );
            this.$('.values.outgoing').empty()
            .append(
                $('<div class="server">').text(this.mailConfig.get('transport_server')),
                $('<div class="port">').text(this.mailConfig.get('transport_port')),
                $('<div class="username">').text(this.mailConfig.get('login')),
                $('<div class="connection">').text(this.mailConfig.get('transport_secure') ? 'SSL/TLS' : ''),
                $('<div class="pass">').text(gt('Your account password'))
            );
        },

        onToggle: function (e) {
            $(e.currentTarget).find('i.fa').toggleClass('fa-chevron-right fa-chevron-down').end()
                .attr('aria-expanded', function (i, v) { return v === 'false'; });
            this.$('.manual-container').toggle();
        }
    });

    var SyncView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function (options) {
            this.config = options.config;
            this.description = options.description;
            this.listenTo(this.config, 'change', this.renderManualConfig);
        },

        events: {
            'click .manual-toggle': 'onToggle'
        },

        render: function () {
            var needsDescription = !!this.description;

            if (needsDescription) {
                this.$el.append(
                    $('<div class="description">')
                        .append(
                            $('<p class="info">').text(this.description)
                        )
                );
            }
            this.$el.append(
                //$('<a href="#" role="button" class="manual-toggle" aria-expanded="false">').text(gt('Show manual configuration options')),
                $('<div class="manual-container">').toggle(needsDescription)
            );
            this.renderManualConfig();
            return this;
        },

        renderManualConfig: function () {
            this.$('.manual-container').empty().append(
                $('<pre class="manual-config">').append(
                    $('<div class="title">')
                    .append(
                        $('<div class="url">').text(gt('URL')),
                        $('<div class="login">').text(gt('Login')),
                        $('<div class="pass">').text(gt('Password'))
                    ),
                    $('<div class="values">')
                    .append(
                        $('<div class="url">').text(this.config.get('url')),
                        $('<div class="login">').text(this.config.get('login')),
                        $('<div class="pass">').text(gt('Your account password'))
                    )
                )
            );
        },

        onToggle: function (e) {
            $(e.currentTarget).find('i.fa').toggleClass('fa-chevron-right fa-chevron-down').end()
                .attr('aria-expanded', function (i, v) { return v === 'false'; });
            this.$('.manual-container').toggle();
        }
    });

    var PlatformView = DisposableView.extend({

        tagName: 'div',
        className: 'content-container',

        initialize: function () {
            this.listView = new ListView({ collection: util.platformList, model: this.model });
        },

        render: function () {
            this.$el.append(
                $('<div class="description">')
                .append(
                    //#. variable %1$s is the name of the product, e.g. App Suite
                    $('<p class="info">').text(gt('This wizard helps you to use %1$s on other devices.', ox.serverConfig.productName)),
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
            this.listView = new ListView({ collection: util.appList, model: this.model });
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
                    return self.model.get('platform') === undefined || self.model.get('platform') === model.get('platform') && capabilities.has(model.get('cap'));
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

        events: {
            'click [data-action="reset"]': 'onReset'
        },
        onReset: function () {
            this.wizard.trigger('reset');
        },
        initialize: function (connectTour) {
            this.wizard = connectTour;
            this.model = connectTour.model;
            this.listenTo(this.model, 'change', this.render);
        },
        render: function () {
            var platform = this.model.get('platform'),
                app = this.model.get('app'),
                platformTitle = platform ? util.titles[platform].title : undefined,
                appTitle = app ? util.titles[platform][app] : undefined;
            var $steps = $('<ul class="progress-steps">'),
                stepOneLabel;
            if (_.device('smartphone')) {
                stepOneLabel = appTitle ? appTitle : gt('App');
            } else {
                stepOneLabel = platformTitle ? platformTitle : gt('Platform');
            }

            $steps.append($('<li class="progress-step-one">')
                .append(
                    $('<button type="button" class="btn progress-btn" data-action="reset">')
                    .prop('disabled', true)
                    .append(
                        $('<span>').text('1'),
                        $('<span class="sr-only">').text(stepOneLabel)
                    )
                )
                .addClass((!platform || _.device('smartphone')) && !app ? 'active' : '')
                .append($('<span class="progress-description aria-hidden="true">').text(stepOneLabel))
            );
            if (!_.device('smartphone')) {
                $steps.append($('<li class="progress-step-two">')
                    .append(
                        $('<button type="button" class="btn progress-btn" data-action="back">')
                        .prop('disabled', true)
                        .append(
                            $('<span>').text('2'),
                            $('<span class="sr-only">').text(appTitle ? appTitle : gt('App'))
                        )
                    )
                    .addClass(platform && !app ? 'active' : '')
                    .append($('<span class="progress-description" aria-hidden="true">').text(appTitle ? appTitle : gt('App')))
                );
            }
            $steps.append($('<li class="progress-step-three">')
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
            );
            this.$el.empty().append($steps);
            if (_.device('smartphone')) {
                $('.progress-step-one .btn').prop(app ? { 'disabled': false } : '');
            } else {
                $('.progress-step-one .btn').prop(platform ? { 'disabled': false } : '');
                $('.progress-step-two .btn').prop(app ? { 'disabled': false } : '');
            }
            return this;
        }
    });

    return {
        DownloadQrView: DownloadQrView,
        DownloadConfigView: DownloadConfigView,
        DownloadView: DownloadView,
        MobileDownloadView: MobileDownloadView,
        SyncView: SyncView,
        MailSyncView: MailSyncView,
        PlatformView: PlatformView,
        AppView: AppView,
        ProgressionView: ProgressionView
    };
});
