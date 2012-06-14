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

define('io.ox/calendar/edit/view-addparticipants',
      ['io.ox/calendar/api',
       'io.ox/core/tk/autocomplete',
       'gettext!io.ox/calendar/edit/main'], function (calendarAPI, autocomplete, gt) {

    'use strict';

    var AddParticipantView = Backbone.View.extend({
        initialize: function () {
            var self = this;
        },
        // TODO: should refactored to a controller
        render: function () {
            var self = this,
                renderedContent;

            self.$el.find('.add-participant')
                .attr('autocapitalize', 'off')
                .attr('autocorrect', 'off')
                .attr('autocomplete', 'off')
                .autocomplete({
                    source: function (query) {
                        var df = new $.Deferred();
                        //return contactAPI.autocomplete(query);
                        return calendarAPI.searchParticipants(query); //, {columns: '20,1,500,501,502,505,520,555,556,557,569,602,606'});
                    },
                    stringify: function (data) {
                        return data.display_name;
                    },
                    draw: function (data) {
                        this.append(
                            $('<div>').addClass('person-link ellipsis').text(data.display_name),
                            $('<div>').addClass('ellipsis').text(data.email1)
                        );
                    }
                })
                .on('selected', function (e, selected) {
                    console.log('selected', arguments);
                    self.$('.add-participant').val('');
                    self.trigger('select', selected);
                });

            return self;
        }

    });

    return AddParticipantView;
});
