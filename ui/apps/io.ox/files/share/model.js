/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/model', [
    'io.ox/participants/model'
], function (pModel) {

    'use strict';

    var ShareModel = Backbone.Model.extend({

        TYPES: {
            MAIL: 'mail',
            LINK: 'link'
        },

        // valid 'expire' values
        // 0: gt('one day'),
        // 1: gt('one week'),
        // 2: gt('one month'),
        // 3: gt('three months'),
        // 4: gt('six months'),
        // 5: gt('one year')

        defaults: function () {
            return {
                files: [],
                type: this.TYPES.MAIL,
                recipients: [],
                message: '',
                edit: false,
                secured: false,
                password: '',
                temporary: false,
                expires: 2,
                link: ''
            };
        },

        generateLink: function () {
            return $.Deferred().resolve('https://appsuite.open-xchange.com/share?secret=1234');
        },

        getRecipients: function () {
            if (this._recipients) {
                return this._recipients;
            }
            var self = this,
                resetListUpdate = false,
                changeRecipientsUpdate = false,
                recipients = this._recipients = new pModel.Participants(this.get('recipients'));

            recipients.invoke('fetch');

            function resetList() {
                if (changeRecipientsUpdate) {
                    return;
                }
                resetListUpdate = true;
                self.set('recipients', recipients.toJSON(), { validate: true });
                resetListUpdate = false;
            }

            recipients.on('add remove reset', resetList);

            this.on('change:recipients', function () {
                if (resetListUpdate) {
                    return;
                }
                changeRecipientsUpdate = true;
                recipients.reset(self.get('recipients'));
                recipients.invoke('fetch');
                changeRecipientsUpdate = false;
            });

            return recipients;
        },

        initialize: function (option) {
            this.set('files', option.files);
        }
    });

    return ShareModel;
});
