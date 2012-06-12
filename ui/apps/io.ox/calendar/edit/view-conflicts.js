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

define('io.ox/calendar/edit/view-conflicts',
      ['dot!io.ox/calendar/edit/common.html'], function (tmpl) {

    'use strict';

    var ConflictsView = Backbone.View.extend({
        events: {
            'click a.btn-danger[data-action=ignore]': 'onIgnore',
            'click a.btn[data-action=cancel]': 'onCancel'
        },
        initialize: function () {

        },
        render: function () {
            this.$el.empty().append(
                tmpl.render('io.ox/calendar/edit/conflicts', {})
            );
            return this;
        },
        onIgnore: function () {
            console.log('ignore me');
            this.trigger('ignore');
        },
        onCancel: function () {
            console.log('cancel me');
            this.trigger('cancel');
        }
    });

    return ConflictsView;

});
