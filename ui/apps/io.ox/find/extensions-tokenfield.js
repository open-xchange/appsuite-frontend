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

define('io.ox/find/extensions-tokenfield', [
    'io.ox/core/extensions',
    'io.ox/core/util',
    'io.ox/contacts/api'
], function (ext, util, contactsAPI) {

    'use strict';

    var POINT = 'io.ox/find/tokenfield',

        extensions = {

            item: function (baton) {
                this.addClass(baton.data.facet.getOriginalId());
                this.attr('data-id', baton.data.value.getOriginalId());
                // contact picture
                ext.point(POINT + '/image').invoke('draw', this, baton);
                // display name
                ext.point(POINT + '/name').invoke('draw', this, baton);
                // email address
                ext.point(POINT + '/detail').invoke('draw', this, baton);
            },

            image: function (baton) {
                var facet = baton.data.facet;
                if (!facet.hasPersons()) return;
                var data = baton.data.value.get('data').item || {};
                // remove default indent
                this.removeClass('indent');
                // add image node
                this.append(
                    contactsAPI.pictureHalo(
                        $('<div class="image">'),
                        { email: data.detail, image1_url: data.image_url },
                        { width: 40, height: 40, effect: 'fadeIn', urlOnly: false }
                    )
                );
            },

            name: function (baton) {
                var name = baton.data.value.getName() || '\u00A0';

                this
                    .data(baton.data)
                    .append(
                        //use html for the umlauts
                        $('<div class="name">').text(name)
                    );

            },

            detail: function (baton) {
                var detail = baton.data.value.getNameDetail(),
                    isContact = baton.data.facet.hasPersons();

                // contact
                if (isContact) {
                    this.removeClass('indent');
                    this.append(
                        $('<div class="detail">').text((detail || '\u00A0'))
                    );
                } else if (detail) {
                    var node = this.find('.name');
                    node.append(
                        $('<i>').text('\u00A0' + detail)
                    );
                }

            },

            click: function (baton) {
                baton.data.deferred.done(function (value) {
                    // WORKAROUND: use value-id to get latest value model instance via manager
                    // see bug 44818: outdated model in a zombie collection
                    var manager = baton.data.model.manager,
                        facet = value.get('facet');
                    manager.activate(facet.get('id'), value.get('id'), value.get('option'));
                });
            }
        };

    return extensions;
});
