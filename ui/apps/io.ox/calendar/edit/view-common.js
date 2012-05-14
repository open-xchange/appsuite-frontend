/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/view-common',
      ['io.ox/core/tk/view', 'gettext!io.ox/calendar/edit/main'], function (View, gt) {

    'use strict';

    var GRID_WIDTH = 330;

    var CommonView = View.extend({
        initialize: function () {

        },
        template: function (data) {
            var self = this,
                c = $('<div>');

            c.append(
                self.createLabel({id: 'edit_title', text: gt('Title')}),
                self.createTextField({id: 'edit_title', property: 'title', classes: 'input-large'}),

                self.createLabel({id: 'edit_location', text: gt('Location')}),
                self.createTextField({id: 'edit_location', property: 'location', classes: 'input-large'}),

                self.createLabel({id: 'edit_startdate', text: gt('Start at')}),
                self.createDateField({id: 'edit_startdate', property: 'start_date', classes: 'input-large'}),

                self.createLabel({id: 'edit_enddate', text: gt('Ends at')}),
                self.createDateField({id: 'edit_enddate', property: 'end_date', classes: 'input-large'}),

                self.createLabel({id: 'edit_note', text: gt('Note')}),
                self.createTextArea({id: 'edit_note', property: 'note'})
            );
            return c;
        },
        render: function () {
            var self = this;
            self.el = $('<div>').addClass('rightside').css({left: GRID_WIDTH + 'px'});
            var renderedContent = self.template(self.model.get());
            self.el.empty().append(renderedContent);
            return this;
        }
    });

    return CommonView;
});
