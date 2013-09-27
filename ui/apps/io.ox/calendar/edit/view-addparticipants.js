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
       'io.ox/core/notifications',
       'gettext!io.ox/calendar/edit/main'], function (autocomplete, AutocompleteAPI, mailUtil, pModel, pViews, notifications, gt) {

    'use strict';

    var lastSearchResults = [],//last results, used to identify internal Users
        AddParticipantView = Backbone.View.extend({
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
                    parentSelector: '.io-ox-calendar-edit',
                    placement: 'bottom',
                    keepId: false
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
                    placement: options.placement,
                    api: autocompleteAPI,
                    name: options.name,
                    // reduce suggestion list
                    reduce: function (data) {
                        // updating baton-data-node
                        self.trigger('update');
                        var baton = $.data(self.$el, 'baton') || {list: []},
                            hash = {},
                            list,
                            //get numeric type
                            getType = function (obj) {
                                switch (obj.type) {
                                case 'user':
                                case 1:
                                    return 1;
                                case 'group':
                                case 2:
                                    return 2;
                                case 'resource':
                                case 3:
                                    return 3;
                                case 4:
                                    return 4;
                                case 'contact':
                                case 5:
                                    return 5;
                                }
                            },
                            //set hash for doublet check
                            getHash = function () {
                                var hash = {};
                                _(baton.list).each(function (obj) {
                                    // handle contacts/external contacts
                                    if ((getType(obj) === 1 || getType(obj) === 5) && obj.email) {
                                        hash[obj.email] = true;
                                    }
                                    hash[obj.type + '|' + obj.id] = true;
                                });
                                return hash;
                            },
                            // remove doublets from list
                            filterDoubletes = function (hash) {
                                return _(data).filter(function (recipient) {
                                    var type = getType(recipient),
                                        uniqueId = type === 1 ? !hash[type + '|' + recipient.data.internal_userid || ''] : !hash[type + '|' + recipient.data.id],
                                        uniqueMail = recipient.email ? !hash[recipient.email] : true;
                                    return uniqueId && uniqueMail;
                                });
                            };

                        hash = getHash();
                        list = filterDoubletes(hash);
                        //save Results
                        lastSearchResults = data;
                        //return number of query hits and the filtered list
                        return { list: list, hits: data.length };
                    },
                    draw: function (obj) {
                        if (obj && obj.data.constructor.toString().indexOf('Object') !== -1) {
                            switch (obj.type) {
                            case 'user':
                            case 'contact':
                                if (!obj.data.type) {//only change if no type is there or type 5 will be made to type 1 on the second run
                                    if (obj.data.internal_userid && obj.data.email1 === obj.email) {
                                        obj.data.type = 1; //user
                                        if (!options.keepId) {
                                            obj.data.id = obj.data.internal_userid;
                                        }
                                    } else if (obj.data.mark_as_distributionlist) {
                                        obj.data.type = 6; //distlistunsergroup
                                    } else {
                                        obj.data.type = 5;
                                        // h4ck
                                        obj.data.email1 = obj.email;
                                        //uses emailparam as flag, to support adding users with their 2nd/3rd emailaddress
                                        obj.data.emailparam = obj.email;
                                    }
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
                        self.$('.add-participant').val('');
                        self.trigger('select', selected.contact);
                    } else {
                        self.onClickAdd();
                    }
                });
            return self;
        },
        onClickAdd: function (e) {

            // updating baton-data-node
            this.trigger('update');

            var selectedItem = this.autoparticipants.getSelectedItem(),
                self = this;

            if (selectedItem) {
                return this.autoparticipants.trigger('selected', selectedItem);
            }

            var node = this.$('input.add-participant'),
                placeholder = node.attr('placeholder'),
                val = $.trim(node.val()),
                list = mailUtil.parseRecipients(val);

            if (val === '') {
                if (!placeholder) {
                    node.attr('placeholder', gt('Search here') + ' ...');
                }
                node.focus();
                return;
            }
            //look if value was in last search results
            var foundContact;
            for (var i = 0; i < lastSearchResults.length; i++) {
                if (lastSearchResults[i].email === val) {
                    foundContact = lastSearchResults[i];
                    //do some formating
                    foundContact.contact = foundContact.data;
                    break;
                }
            }
            //found one? add it!
            if (foundContact) {
                this.$('.add-participant').val('');
                return this.autoparticipants.trigger('selected', foundContact);
            }

            var alreadyIn = $.data(self.$el, 'baton') || { list: []};
            //look if it's not there already
            _.each(list, function (elem, index) {
                for (var i = 0; i < alreadyIn.list.length; i++) {
                    if (elem[1] === alreadyIn.list[i].email) {
                        list.splice(index, 1);
                        break;
                    }
                }
            });

            if (list.length === 0) {
                node.focus();
                return;
            }

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
        },

        select: function (obj) {
            this.$('.add-participant').val('');
            this.trigger('select', obj);
        }
    });

    return AddParticipantView;
});
