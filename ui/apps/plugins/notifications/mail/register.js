/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('plugins/notifications/mail/register', [
    'io.ox/mail/api',
    'io.ox/core/extensions',
    'gettext!plugins/notifications',
    'io.ox/mail/util',
    'io.ox/core/folder/api',
    'io.ox/core/api/account',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views',
    'io.ox/core/desktopNotifications',
    'io.ox/contacts/api',
    'settings!io.ox/mail'
], function (api, ext, gt, util, folderApi, account, cap, miniViews, desktopNotifications, contactsApi, settings) {

    'use strict';

    var lastCount = -1,
        SOUND_VOLUME = 0.3, // volume of push notification sound
        DURATION = 10 * 1000, // miliseconds to show the notification
        path = ox.base + '/apps/themes/default/sounds/', // soundfiles are located in the theme
        iconPath = ox.base + '/apps/themes/default/fallback-image-contact.png', // fallbackicon shown in desktop notification
        sound,
        type = _.device('!windows && !macos && !ios && !android') ? '.ogg' : '.mp3', // linux frickel uses ogg
        settingsModel = settings;

    function filter(model) {
        // ignore virtual/all (used by search, for example) and unsubscribed folders
        if (!model.get('subscribed') || (/^default0\/virtual/.test(model.id))) return false;
        return /^default0\D/.test(model.id) && !account.is('spam|trash|unseen', model.id) && (folderApi.getSection(model.get('type')) === 'private');
    }

    function fieldset(text) {
        var args = _(arguments).toArray();
        return $('<fieldset>').append($('<legend class="sectiontitle">').append($('<h2>').text(text))).append(args.slice(1));
    }

    function checkbox(text) {
        var args = _(arguments).toArray();
        return $('<div class="checkbox">').append(
            $('<label class="control-label">').text(text).prepend(args.slice(1))
        );
    }

    // load a soundfile
    function loadSound(sound) {
        var d = $.Deferred();
        sound = new Audio(path + sound + type);
        sound.volume = SOUND_VOLUME;
        sound.addEventListener('canplaythrough', function () {
            d.resolve(sound);
        });
        return d;
    }

    // show desktopNotification (if enabled) for a new mail
    function newMailDesktopNotification(message) {

        // some mailservers do not send extra data like sender and subject, check this here
        var text = message.subject || gt('No subject');
        // get email for picture halo
        var imageURL = message.email ? contactsApi.pictureHalo(null, {
            email: message.email }, { urlOnly: true, width: 192, height: 192, scaleType: 'containforcedimension' }) : iconPath;

        // check if user has an image, otherwise use fallback image
        $(new Image()).one('load error', function (e) {
            if (this.width === 1 || e.type === 'error') {
                // use fallback image
                imageURL = iconPath;
            }
            desktopNotifications.show({
                title: message.displayname || message.email || gt('New mail'),
                body: text,
                icon: imageURL,
                duration: DURATION,
                forceDisplay: true,
                onclick: function () {
                    window.focus();
                    ox.launch('io.ox/mail/main');
                }
            });
        }).attr('src', imageURL);
    }

    // ensure we do not play a sound twice until the first sound has finished
    var playSound = _.throttle(function () {
        sound.play();
    }, 2000);

    settingsModel.on('change:notificationSoundName', function () {
        var s = settingsModel.get('notificationSoundName');
        loadSound(s).done(function (s) {
            // preview the selected sound by playing it on change
            s.play();
            sound = s;
        });
        settingsModel.saveAndYell();
    });

    console.log('Notification sounds enabled, see mail settings.');
    // get and load stored sound
    loadSound(settingsModel.get('notificationSoundName')).done(function (s) {
        sound = s;
    });

    ext.point('io.ox/mail/settings/detail/pane').extend({
        index: 490,
        id: 'sounds',
        draw: function () {
            // use this array to customize the sounds
            // copy new/other sounds to themefolder->sounds
            var sounds, list = [
                { label: gt('Bell'), value: 'bell' },
                { label: gt('Marimba'), value: 'marimba' },
                { label: gt('Wood'), value: 'wood' },
                { label: gt('Chimes'), value: 'chimes' }
                ];

            this.append(fieldset(
                    //#. Should be "töne" in german, used for notification sounds. Not "geräusch"
                    gt('Notification sounds'),
                    checkbox(
                        gt('Play sound on incoming mail'),
                        new miniViews.CheckboxView({ name: 'playSound', model: settings }).render().$el
                    ),
                    $('<div class="col-xs-12 col-md-6">').append(
                        $('<div class="row">').append(
                            $('<label>').attr({ 'for': 'notificationSoundName' }).text(gt('Sound')),
                            sounds = new miniViews.SelectView({ list: list, name: 'notificationSoundName', model: settingsModel, id: 'notificationSoundName', className: 'form-control' }).render().$el

                        )
                    )
                )
            );

            // toggle soundselection on overall settings
            $(sounds).prop('disabled', !settings.get('playSound'));

            settings.on('change:playSound', function () {
                $(sounds).prop('disabled', !settings.get('playSound'));
            });
        }
    });

    var update = _.debounce(function () {

        var app = ox.ui.apps.get('io.ox/mail') || ox.ui.apps.get('io.ox/mail/placeholder');
        if (!app) return;

        // get relevant folder models and sum up unread messages
        var count = _(folderApi.pool.models)
            .chain()
            .filter(filter)
            .reduce(function (sum, model) {
                return sum + (model && model.get('unread')) || 0;
            }, 0)
            .value();

        if (count !== lastCount) {
            api.trigger('all-unseen', count);
            lastCount = count;
        }

        // don't let the badge grow infinite
        if (count > 99) count = '99+';

        //#. %1$d number of notifications
        app.setCounter(count, { arialabel: gt('%1$d unread mails', count) });

    }, 100);

    // add a badge to mailapp in the topbar
    ext.point('io.ox/core/notifications/badge').extend({
        id: 'mail',
        index: 100,
        register: function () {
            folderApi.on('change:unread', update);
            folderApi.on('pool:add', update);
            update();
        }
    });

    var ids = new Backbone.Collection();

    // new mail title and desktop notifications
    // removes mails of a whole folder from notificationview
    function removeFolder(folder) {
        var mails = _.compact(_(ids.models).map(function (item) {
            if (item.attributes.folder_id === folder) {
                return item.attributes.id;
            }
        }));
        if (mails.length > 0) {
            ids.remove(mails);
        }
    }
    function checkNew(items) {
        var newIds = _(items).map(function (item) {
                return item.folder_id + '.' + item.id;
            }),
            oldIds = _(ids.models).map(function (model) {
                return model.get('folder_id') + '.' + model.get('id');
            }),
            newItems = _.difference(newIds, oldIds);

        // only show these if there is not already the websocket push listening
        if (newItems.length && !cap.has('websocket')) {
            // if theres multiple items or no specific notification given, use the generic
            if (newItems.length > 1) {
                desktopNotifications.show({
                    title: gt('New mails'),
                    body: gt('You have new mail'),
                    icon: iconPath
                });
            } else {
                api.get(_.extend({}, _.cid(newItems[0]), { unseen: true })).then(function (data) {
                    var from = data.from || [['', '']],
                                  //#. %1$s mail sender
                                  //#. %2$s mail subject
                                  //#, c-format
                        message = gt('Mail from %1$s, %2$s', _.noI18n(util.getDisplayName(from[0])), _.noI18n(data.subject) || gt('No subject'));
                    desktopNotifications.show({
                        title: gt('New mail'),
                        body: message,
                        icon: iconPath
                    });
                });
            }

        }
    }

    // special add function to consider mails that might have been read elsewhere (didn't throw update:set-seen in appsuite)
    api.on('new-mail', function (e, recent, unseen) {
        var whitelist = _(unseen).map(function (item) { return item.id; }),
            collectionIds = _(ids.models).map(function (item) { return item.attributes.id; }),
            idsToRemove = _.difference(collectionIds, whitelist);

        if (idsToRemove.length > 0) {
            ids.remove(idsToRemove);
        }

        checkNew(recent);
        ids.add(recent);

        if (ids.models.length === 0) {
            api.newMailTitle(false);
        }
    });

    api.on('deleted-mails update:set-seen', function (e, param) {
        if (_.isArray(param)) {
            ids.remove(param);
        } else {
            removeFolder(param);
        }

        if (ids.length === 0) {
            api.newMailTitle(false);
        }
    });

    api.checkInbox();

    // play sound and/or show notification on new mail
    ox.on('socket:mail:new', function (message) {
        // update counters
        update();
        // play sound
        if (settings.get('playSound')) playSound();
        // show notification
        newMailDesktopNotification(message);
    });

    return true;
});
