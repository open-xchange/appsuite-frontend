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
    'io.ox/files/share/model',
    'io.ox/files/share/api',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style'
], function (ext, DisposableView, sModel, api, gt) {

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
                    baton.view.$ul
                )
            );
        }
    });

    /*
     * extension point share icon
     */
    ext.point(POINT + '/share').extend({
        id: 'icon',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<div class="icon">').append(
                    $('<i class="fa fa-folder fa-2x">')
                )
            );
        }
    });

    /*
     * extension point share info
     */
    ext.point(POINT + '/share').extend({
        id: 'info',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                 $('<div class="info">').text(baton.view.model.get('share_url'))
            );
        }
    });

    /*
     * extension point share date
     */
    ext.point(POINT + '/share').extend({
        id: 'date',
        index: INDEX += 100,
        draw: function (baton) {
            var created = moment(baton.view.model.get('created'));
            this.append(
                $('<time class="date">')
                    .attr('datetime', created.toISOString())
                    .text(_.noI18n(created.format('L')))
            );
        }
    });

    /*
     * extension point share actions
     */
    ext.point(POINT + '/share').extend({
        id: 'actions',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<div class="actions">').append(
                    $('<a href="#">').append(
                        $('<i class="fa fa-trash">')
                    )
                )
            );
        }
    });

    /*
     * simple share view
     */
    var SharesView = DisposableView.extend({

        tagName: 'li',

        className: 'share-view',

        initialize: function () {

            this.baton = ext.Baton({
                view: this
            });

        },

        render: function () {
            var wrapper = $('<div class="share-wrapper">');

            this.$el.append(wrapper);

            // draw all extensionpoints
            ext.point(POINT + '/share').invoke('draw', wrapper, this.baton);

            return this;
        }

    });

    /*
     * main sharing view
     */
    var MySharesView = DisposableView.extend({

        tagName: 'div',

        className: 'abs myshares-view',

        initialize: function (options) {

            this.options = _.extend({ module: 'files' }, options);

            this.baton = ext.Baton({
                view: this
            });

            this.$ul = $('<ul class="list-unstyled">');

            this.collection = new sModel.Shares();

            this.listenTo(this.collection, 'reset', this.updateShares);

        },

        render: function () {

            // draw all extensionpoints
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);

            this.getShares();

            return this;

        },

        getShares: function () {
            var self = this;
            return api.all(this.options.module).then(function (data) {
                self.collection.reset(data);
            });
        },

        updateShares: function () {
            var self = this;
            this.$ul.empty();
            this.collection.each(function (share) {
                self.$ul.append(
                    new SharesView({
                        model: share
                    }).render().$el
                );
            });
        }

    });

    return MySharesView;
});
