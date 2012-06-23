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
       'io.ox/core/api/autocomplete',
       'io.ox/mail/util',
       'gettext!io.ox/calendar/edit/main'], function (calendarAPI, autocomplete, ParticipantView, ParticipantModel, AutocompleteAPI, mailUtil, gt) {

    'use strict';

    var autocompleteAPI = new AutocompleteAPI({id: 'participants', contacts: true, groups: true, resources: true});

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


            // rework to work this with the given object, without piping it
            // so the choosen email could be rendered in the selected
            // entries - or even think about it, because if its a internal user
            // the user should be rendered
            // if its an external user, than the mail - where the match was

            self.autoparticpants = self.$el.find('.add-participant')
                .attr('autocapitalize', 'off')
                .attr('autocorrect', 'off')
                .attr('autocomplete', 'off')
                .autocomplete({
                    parentSelector: '.io-ox-calendar-edit',
                    source: function (query) {
                        return autocompleteAPI.search(query)
                            .pipe(function (data) {
                                var ndata = _(data).map(function (dataItem) {
                                    switch (dataItem.type) {
                                    case 'contact':
                                        if (dataItem.data.internal_userid) {
                                            dataItem.data.type = 1; //user
                                            dataItem.data.id = dataItem.data.internal_userid; //just to fix a little issue
                                        } else {
                                            dataItem.data.type = 5; //external
                                        }
                                        return dataItem.data;
                                    case 'resource':
                                        dataItem.data.type = 3; //resource
                                        return dataItem.data;
                                    case 'group':
                                        dataItem.data.type = 2; //group
                                        return dataItem.data;
                                    }
                                });

                                console.log('piping source:', ndata);
                                return ndata;
                            });
                    },
                    stringify: function (data) {
                        return (data && data.display_name) ? data.display_name.replace(/(^["'\\\s]+|["'\\\s]+$)/g, ''): '';
                    },
                    draw: function (data) {
                        console.log('draw', data);
                        if (data.constructor.toString().indexOf('Object') !== -1) {
                            data.image1_url = data.image1_url || '';
                            var pmodel = new ParticipantModel(data);
                            var pview = new ParticipantView({model: pmodel});
                            var markup = pview.render().el;

                            // just hack a bit to make it work easely
                            $(this).css({height: '47px'});
                            $(markup).css({'list-style': 'none', 'margin-left': '0px', 'background': 'none'});
                            $(markup).find('.person-link').removeClass('person-link');

                            $(markup).find('.remove').remove();
                            this.append(markup);
                        }
                    },
                    click: function () {
                        self.autoparticpants.trigger('selected', self.autoparticpants.getSelectedItem());
                    }
                })
                .on('selected', function (e, selected) {
                    if (_.isObject(selected)) {
                        self.$('.add-participant').val('');
                        self.trigger('select', selected);
                    } else {
                        self.onClickAdd();
                    }
                });
            return self;
        },
        onClickAdd: function (e) {
            var selectedItem = this.autoparticpants.getSelectedItem();

            if (selectedItem) {
                return this.autoparticpants.trigger('selected', selectedItem);
            } else {
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
            }
        },
        select: function (obj) {
            this.$('.add-participant').val('');
            this.trigger('select', obj);
        }

    });

    return AddParticipantView;
});
