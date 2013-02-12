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
                .autocomplete({
                    autoselect: options.autoselect,
                    parentSelector: options.parentSelector,
                    api: autocompleteAPI,
                    // reduce suggestion list
                    reduce: function (data) {

                        // updating baton-data-node
                        self.trigger('update');
                        var baton = $.data(self.$el, 'baton') || {list: []},
                            hash = {},
                            list;
                        _(baton.list).each(function (obj) {
                            // handle contacts/external contacts
                            if (obj.type === 1 || obj.type === 5) {
                                obj.type = 5;
                                hash[obj.email] = true;
                                hash[obj.type + '|' + obj.id] = true;
                            } else {
                                hash[obj.type + '|' + obj.id] = true;
                            }
                        });

                        // filter doublets
                        list = _(data).filter(function (recipient) {
                            var type;
                            switch (recipient.type) {
                            case 'user':
                            case 'contact':
                                type = 5;
                                break;
                            case 'group':
                                type = 2;
                                break;
                            case 'resource':
                                type = 3;
                                break;
                            }
                            return !hash[type + '|' + recipient.data.id] && !hash[type + '|' + recipient.data.internal_userid || ''] && !hash[recipient.email];
                        });

                        //return number of query hits and the filtered list
                        return { list: list, hits: data.length };
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
                                    //uses emailparam as flag, to support adding users with their 2nd/3rd emailaddress
                                    obj.data.emailparam = obj.email;
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
                            var pview = new pViews.ParticipantEntryView({model: pmodel, prefetched: true, closeButton: false, halo: false});
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
            var selectedItem = this.autoparticipants.getSelectedItem(),
                self = this;

            if (selectedItem) {
                return this.autoparticipants.trigger('selected', selectedItem);
            } else {
                var node = this.$('input.add-participant'),
                    val = node.val(),
                    list = mailUtil.parseRecipients(val);
                if (list.length) {
                    // add n extenal users
                    _.each(list, function (elem) {
                        self.select({
                            id: Math.random(),
                            display_name: elem[0],
                            mail: elem[1],
                            image1_url: '',
                            type: 5 // TYPE_EXTERNAL_USER
                        });
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
