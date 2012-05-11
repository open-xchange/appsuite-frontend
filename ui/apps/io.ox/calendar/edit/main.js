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

define('io.ox/calendar/edit/main', ['io.ox/calendar/api',
        'io.ox/core/config',
        'io.ox/calendar/model',
        'io.ox/calendar/edit/view',
        'io.ox/calendar/api',
        'io.ox/core/tk/view',
        'io.ox/core/tk/model',
        'io.ox/core/tk/collection',
        'io.ox/core/api/user',
        'io.ox/contacts/api',
        'io.ox/core/tk/autocomplete',
        'io.ox/core/extensions',
        'text!io.ox/calendar/edit/participant.tpl',
        'gettext!io.ox/calendar/edit/main',
        'less!io.ox/calendar/edit/style.css'], function (calAPI, config, CalendarModel, CalendarEditView, api, View, Model, Collection, userAPI, contactAPI, autocomplete, ext, participantTemplate, gt) {

    'use strict';

    var GRID_WIDTH = 330;
    var fnClickPerson = function (e) {
        ext.point('io.ox/core/person:action').each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };

    var CommonView = View.extend({
        tagName: 'div',
        className: 'myclass',
        events: {
            '#button click': 'click'
        },
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


    var ParticipantModel = Model.extend({
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        fetch: function (obj) {
            var self = this,
                df = new $.Deferred();


            switch (obj.type) {
            case self.TYPE_USER:
                //fetch user contact
                userAPI.get({id: obj.id}).done(function (user) {
                    self._data = user;
                    df.resolve();
                });
                break;
            case self.TYPE_USER_GROUP:
                //fetch user group contact
                self._data = {display_name: 'usergroup'};
                df.resolve();
                break;
            case self.TYPE_RESOURCE:
                self._data = {display_name: 'resource'};
                df.resolve();
                break;
            case self.TYPE_RESOURCE_GROUP:
                self._data = {display_name: 'resource group'};
                df.resolve();
                break;
            case self.TYPE_EXTERNAL_USER:
                self._data = {display_name: 'external user'};
                df.resolve();
                break;
            default:
                self._data = {display_name: 'unknown'};
                df.resolve();
                break;
            }

            return df;
        }
    });

    var ParticipantsCollection = Collection.extend({
        model: ParticipantModel
    });


    var EnterParticipantView = View.extend({
        initialize: function () {
            var self = this;
            self.el = $('<div>').attr('data-holder', 'data-holder');
        },
        render: function () {
            var self = this,
                renderedContent;

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
        },
        template: function (data) {
            var self = this,
                c = $('<div>');
            c.append(
                self.createLabel({id: 'enter_name', text: gt('Name')}),
                self.createTextField({id: 'enter_name', property: 'display_name', classes: 'discreet'}),

                self.createLabel({id: 'enter_email', text: gt('Email')}),
                self.createTextField({id: 'enter_email', property: 'email', classes: 'discreet'})


            );
            return c.html();
        }

    });

    //just a single participant
    var ParticipantView = View.extend({
        initialize: function () {
            var self = this;
            self.template = _.template(participantTemplate);
            self.el = $('<li>')
                .addClass('edit-appointment-participant')
                .attr('data-cid', self.model.cid);

            // rerender on model change
            self.model.on('change', _.bind(self.render, self));
        },
        render: function () {
            var self = this;

            var mydata = _.clone(self.model.get());
            console.log('render participant');
            console.log(self.model.collection);

            if (mydata.image1_url) {
                mydata.image1_url = mydata.image1_url.replace(/^\/ajax/, ox.apiRoot);
            } else {
                mydata.image1_url = '';
            }

            var renderedContent = self.template(mydata);
            self.el.empty().append(renderedContent);
            return self;
        }
    });

    // just a collection of a participant view
    var ParticipantsView = View.extend({
        initialize: function () {
            var self = this;
            self.el = $('<div>').addClass('edit-appointment-participants');
            self.model.on('change', _.bind(self.render, self));
            self.model.on('add', _.bind(self.onAdd, self));
            self.model.on('remove', _.bind(self.onRemove, self));

            $(self.el).on('click', _.bind(self.click, self));
        },
        render: function () {
            var self = this;
            self.list = $('<ul>'); //.addClass('edit-appointment-participantslist');

            self.model.each(function (participant) {
                self.add(participant);
            });

            self.el.empty().append(self.list);

            return self;
        },
        add: function (participantModel) {
            var self = this;
            var myview = new ParticipantView({model: participantModel});
            participantModel.fetch(participantModel.get())
                .done(function () {
                    self.list.append(
                        myview.render().el
                    );
                });

        },
        onAdd: function (evt, model) {
            var self = this;
            self.add(model);
        },
        onRemove: function (evt, model, collection, options) {
            var self = this;
            $(self.el).find('[data-cid=' + model.cid + ']').remove();
        },
        click: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            if ($(evt.target).parent().hasClass('remove')) {
                console.log('click:' + itemid);
                console.log(item);
                self.model.remove(self.model.getByCid(itemid));
                console.log('click');
                console.log(arguments);
            }

            if ($(evt.target).hasClass('person-link')) {
                var obj = self.model.getByCid(itemid).get();
                console.log(obj);
                evt.data = {id: obj.id, email1: obj.email1};
                fnClickPerson(evt);

                console.log('hit halo now');
            }
        }
    });


    var AppView = View.extend({
        initialize: function () {
            var self = this;

            self.el = ox.ui.createWindow({
                name: 'io.ox/calendar/edit',
                title: gt('Edit Appointment'),
                toolbar: true,
                search: false,
                close: true
            });
            self.el.addClass('io-ox-calendar-edit');
        },
        render: function () {
            var self = this;

            var container = self.el.nodes.main;

            var commonsModel = self.model; //just for easyness in the moment
            var commonsView = new CommonView({model: commonsModel});

            // should go into common view
            self.main = commonsView.render().el;

            //FIXME: quick hack
            self.scrollpane = $('<div>').css({ width: (GRID_WIDTH - 26) + 'px'}).addClass('leftside io-ox-calendar-edit-sidepanel');
            self.sidepanel = self.scrollpane.scrollable();

            var participantsCollection = new ParticipantsCollection(self.model.get('participants'));

            window.coll = participantsCollection;

            var enterParticipantView = new EnterParticipantView({model: new Model()});
            var participantsView = new ParticipantsView({model: participantsCollection });

            enterParticipantView.on('select', function (evt, data) {
                //just a test
                console.log('data');
                console.log(data);
                participantsCollection.add([{type: 1, id: data.id }]);
            });

            self.sidepanel.empty()
                .append(enterParticipantView.render().el)
                .append(participantsView.render().el);

            container.empty().append(self.scrollpane, self.main);
            return self;
        }
    });


    var AppController = function (data) {
        var self = this;
        self.app = ox.ui.createApp({name: 'io.ox/calendar/edit', title: gt('Edit Appointment')});

        self.data = data;
        self.app.setLauncher(function () {
            return self.launch();
        });
        self.app.setQuit(function () {
            return self.dispose();
        });
    };





    AppController.prototype = {
        launch: function () {
            var self = this;
            var cont = function (data) {
                self.data = data;

                self.model = new CalendarModel({data: self.data});
                self.view = new AppView({model: self.model});

                console.log(arguments);

                console.log('launching app');

                self.win = self.view.render().el;
                self.app.setWindow(self.win);
                self.win.show();
            };

            if (self.data) {
                //hash support
                self.app.setState({ folder: self.data.folder_id, id: self.data.id});
                cont(self.data);
            } else {
                api.get(self.app.getState())
                    .done(cont)
                    .fail(function (err) {
                        // FIXME: use general error class, teardown gently for the user
                        throw new Error(err.error);
                    });
            }
        },
        /*
        * should cleanly remove every outbounding reference
        * of all objects created. this could be a awkward task
        * but better for longtime perf. IE still has a huge memory-leak problem
        * :(
        */
        dispose: function () {
            var self = this,
                df = new $.Deferred();

            //be gently
            if (self.model.isDirty() || true) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to lose your changes?'))
                        .addPrimaryButton('delete', gt('Lose changes'))
                        .addButton('cancel', gt('Cancel'))
                        .show()
                        .done(function (action) {
                            console.debug('Action', action);
                            if (action === 'delete') {
                                df.resolve();
                            } else {
                                df.reject();
                            }
                        });
                });
            } else {
                //just let it go
                df.resolve();
            }

            return df;
        }
    };



    function createInstance(data) {
        console.log(arguments);
        var controller = new AppController(data);

        return controller.app;
    }


    return {
        getApp: createInstance
    };
});
