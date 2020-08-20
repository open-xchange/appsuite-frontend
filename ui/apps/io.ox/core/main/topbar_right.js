/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/topbar_right', [
    'io.ox/core/session',
    'io.ox/core/http',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views/helplink',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/upsell',
    'io.ox/core/main/logout',
    'io.ox/core/main/refresh',
    'io.ox/core/main/addLauncher',
    'io.ox/contacts/api',
    'io.ox/core/api/user',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (session, http, ext, capabilities, notifications, HelpLinkView, Dropdown, UpsellView, logout, refresh, addLauncher, contactAPI, userAPI, settings, gt) {

    function getHelp() {
        var currentApp = ox.ui.App.getCurrentFloatingApp() || ox.ui.App.getCurrentApp();

        if (currentApp && currentApp.getContextualHelp) return currentApp.getContextualHelp();

        return _.extend({
            base: 'help',
            target: 'index.html'
        }, currentApp && currentApp.get('help'));
    }

    var extensions = {

        about: function () {
            this.link('about', gt('About'), function (e) {
                e.preventDefault();
                require(['io.ox/core/about/about'], function (about) {
                    about.show();
                });
            });
        },

        onboarding: function () {
            var device, $link, self = this;
            if (_.device('android')) device = _.device('smartphone') ? 'android.phone' : 'android.tablet';
            if (_.device('ios')) device = _.device('smartphone') ? 'apple.iphone' : 'apple.ipad';

            self.append(
                $link = $('<a href="#" data-app-name="io.ox/settings" data-action="client-onboarding" role="menuitem" tabindex="-1">')
                    //#. starts the client onboarding wizard that helps users
                    //#. to configure their devices to access/sync appsuites
                    //#. data (f.e. install ox mail app)
                    .text(_.device('desktop') ? gt('Connect your Device') : gt('Connect this Device'))
            );

            require(['io.ox/onboarding/clients/api'], function (onboardingAPI) {

                onboardingAPI.enabledDevices(device).then(function (config) {
                    var enabled = _.device('desktop') ? true : (config[device] || false);

                    $link.toggleClass('disabled ui-disabled', !enabled)
                        .attr('aria-disabled', !enabled)
                        .on('click', function (e) {
                            e.preventDefault();
                            if (!enabled) return e.stopPropagation();
                            require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                                wizard.run();
                            });
                        });
                });
            });
        }
    };

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'upsell',
        index: 50,
        draw: function () {
            if (_.device('smartphone')) return;

            var view = new UpsellView({
                tagName: 'li',
                className: 'launcher',
                attributes: { role: 'presentation' },
                id: 'secondary-launcher',
                requires: 'active_sync || caldav || carddav',
                customize: function () {
                    $('i', this.$el).addClass('launcher-icon');
                }
            });

            if (view.visible) this.append(view.render().$el);
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'theme',
        index: 90,
        draw: function () {
            if (_.device('smartphone')) return;
            var ul = $('<ul id="topbar-background-dropdown" class="dropdown-menu dropdown-menu-right" role="menu">'),
                a = $('<a href="#" class="dropdown-toggle f6-target" data-toggle="dropdown" tabindex="-1">')
                    .attr('aria-label', gt('Select background'))
                    .append('<i class="fa fa-paint-brush launcher-icon" aria-hidden="true">'),
                dropdown = new Dropdown({
                    // have a simple model to track changes (e.g. availability)
                    model: new Backbone.Model({}),
                    attributes: { role: 'presentation' },
                    tagName: 'li',
                    id: 'io-ox-topbar-dropdown-icon',
                    className: 'launcher dropdown',
                    $ul: ul,
                    $toggle: a
                });
            ext.point('io.ox/core/appcontrol/right/backgrounds').invoke('extend', dropdown);
            this.append(dropdown.render().$el.find('a').attr('tabindex', -1).end());
        }
    });

    ext.point('io.ox/core/appcontrol/right/backgrounds').extend({
        id: 'list',
        index: 100,
        extend: function () {

            this.link('background2', 'No background image', handler.bind(null, 0))
                .divider()
                .link('background1', 'Sunset', handler.bind(null, 1))
                .link('background2', 'Mountains', handler.bind(null, 2))
                .link('background3', 'Ocean', handler.bind(null, 3))
                .link('background4', 'Gradient', handler.bind(null, 4))
                .link('background5', 'Green', handler.bind(null, 5))
                .link('background6', 'City', handler.bind(null, 6));

            function handler(n, e) {
                e.preventDefault();
                select(n);
            }

            function select(n) {
                $('#io-ox-core').removeClass('img0 img1 img2 img3 img4 img5 img6 background');
                $('#io-ox-core').addClass('background img' + (n || 0));
                _.setCookie('background', n);
            }

            select(_.getCookie('background'));
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'notifications',
        index: 100,
        draw: function () {
            // disable notifications if there is no capability of the following (e.g. drive as only app)
            if (!capabilities.has('webmail') && !capabilities.has('calendar') && !capabilities.has('tasks')) return;

            var self = this, DELAY = 5000;

            if (ox.online) {
                // we don't need this right from the start,
                // so let's delay this for responsiveness!
                // only requests are delayed by 5s, the badge is drawn normally
                self.append(notifications.attach(DELAY));
            } else {
                //lets wait till we are online
                ox.once('connection:online', function () {
                    self.append(notifications.attach(DELAY));
                });
            }
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'refresh-mobile',
        index: 200,
        draw: function () {
            if (_.device('smartphone')) return;

            var node = $('<i class="fa fa-refresh launcher-icon" aria-hidden="true">');

            this.append(
                addLauncher(
                    'right',
                    node,
                    function () {
                        refresh();
                        return $.when();
                    },
                    gt('Refresh')
                ).attr('id', 'io-ox-refresh-icon').addClass('hidden')
            );

            function setLabel() {
                var minutes = parseInt(settings.get('refreshInterval', 300000), 10) / 60000;
                return node.attr('title', gt('Refresh. Current interval (%1$s min) can be customized in settings.', minutes));
            }

            setLabel();
            settings.on('change:refreshInterval', setLabel);
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'help-dropdown',
        index: 300,
        draw: function () {
            if (_.device('smartphone')) return;

            // single item (no dropdown)
            if (ext.point('io.ox/core/appcontrol/right/help').list().length <= 1) {
                var helpView = new HelpLinkView({
                    iconClass: 'fa-question launcher-icon',
                    href: getHelp
                });
                if (helpView.$el.hasClass('hidden')) return;
                return this.append(
                    addLauncher('right', helpView.render().$el.attr('tabindex', -1)).attr('id', 'io-ox-context-help-icon')
                );
            }

            // multiple items
            var ul = $('<ul id="topbar-help-dropdown" class="dropdown-menu dropdown-menu-right" role="menu">'),
                a = $('<a href="#" class="dropdown-toggle f6-target" data-toggle="dropdown" tabindex="-1">')
                    .attr('aria-label', gt('Help'))
                    .append('<i class="fa fa-question launcher-icon" aria-hidden="true">'),
                dropdown = new Dropdown({
                    // have a simple model to track changes (e.g. availability)
                    model: new Backbone.Model({}),
                    attributes: { role: 'presentation' },
                    tagName: 'li',
                    id: 'io-ox-topbar-help-dropdown-icon',
                    className: 'launcher dropdown',
                    $ul: ul,
                    $toggle: a
                });

            ext.point('io.ox/core/appcontrol/right/help').invoke('extend', dropdown);
            this.append(dropdown.render().$el.find('a').attr('tabindex', -1).end());
        }
    });

    ext.point('io.ox/core/appcontrol/right/help').extend({
        id: 'help',
        index: 100,
        extend: function () {
            var helpView = new HelpLinkView({
                attributes: {
                    role: 'menuitem',
                    tabindex: -1
                },
                //TODO-617: Label (actually context help)
                content: gt('Help'),
                href: getHelp
            });

            // in case of disabled 'showHelpLinks' feature
            if (helpView.$el.hasClass('hidden')) return;

            this.append(helpView.render().$el);
        }
    });

    // 'feedback' index 150

    ext.point('io.ox/core/appcontrol/right/help').extend({
        id: 'divider-first',
        index: 200,
        extend: function () {
            this.divider();
        }
    });

    // 'intro-tour'  index 210
    // 'get-started' index 250

    ext.point('io.ox/core/appcontrol/right/help').extend({
        id: 'divider-second',
        index: 300,
        extend: function () {
            this.divider();
        }
    });

    ext.point('io.ox/core/appcontrol/right/help').extend({
        id: 'about',
        index: 400,
        extend: function () {
            extensions.about.apply(this, arguments);
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'settings-dropdown',
        index: 400,
        draw: function () {
            if (_.device('smartphone')) return;

            // single item (no dropdown)
            if (ext.point('io.ox/core/appcontrol/right/settings').list().length <= 1) {
                return this.append(
                    addLauncher('right', $('<i class="fa fa-cog launcher-icon" aria-hidden="true">').attr('title', gt('Settings')), function () {
                        ox.launch('io.ox/settings/main');
                    }, gt('Settings'))
                    .attr('id', 'io-ox-settings-topbar-icon')
                );
            }

            // multiple items
            var ul = $('<ul id="topbar-settings-dropdown" class="dropdown-menu dropdown-menu-right" role="menu">'),
                a = $('<a href="#" class="dropdown-toggle f6-target" data-toggle="dropdown" tabindex="-1">')
                    .attr('aria-label', gt('Settings'))
                    .append('<i class="fa fa-cog launcher-icon" aria-hidden="true">'),
                dropdown = new Dropdown({
                    // have a simple model to track changes (e.g. availability)
                    model: new Backbone.Model({}),
                    attributes: { role: 'presentation' },
                    tagName: 'li',
                    id: 'io-ox-topbar-settings-dropdown-icon',
                    className: 'launcher dropdown',
                    $ul: ul,
                    $toggle: a
                });

            ext.point('io.ox/core/appcontrol/right/settings').invoke('extend', dropdown);
            this.append(dropdown.render().$el.find('a').attr('tabindex', -1).end());
        }
    });

    ext.point('io.ox/core/appcontrol/right/settings').extend({
        id: 'settings',
        index: 100,
        extend: function () {
            if (_.device('smartphone')) return;

            this.link('settings-app', gt('Settings'), function (e) {
                e.preventDefault();
                return ox.launch('io.ox/settings/main');
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right/settings').extend({
        id: 'onboarding',
        index: 200,
        extend: function () {
            if (_.device('smartphone') || settings.get('onboardingWizard')) return;
            extensions.onboarding.apply(this, arguments);
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'user',
        index: 5,
        extend: function () {

            if (settings.get('user/internalUserEdit', true) === false) return;
            if (capabilities.has('guest')) return;

            var type = settings.get('user/hidedomainpart', false) ? 'email-localpart' : 'email',
                container, node;

            container = $('<li class="user">').append(
                $('<a href="#" data-name="user-picture" class="action" tabindex="-1">')
                .attr('aria-label', gt('Change user photo'))
                .append(
                    node = $('<div class="user-picture-container" aria-hidden="true">'),
                    $('<div class="text-container">').append(
                        $('<div class="name">').append(userAPI.getTextNode(ox.user_id, { type: 'name' })),
                        $('<div class="mail">').append(userAPI.getTextNode(ox.user_id, { type: type }))
                    )
                )
            );

            container.on('click', '.action', function (e) {
                e.preventDefault();
                require(['io.ox/core/settings/user'], function (user) {
                    user.openEditPicture();
                });
            });

            updatePicture();
            // via global address book
            contactAPI.on('reset:image update:image', updatePicture);
            // via my contact data
            userAPI.on('reset:image:' + ox.user_id + ' update:image:' + ox.user_id, updatePicture);
            userAPI.on('update', updatePicture);

            function updatePicture() {
                node.empty().append(
                    contactAPI.pictureHalo(
                        $('<div class="user-picture" aria-hidden="true">')
                        .append(
                            $('<span class="initials">').append(
                                userAPI.getTextNode(ox.user_id, { type: 'initials' })
                            ),
                            $('<i class="fa fa-camera-retro" aria-hidden="true">')
                        ),
                        { internal_userid: ox.user_id },
                        { width: 40, height: 40, fallback: false }
                    )
                );
            }

            this.$ul.append(container);
            this.divider();
        }
    });

    // 'availability' index 50

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'upsell',
        index: 50,
        extend: function () {

            var view = new UpsellView({
                tagName: 'li',
                id: 'topbar-dropdown',
                attributes: { 'role': 'presentation' },
                requires: 'active_sync || caldav || carddav',
                title: gt('Upgrade your account'),
                customize: function () {
                    $('i', this.$el).css({ 'width': 'auto' });
                }
            });

            if (!view.visible) return;
            this.$ul.append(view.render().$el);
            this.divider();
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'refresh-mobile',
        index: 80,
        extend: function () {
            if (!_.device('smartphone')) return;
            this.link('refresh-mobile', gt('Refresh'), function (e) {
                e.preventDefault();
                refresh();
                return $.when();
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'settings-mobile',
        index: 90,
        extend: function () {
            if (!_.device('smartphone')) return;
            this.link('settings-mobile', gt('Settings'), function (e) {
                e.preventDefault();
                return ox.launch('io.ox/settings/main');
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'onboarding-mobile',
        index: 120,
        enable: capabilities.has('client-onboarding'),
        extend: function () {
            if (!_.device('smartphone') || settings.get('onboardingWizard')) return;
            extensions.onboarding.apply(this, arguments);
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'change-user-data',
        index: 150,
        extend: function () {
            // check if users can edit their own data (see bug 34617)
            if (settings.get('user/internalUserEdit', true) === false) return;

            this.link('my-contact-data', gt('Edit personal data'), function (e) {
                e.preventDefault();
                require(['io.ox/core/settings/user'], function (userSettings) {
                    userSettings.openModalDialog();
                });
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'change-user-password',
        index: 175,
        extend: function () {

            if (!capabilities.has('edit_password && guest')) return;

            this.link('change-password',
                settings.get('password/emptyCurrent') ? gt('Add login password') : gt('Change login password'),
                function (e) {
                    e.preventDefault();
                    require(['plugins/portal/userSettings/register'], function (userSettings) {
                        userSettings.changePassword();
                    });
                });
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'app-specific-help-mobile',
        index: 200,
        extend: function () {
            if (!_.device('smartphone')) return;
            //replaced by module
            var helpView = new HelpLinkView({
                attributes: {
                    role: 'menuitem',
                    tabindex: -1
                },
                content: gt('Help'),
                href: getHelp
            });
            this.divider();
            if (helpView.$el.hasClass('hidden')) return;

            this.append(helpView.render().$el);
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'about-mobile',
        index: 400,
        extend: function () {
            if (!_.device('smartphone')) return;
            extensions.about.apply(this, arguments);
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'logout',
        index: 1000,
        extend: function () {
            //this.divider();
            // Group available signout calls here, including appsuite, Guard, etc
            ext.point('io.ox/core/appcontrol/right/account/signouts').invoke('extend', this);
        }
    });

    ext.point('io.ox/core/appcontrol/right/account/signouts').extend({
        id: 'logout',
        index: 100,
        extend: function () {
            this.link('logout', gt('Sign out'), function (e) {
                e.preventDefault();
                logout({ manualLogout: true });
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'account',
        index: 1000,
        draw: function () {
            var title = ox.openedInBrowserTab ?
                    gt('Sign out') :
                    //#. tooltip of dropdown menu in topbar (contact image icon)
                    gt('My account'),
                ul = $('<ul id="topbar-account-dropdown" class="dropdown-menu dropdown-menu-right" role="menu">'),
                a = $('<a href="#" class="dropdown-toggle f6-target" data-toggle="dropdown" tabindex="-1">').attr('aria-label', title),
                dropdown = new Dropdown({
                    // have a simple model to track changes (e.g. availability)
                    model: new Backbone.Model({}),
                    attributes: { role: 'presentation' },
                    tagName: 'li',
                    id: 'io-ox-topbar-account-dropdown-icon',
                    className: 'launcher dropdown',
                    $ul: ul,
                    $toggle: a
                });

            updatePicture();
            ext.point('io.ox/core/appcontrol/right/account').invoke('extend', dropdown);
            this.append(dropdown.render().$el.find('a').attr('tabindex', -1).end());

            // via global address book
            contactAPI.on('reset:image update:image', updatePicture);
            // via my contact data
            userAPI.on('reset:image:' + ox.user_id + ' update:image:' + ox.user_id, updatePicture);
            userAPI.on('update', updatePicture);

            function updatePicture() {
                a.empty().append(
                    contactAPI.pictureHalo(
                        $('<div class="contact-picture" aria-hidden="true">').attr('title', title)
                        .append(userAPI.getTextNode(ox.user_id, { type: 'initials' })),
                        { internal_userid: ox.user_id },
                        { width: 40, height: 40, fallback: false }
                    )
                );
            }
        }
    });

    var dedicatedLogoutButton = settings.get('features/dedicatedLogoutButton', false) === true && _.device('!small');
    if (dedicatedLogoutButton) {
        ext.point('io.ox/core/appcontrol/right').extend({
            id: 'logout-button',
            index: 2000,
            draw: function () {
                var logoutButton = addLauncher('right', $('<i class="fa fa-sign-out launcher-icon" aria-hidden="true">'), function () {
                    logout({ manualLogout: true });
                }, gt('Sign out'));
                logoutButton.find('a')
                .attr('data-action', 'sign-out')
                .tooltip({
                    title: gt('Sign out'),
                    placement: function (tip, el) {
                        return ($(window).width() - $(el).offset().left - el.offsetWidth) < 80 ? 'left' : 'auto';
                    }
                });
                this.append(logoutButton);
            }
        });
    }

    // TODO: APPCONTROL

    (function logoutHint() {

        var data = _.clone(settings.get('features/logoutButtonHint', {}));

        if (!data.enabled) return;

        ext.point('io.ox/core/appcontrol/right').extend({
            id: 'logout-button-hint',
            index: 2100,
            draw: function () {
                settings.set('features/logoutButtonHint/active', true).save();
                // exit: first start with enabled feature
                if (!_.isBoolean(data.active)) return;
                // exit: logged out successfully
                if (!data.active) return;
                // exit: tab reload with autologin
                if (_.device('reload') && session.isAutoLogin()) return;

                // topbar action, dropdown action
                var link = this.find('[data-action="sign-out"], #io-ox-topbar-account-dropdown-icon > a').first();
                // popover
                link.popover({
                    // language; not locale
                    content: data[ox.language] || gt('You forgot to sign out last time. Always use the sign-out button when you finished your work.'),
                    template: '<div class="popover popover-signout" role="tooltip"><div class="arrow"></div><div class="popover-content popover-content-signout"></div></div>',
                    placement: 'bottom',
                    container: 'body'
                });
                // prevent logout action when clicking hint
                this.get(0).addEventListener('click', function (e) {
                    if (e.target.classList.contains('popover-content-signout')) e.stopImmediatePropagation();
                    link.popover('destroy');
                }, true);
                // close on click
                $(document).one('click', link.popover.bind(link, 'destroy'));
                // show
                _.defer(link.popover.bind(link, 'show'));
            }
        });
    })();

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'client-onboarding-hint',
        index: 2200,
        draw: function () {
            if (capabilities.has('!client-onboarding')) return;
            if (!_.device('smartphone')) return;
            // exit: tab reload with autologin
            if (_.device('reload') && session.isAutoLogin()) return;

            var conf = _.extend({ enabled: true, remaining: 2 }, settings.get('features/clientOnboardingHint', {}));
            // server prop
            if (!conf.enabled || !conf.remaining) return;
            // banner action, topbar action, dropdown action
            var link = this.find('#io-ox-topbar-account-dropdown-icon > a');
            // popover
            link.popover({
                //#. %1$s is the product name
                //#, c-format
                content: gt("Did you know that you can take %1$s with you? Just click this icon and choose 'Connect your device' from the menu.", ox.serverConfig.productName),
                template: '<div class="popover popover-onboarding" role="tooltip"><div class="arrow"></div><div class="popover-content popover-content-onboarding"></div></div>',
                placement: 'bottom',
                container: 'body'
            });
            // show
            _.defer(link.popover.bind(link, 'show'));
            // close on any click
            document.body.addEventListener('click', close, true);
            function close() {
                settings.set('features/clientOnboardingHint/remaining', Math.max(0, conf.remaining - 1)).save();
                link.popover('destroy');
                document.body.removeEventListener('click', close, true);
            }
        }
    });

});
