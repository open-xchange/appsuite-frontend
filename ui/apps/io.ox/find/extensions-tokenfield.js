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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/extensions-tokenfield', [
    'io.ox/core/extensions',
    'io.ox/contacts/api'
], function (ext, api) {

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

                var defaultimage = api.getFallbackImage(),
                    image = baton.data.value.getImageUrl();
                // remove default indent
                this.removeClass('indent');

                // construct url
                image = (image ? image + '&height=42&scaleType=contain' : defaultimage)
                    .replace(/^https?\:\/\/[^\/]+/i, '')
                    .replace(/^\/ajax/, ox.apiRoot);

                // add image node
                this.append(
                    $('<div class="image">')
                        .css('background-image', 'url(' + image + ')')
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
                    value.activate();
                });
            }
        };

    return extensions;
});
