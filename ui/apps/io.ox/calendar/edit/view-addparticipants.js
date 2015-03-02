/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/view-addparticipants', [
    'io.ox/core/tk/autocomplete',
    'io.ox/core/api/autocomplete',
    'io.ox/mail/util',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'gettext!io.ox/calendar/edit/main'
], function (autocomplete, AutocompleteAPI, mailUtil, pModel, pViews, gt) {

    'use strict';

    var //last results, used to identify internal Users
        lastSearchResults = [],
        blackList = {},
        AddParticipantView = Backbone.View.extend({
            events: {
                'click [data-action="add"]': 'onClickAdd'
            },

            initialize: function (opt) {
                this.options = opt;
                blackList = opt.blackList || {};
            },

            // TODO: should refactored to a controller
            render: function (opt) {
                var self = this,
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

                self.autoparticipants = self.$el.find('.add-participant')
                    .autocomplete({
                        autoselect: options.autoselect,
                        parentSelector: options.parentSelector,
                        placement: options.placement,
                        api: autocompleteAPI,
                        name: options.name,
                        stringify: options.stringify,
                        // reduce suggestion list
                        reduce: function (data) {
                            // updating baton-data-node
                            self.trigger('update');
                            var baton = self.$el.data('baton') || { list: [] },
                                //get numeric type
                                fixType = function (obj) {
                                    switch (obj.type) {
                                    case 'user':
                                    case 1:
                                        obj.data.type = obj.type = obj.sort = 1;
                                        break;
                                    case 'group':
                                    case 2:
                                        obj.data.type = obj.type = obj.sort = 2;
                                        break;
                                    case 'resource':
                                    case 3:
                                        obj.data.type = obj.type = obj.sort = 3;
                                        break;
                                    case 4:
                                        obj.data.type = obj.type = obj.sort = 4;
                                        break;
                                    case 'contact':
                                    case 5:
                                        if (obj.data.internal_userid) {
                                            obj.sort = 1;
                                        } else if (obj.data.mark_as_distributionlist) {
                                            //distlistunsergroup
                                            obj.sort = 4;
                                        } else {
                                            obj.sort = 5;
                                        }
                                        if (!obj.data.type) {//only change if no type is there or type 5 will be made to type 1 on the second run
                                            obj.data.external = true;
                                            if (obj.data.internal_userid && obj.data.email1 === obj.email) {
                                                obj.data.type = 1; //user
                                                obj.data.external = false;
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
                                        obj.type = 5;
                                        break;
                                    }
                                    return obj;
                                },
                                // remove doublets from list
                                filterDoubletes = function () {
                                    var hash = {};
                                    _(baton.list).each(function (obj) {
                                        obj = fixType(obj);
                                        // handle contacts/external contacts
                                        if ((obj.type === 1 || obj.type === 5) && obj.email) {
                                            hash[obj.email] = true;
                                        }
                                        hash[obj.type + '|' + obj.id] = true;
                                    });
                                    return _.chain(data).filter(function (obj) {
                                        obj = fixType(obj);
                                        var uniqueId = obj.type === 1 ? !hash[obj.type + '|' + obj.data.internal_userid || ''] : !hash[obj.type + '|' + obj.data.id];
                                        return uniqueId && (obj.email ? !hash[obj.email] : true) && !blackList[obj.email];
                                    }).sortBy(function (obj) { return obj.sort; }).value();
                                };

                            //save Results
                            lastSearchResults = data;
                            //return number of query hits and the filtered list
                            return { list: filterDoubletes(), hits: data.length };
                        },
                        draw: options.draw || function (obj) {
                            if (!_.isObject(obj)) return;
                            obj.data.image1_url = obj.data.image1_url || '';
                            var pview = new pViews.ParticipantEntryView({
                                    model: new pModel.Participant(obj.data),
                                    prefetched: true,
                                    closeButton: false,
                                    halo: false
                                });

                            this.append(pview.render().el);

                             // apply a11y
                            this.attr({
                                'aria-label': pview.nodes.$text.text() + ' ' + pview.nodes.$mail.text(),
                                'tabIndex': 1
                            });
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

            onClickAdd: function () {

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

                var alreadyIn = $.data(self.$el, 'baton') || { list: [] };
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
                        // TYPE_EXTERNAL_USER
                        type: 5
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
