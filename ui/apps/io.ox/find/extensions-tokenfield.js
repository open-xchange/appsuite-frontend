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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
