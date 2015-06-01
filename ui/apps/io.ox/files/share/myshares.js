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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/files/share/myshares', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/files/share/api',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style'
], function (ext, DisposableView, api, gt) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share/myshares';

    /*
     * extension point share type
     */
    ext.point(POINT + '/fields').extend({
        id: 'header',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('My shares')),
                    baton.view.$ul = $('<ul class="list-unstyled">')
                )
            );
        }
    });

    /*
     * extension point descriptive text
     */
    ext.point(POINT + '/fields').extend({
        id: 'shares',
        index: INDEX += 100,
        draw: function (baton) {
            this.getShares().then(function (shares) {
                _(shares).each(function (share) {
                    baton.view.$ul.append($('<li>').text(share.token));
                });
            });

        }
    });

    /*
     * main view
     */
    var MySharesView = DisposableView.extend({

        tagName: 'div',

        className: 'abs myshares-view',

        initialize: function () {

            this.baton = ext.Baton({
                view: this
            });

        },

        render: function () {

            // draw all extensionpoints
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);

            return this;

        },

        getShares: function () {
            return api.all().then(function (data) {
                // convert to share models
                return data;
            });
        }

    });

    return MySharesView;
});
