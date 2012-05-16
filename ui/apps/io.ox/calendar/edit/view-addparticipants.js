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
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/core/api/user',
       'io.ox/contacts/api',
       'io.ox/core/tk/autocomplete',
       'text!io.ox/calendar/edit/tpl/addparticipant.tpl',
       'gettext!io.ox/calendar/edit/main'], function (Backbone, userAPI, contactAPI, autocomplete, tpl, gt) {

    'use strict';

    var AddParticipantView = Backbone.View.extend({
        initialize: function () {
            var self = this;
            self.el = $('<div>').attr('data-holder', 'data-holder');
        },
        // TODO: should refactored to a controller
        render: function () {
            var self = this,
                renderedContent;

            self.template = _.template(tpl);
            renderedContent = self.template({});
            self.el.empty().append(renderedContent);

            self.el.find('#enter_name')
                .attr('autocapitalize', 'off')
                .attr('autocorrect', 'off')
                .attr('autocomplete', 'off')
                .autocomplete({
                    source: function (query) {
                        var df = new $.Deferred();
                        console.log('query:' + query);
                        //return contactAPI.autocomplete(query);
                        console.log(userAPI.search);
                        return userAPI.search(query, {columns: '20,1,500,501,502,505,520,555,556,557,569,602,606'});
                    },
                    stringify: function (data) {
                        return data.display_name;
                    },
                    draw: function (data) {
                        console.log('drawwww');
                        this.append(
                            $('<div>').addClass('person-link ellipsis').text(data.display_name),
                            $('<div>').addClass('ellipsis').text(data.email1)
                        );
                    },
                    related: function () {
                        var field = self.el.find('#enter_email');
                        return field;
                    },
                    stringifyrelated: function (data) {
                        return data.email;
                    },
                    dataHolder: function () {
                        var holder = self.el;
                        return holder;
                    }
                })
                .on('keydown', function (e) {
                    // on return key
                    if (e.which === 13) {
                        console.log('add participant');
                        console.log(self.el.data());
                        self.trigger('select', self.el.data());
                        self.el.find('#enter_name').val('');
                        self.el.find('#enter_email').val(''); //just empty
                    }
                });

            self.el.find('#enter_email')
                .attr('autocapitalize', 'off')
                .attr('autocorrect', 'off')
                .attr('autocomplete', 'off')
                .autocomplete({
                    source: function (query) {
                        console.log('query:' + query);
                        return contactAPI.autocomplete(query);
                    },
                    stringify: function (data) {
                        return data.email1;
                    },
                    draw: function (data) {
                        console.log('drawwww');
                        this.append(
                            $('<div>').addClass('person-link ellipsis').text(data.display_name),
                            $('<div>').addClass('ellipsis').text(data.email1)
                        );
                    },
                    related: function () {
                        var field = self.el.find('#enter_name');
                        return field;
                    },
                    stringifyrelated: function (data) {
                        return data.display_name;
                    },
                    dataHolder: function () {
                        var holder = self.el;
                        return holder;
                    }
                })
                .on('keydown', function (e) {
                    // on return key
                    if (e.which === 13) {
                        console.log('add participant:::::');
                        self.trigger('select', self.el.data());
                        self.el.find('#enter_email').val(''); //just empty
                    }
                });



            return self;
        }

    });

    return AddParticipantView;
});
