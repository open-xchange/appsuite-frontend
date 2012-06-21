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
       'io.ox/calendar/edit/view-participant',
       'io.ox/calendar/edit/model-participant',
       'io.ox/mail/util',
       'gettext!io.ox/calendar/edit/main'], function (calendarAPI, autocomplete, ParticipantView, ParticipantModel, mailUtil, gt) {

    'use strict';

    var AddParticipantView = Backbone.View.extend({
        events: {
            'click [data-action="add"]': 'onClickAdd'
        },
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
                        if (data.constructor.toString().indexOf('Object') !== -1) {
                            data.image1_url = data.image1_url || '';
                            var pmodel = new ParticipantModel(data);
                            var pview = new ParticipantView({model: pmodel});
                            var markup = pview.render().el;

                            // just hack a bit to make it work easely
                            $(this).css({height: '39px'});
                            $(markup).css({'list-style': 'none', 'margin-left': '0px'});
                            $(markup).find('.person-link').removeClass('person-link');

                            $(markup).find('.remove').remove();
                            this.append(markup);
                        }
                    }
                })
                .on('selected', function (e, selected) {
                    if (_.isString(selected)) {
                        self.onClickAdd(e);
                    } else {
                        self.select(selected);
                    }
                });
            return self;
        },
        onClickAdd: function (e) {
            var node = this.$('input.add-participant');
            var val = node.val();
            var list = mailUtil.parseRecipients(val);
            if (list.length) {
                this.select({
                    id: Math.random(),
                    display_name: list[0][0],
                    mail: list[0][1],
                    image1_url: '',
                    type: 5 // TYPE_EXTERNAL_USER
                });
            } else {
                node.attr('disabled', 'disabled')
                    .css({border: '1px solid #a00', backgroundColor: '#fee'})
                    .shake()
                    .done(function () {
                        node.css({ border: '', backgroundColor: '' })
                            .removeAttr('disabled').focus();
                    });
            }
        },
        select: function (obj) {
            this.$('.add-participant').val('');
            this.trigger('select', obj);
        }

    });

    return AddParticipantView;
});
