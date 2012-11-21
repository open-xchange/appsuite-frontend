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
      ['io.ox/core/tk/autocomplete',
       'io.ox/core/api/autocomplete',
       'io.ox/mail/util',
       'io.ox/participants/model',
       'io.ox/participants/views',
       'gettext!io.ox/calendar/edit/main'], function (autocomplete, AutocompleteAPI, mailUtil, pModel, pViews, gt) {

    'use strict';

    var AddParticipantView = Backbone.View.extend({
        events: {
            'click [data-action="add"]': 'onClickAdd'
        },
        initialize: function () {
            var self = this;
        },
        // TODO: should refactored to a controller
        render: function (opt) {
            var self = this,
                renderedContent,
                defaults = {
                    id: 'participants',
                    users: false,
                    contacts: true,
                    groups: true,
                    resources: true,
                    distributionlists: true,
                    parentSelector: '.io-ox-calendar-edit'
                },
                options = $.extend(defaults, opt),
                autocompleteAPI = new AutocompleteAPI(options);

            function highlight(text, query) {
                return String(text).replace(/</g, '&lt;')
                    .replace(new RegExp(query, 'i'), '<b>' + query + '</b>');
            }

            self.autoparticipants = self.$el.find('.add-participant')
                .attr('autocapitalize', 'off')
                .attr('autocorrect',    'off')
                .attr('autocomplete',   'off')
                .autocomplete({
                    parentSelector: options.parentSelector,
                    source: function (query) {
                        return autocompleteAPI.search(query);
                    },
                    stringify: function (obj) {
                        return (obj && obj.data && obj.data.display_name) ? obj.data.display_name.replace(/(^["'\\\s]+|["'\\\s]+$)/g, ''): '';
                    },
                    draw: function (obj) {
                        if (obj && obj.data.constructor.toString().indexOf('Object') !== -1) {
                            switch (obj.type) {
                            case 'contact':
                                if (obj.data.internal_userid && obj.data.email1 === obj.email) {
                                    obj.data.type = 1; //user
                                    obj.data.id = obj.data.internal_userid;
                                } else if (obj.data.mark_as_distributionlist) {
                                    obj.data.type = 6; //distlistunsergroup
                                } else {
                                    obj.data.type = 5;
                                    // h4ck
                                    obj.data.email1 = obj.email;
                                }
                                break;
                            case 'resource':
                                obj.data.type = 3; //resource
                                break;
                            case 'group':
                                obj.data.type = 2; //group
                                break;
                            }
                            obj.data.image1_url = obj.data.image1_url || '';
                            var pmodel = new pModel.Participant(obj.data);
                            var pview = new pViews.ParticipantEntryView({model: pmodel, prefetched: true, closeButton: false});
                            var markup = pview.render().el;

                            this.append(markup);
                        }
                    },
                    click: function () {
                        self.autoparticipants.trigger('selected', self.autoparticipants.getSelectedItem());
                    }
                })
                .on('selected', function (e, selected) {
                    if (_.isObject(selected)) {
                        //console.log(selected.data);
                        self.$('.add-participant').val('');
                        self.trigger('select', selected.data);
                    } else {
                        self.onClickAdd();
                    }
                });
            return self;
        },
        onClickAdd: function (e) {
            var selectedItem = this.autoparticipants.getSelectedItem();

            if (selectedItem) {
                return this.autoparticipants.trigger('selected', selectedItem);
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
