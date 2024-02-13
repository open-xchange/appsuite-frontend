/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/upsell/simple-wizard/register', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'settings!io.ox/mail',
    'settings!plugins/upsell/simple-wizard',
    'gettext!plugins/upsell/simple-wizard'
], function (ext, upsell, mailSettings, settings, gt) {

    'use strict';

    /*
     * Used settings:
     * - url
     * - overlayOpacity
     * - overlayColor
     * - zeroPadding
     * - width
     * - height
     *
     * URL variables:
     * - $user
     * - $user_id
     * - $context_id
     * - $session
     * - $language
     * - $missing, $type, $id
     * - $hostname
     */

    var instance = null;

    var that = {

        getVariables: function (options) {
            options = options || {};
            return {
                context_id: ox.context_id,
                hostname: location.hostname,
                id: options.id || '',
                // missing
                imap_login: '',
                language: ox.language,
                mail: mailSettings.get('defaultaddress', ''),
                missing: options.missing || '',
                session: ox.session,
                type: options.type || '',
                user: ox.user,
                user_id: ox.user_id,
                // missing
                user_login: ''
            };
        },

        getURLTemplate: function () {
            console.warn('Deprecated. Just use "wizard.settings.url" directly');
            return that.settings.url;
        },

        // url is temporary. used when working with local copy of settings
        // see upsell:simple-wizard:init
        getURL: function (options, url) {

            var hash = that.getVariables(options);

            url = String(url || that.settings.url).replace(/\$(\w+)/g, function (all, key) {
                key = String(key).toLowerCase();
                return key in hash ? encodeURIComponent(hash[key]) : '$' + key;
            });

            return url;
        },

        getIFrame: function () {
            // add iframe but with blank file (to avoid delay)
            return $('<iframe src="blank.html" allowtransparency="true" border="0" frameborder="0" framespacing="0">');
        },

        addControls: function () {
            if (that.settings.closeButton === true) {
                this.addButton('cancel', gt('Close'));
            }
        },

        getPopup: function () {
            return instance;
        },

        setSrc: function (src) {
            if (instance) {
                instance.getContentNode().idle().find('iframe').attr('src', src);
            }
        },

        // allows client-side settings during development
        settings: _.extend({
            // defaults
            closeButton: true,
            zeroPadding: true,
            width: 750,
            height: 390,
            overlayOpacity: 0.5,
            overlayColor: '#000',
            url: 'blank.html?user=$user,user_id=$user_id,context_id=$context_id,' +
                'language=$language,type=$type,id=$id,missing=$missing,hostname=$hostname#session=$session'
        }, settings.get()),

        open: function (options) {

            if (instance) return;

            // allow custom context-sensitive settings (e.g. set via UI plugin)
            var settings = _.deepClone(that.settings);
            ox.trigger('upsell:simple-wizard:init', that.getVariables(options), settings);

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                instance = new dialogs.ModalDialog({ width: settings.width })
                    .build(function () {
                        if (settings.zeroPadding) {
                            this.getPopup().addClass('zero-padding');
                        }
                        this.getContentNode()
                        .busy()
                        .css({
                            maxHeight: settings.height + 'px',
                            overflow: 'hidden'
                        })
                        .append(
                            // add iframe but with blank file (to avoid delay)
                            that.getIFrame()
                            .css({
                                width: '100%',
                                height: settings.height + 'px'
                            })
                        );
                        that.addControls.call(this);
                    })
                    .setUnderlayStyle({
                        opacity: 0,
                        backgroundColor: settings.overlayColor
                    })
                    .topmost()
                    .on('beforeshow', function () {
                        ox.trigger('upsell:simple-wizard:show:before', this);
                    })
                    .on('show', function () {
                        ox.off('upsell:requires-upgrade', that.open);
                        this.setUnderlayStyle({ opacity: settings.overlayOpacity });
                        var self = this;
                        setTimeout(function () {
                            that.setSrc(that.getURL(options, settings.url));
                            ox.trigger('upsell:simple-wizard:show', self);
                        }, 250);
                    })
                    .on('close', function () {
                        ox.on('upsell:requires-upgrade', that.open);
                        ox.trigger('upsell:simple-wizard:close', this);
                        instance = null;
                    });
                instance.show();
            });
        },

        close: function () {
            if (instance) instance.close();
        },

        enable: function () {
            ox.on('upsell:requires-upgrade', that.open);
        },

        disable: function () {
            ox.off('upsell:requires-upgrade', that.open);
        }
    };

    // register for event
    that.enable();
    // DEBUGGING; useful during development
    // upsell.demo(true);
    return that;
});
