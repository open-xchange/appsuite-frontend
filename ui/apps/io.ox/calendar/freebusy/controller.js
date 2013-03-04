/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/freebusy/controller',
    ['io.ox/core/tk/dialogs',
     'io.ox/calendar/week/view',
     'gettext!io.ox/core/calendar',
     'less!io.ox/core/calendar/freebusy/style.css'], function (dialogs, WeekView, gt) {

    'use strict';

    var that = {

        FreeBusy: function (options) {

            var self = this;

            // create container node
            this.$el = $('<div class="abs free-busy-view">').on('dispose', function () {
                // clean up
                console.log('YEEEHAA > dispose', this);
                self.weekview.remove();
            });

            // all appointments are stored in this collection
            this.collection = new Backbone.Collection([]);

            // get new instance of weekview
            this.weekview = new WeekView({
                collection: this.collection,
                mode: 'workweek',
                appExtPoint: 'io.ox/calendar/week/view/appointment'
            });

            this.$el.append(
                $('<div class="abs free-busy-participants">'),
                this.weekview.render().$el.addClass('free-busy-calendar')
            );
        },

        open: function (options) {

            var width = $(document).width() - 50,
                height = $(document).height() - 200;

            new dialogs.ModalDialog({ width: width, easyOut: true })
                .build(function () {
                    this.getHeader()
                        .append(
                            $('<h4 id="dialog-title">').text(gt('Find free time'))
                        );
                    this.getContentNode()
                        .css({ height: height + 'px', maxHeight: height + 'px' })
                        .append(
                            new that.FreeBusy(options).$el
                        );
                })
                .addPrimaryButton('close', gt('Close'))
                .show();
        }
    };

    return that;
});
