define('plugins/portal/upselldemo/register',
    ['io.ox/core/extensions',
     'io.ox/core/upsell',
     'io.ox/core/capabilities',
     'plugins/combinedDemo/driveAdvert/main',
     'plugins/upsell/bubbles/main',
     'io.ox/core/notifications',
     'less!plugins/portal/upselldemo/style.less'], function (ext, upsell, capabilities, driveAds, bubbles, notifications) {

    'use strict';
    var modules = {
            'Launchpad': {'app': 'io.ox/launchpad', 'cap': 'launchpad'},
            'Mail': {'app': 'io.ox/mail', 'cap': 'webmail'},
            'Addressbook': {'app': 'io.ox/contacts', 'cap': 'contacts'},
            'Calendar': {'app': 'io.ox/calendar', 'cap': 'calendar'},
            'Tasks': {'app': 'io.ox/tasks', 'cap': 'tasks'},
            'Drive': {'app': 'io.ox/files', 'cap': 'infostore'}
        },

        locking = function (content, baton) {
            content.append(
                $('<h2>').text('Upsell demo panel'),
                $('<p>').text('This demo panel was designed for demonstration purposes only'),
                $('<p>').text('With this you can selectively turn various apps into a number of states. This includes show/hide and lock/unlock.'),
                $('<div class="io-ox-upsell-lock">').append(
                    $('<span class="left-col">').text('Portal'),
                    $('<a href="#" class="btn disabled">Don\'t switch this off</a>')
                )
            );
            _(_(modules).keys().sort()).each(function (modname) {
                var cap = modules[modname].cap;
                content.append(
                    $('<div class="io-ox-upsell-lock">').append(
                        $('<span class="left-col">').text(modname),
                        $('<div class="btn-group" data-toggle="buttons-radio">').append(
                            $('<button class="btn">').text('Show').data({'module': modname, 'action': 'show', 'capa': cap}).addClass(!(baton.upselldemo.hidden[cap] || baton.upselldemo.hidden[cap]) ? 'active' : ''),
                            $('<button class="btn">').text('Lock').data({'module': modname, 'action': 'lock', 'capa': cap}).addClass(baton.upselldemo.locked[cap] ? 'active' : ''),
                            $('<button class="btn">').text('Hide').data({'module': modname, 'action': 'hide', 'capa': cap}).addClass(baton.upselldemo.hidden[cap] && !baton.upselldemo.locked[cap] ? 'active' : '')
                        )
                    )
                );
            });
            content.append(
                $('<p>'),
                $('<span class="left-col">'),
                $('<button class="btn btn-primary" id="io-ox-combinedSales-apply">').text('Apply'),
                $('<p>'),
                $('<p>').text('Note that locked apps will be shown with the default lock icon. If clicked on, an upsell wizard will be triggered that lets you unlock it.')
            );
            content.on('click', '#io-ox-combinedSales-apply', function () {
                var buttons = $('.io-ox-upsell-lock button.active'),
                    caps = [],
                    locks = [],
                    target = window.location.href;
                baton.upselldemo.hidden = {};
                baton.upselldemo.locked = {};

                _(buttons).each(function (elem) {
                    var button = $(elem),
                        action = button.data('action'),
                        cap = button.data('capa');
                    if (action === 'lock') {
                        locks.push(cap);
                        caps.push('-' + cap);
                        baton.upselldemo.locked[cap] = true;
                    } else if (action === 'hide') {
                        caps.push('-' + cap);
                        baton.upselldemo.hidden[cap] = true;
                    }
                });

                //TODO: Loses other capabilities (e.g. upsell) this way!
                target = target.replace(/[\?&]cap=.+?(&?)/, '$1').replace(/[\?&]lock=.+?(&?)/, '$1');
                if (caps.length > 0) {
                    target += '&cap=' + caps.join();
                }
                if (locks.length > 0) {
                    target += '&lock=' + locks.join();
                }
                window.location = target;
                location.reload();
            });
        },

        enableAds = function (content, baton) {
            bubbles.startBubbling();
            content.append(
                $('<h2>').text('Bubbles'),
                $('<p>').text('The process to show upsell bubbles in regular intervals has already been started but they take a while to show up.'),
                $('<a>').text('Click here to start one now to see what they look like.').on('click', function () { bubbles.showBubble(); }),
                $('<h2>').text('Drive adverts'),
                $('<p>').text('Drive uses file or web storage. Enable an ad that will start the upsell wizard to promote selling more space.'),
                $('<a>').text('Enable adverts for Drive').on('click', function () {
                    if (!!baton.upselldemo.driveExtended) {
                        notifications.yell('error', 'Already enabled ads for drive.');
                    } else {
                        notifications.yell('success', 'Enabled ads for drive.');
                        driveAds.extendDrive();
                        baton.upselldemo.driveExtended = true;
                    }
                }),
                $('<h2>').text('Mail adverts'),
                $('<a>').text('Enable adverts for mail').on('click', function () {
                    if (!!baton.upselldemo.mailExtended) {
                        notifications.yell('error', 'Already enabled ads for mail.');
                    } else {
                        require(['plugins/combinedDemo/mailAdvert/register'], function () {
                            notifications.yell('success', 'Enabled ads for mail.');
                            baton.upselldemo.mailExtended = true;
                        });
                    }
                })
            );
        };


    ext.point('io.ox/portal/widget/upselldemo').extend({
        title: 'Demo widget',

        initialize: function (baton) {
            baton.upselldemo = { 'hidden': {}, 'locked': {}, 'driveExtended': false, 'mailExtended': false};

            _(_(modules).values()).each(function (mod) {
                var launchers = $('.launcher[data-app-name="' + mod.app + '"]');
                launchers.addClass('upsell');
                launchers.find('a').prepend(
                    $('<i class="icon-lock">').hide()
                );

                baton.upselldemo.hidden[mod.cap] = !capabilities.has(mod.cap);
            });
            if (_.url.hash('cap')) {
                _(_(_.url.hash('cap').replace('%2C', ',').split(/,/)).compact()).each(function (cap) {
                    if (cap.indexOf('-') === 0) {
                        baton.upselldemo.hidden[cap] = true;
                    }
                });
            }
            if (_.url.hash('lock')) {
                _(_(_.url.hash('lock').replace('%2C', ',').split(/,/)).compact()).each(function (cap) {
                    baton.upselldemo.locked[cap] = true;
                    upsell.setEnabled(cap);
                });
            }
        },

        preview: function (baton) {
            var content = $('<div class="content pointer">').append(
                $('<ul>').append(
                    $('<li class="pointer">').text('Upsell demo panel').data('target', 'upsell-locking'),
                    $('<li class="pointer">').text('Enable advertisements')
                )
            );
            this.append(content);
            content.on('click', 'li.pointer', function (event) {
                baton.data.upsellTarget = $(event.target).data('target');
            });
            /* TODO: Disable clicking anywhere else */
        },

        draw: function (baton) {
            var upsellTarget = baton.data.upsellTarget,
                content = $('<div class="combinedSales">');

            if (upsellTarget === 'upsell-locking') {
                locking(content, baton);
            } else {
                enableAds(content, baton);
            }

            this.append(content);
        }
    });

    ext.point('io.ox/portal/widget/upselldemo/settings').extend({
        title: 'Upsell demo widget',
        type: 'upselldemo',
        unique: true
    });
});