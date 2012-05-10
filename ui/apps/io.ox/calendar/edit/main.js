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
        'io.ox/core/api/user',
        'io.ox/contacts/api',
        'gettext!io.ox/calendar/edit/main',
        'less!io.ox/calendar/edit/style.css'], function (calAPI, config, CalendarModel, CalendarEditView, api, View, Model, userAPI, contactAPI, gt) {

    'use strict';

    var GRID_WIDTH = 330;

    var CommonView = View.extend({
        render: function () {
            var self = this;
            self.el = $('<div>').addClass('rightside').css({left: GRID_WIDTH + 'px'});
            self.el.append(
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
                console.log('fetch user: ' + obj.id);
                console.log(userAPI);
                userAPI.getList([obj.id]).done(function (users) {
                    console.log('got user');
                    console.log(users);
                    self._data = users[0];
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

    //just a single participant
    var ParticipantView = View.extend({
        render: function () {
            var self = this;
            self.el = $('<li>').addClass('edit-appointment-participant');

            self.el.append(
                contactAPI.getPicture(self.model.get('email1') + '').addClass('contact-image'),
                $('<div>').append(
                    $('<a>', {href: '#'}).addClass('person-link')
                    .text(self.model.get('display_name') + '\u00A0')
                    .on('click', {
                        display_name: self.model.get('display_name'),
                        email1: self.model.get('email1')
                    }, function () {
                        console.log('click me');
                    })
                ),

                $('<div>').text(String(self.model.get('email') || '').toLowerCase()),
                $('<a>', {href: '#', tabindex: '6'})
                    .addClass('remove')
                    .append(
                        $('<div>').addClass('icon').text('x')
                    )
                    .on('click', {id: self.model.get('id')}, function (e) {
                        e.preventDefault();
                        var list = $(this).parents().find('.edit-appointment-participants');
                        $(this).parent().remove();
                        if (list.children().length === 0) {
                            list.hide();
                        }
                    })




            );

            return self;
        }
    });

    // just a collection of a participant view
    var ParticipantsView = View.extend({
        render: function () {
            var self = this;
            self.el = $('<div>').addClass('edit-appointment-participants');

            self.list = $('<ul>');

            var participants = self.model.get('participants');

            _.each(participants, function (participant) {
                self.add(participant);
            });

            self.el.append(self.list);

            return self;
        },
        add: function (obj) {
            var self = this;
            var mymodel = new ParticipantModel();
            var myview = new ParticipantView({model: mymodel});
            mymodel.fetch(obj)
                .done(function () {
                    self.list.append(
                        myview.render().el
                    );
                });

        }
    });


    var AppView = View.extend({
        render: function () {
            var self = this;

            self.el = ox.ui.createWindow({
                name: 'io.ox/calendar/edit',
                title: gt('Edit Appointment'),
                toolbar: true,
                search: false,
                close: true
            });
            self.el.addClass('io-ox-calendar-edit');

            var container = self.el.nodes.main;

            var commonsModel = self.model; //just for easyness in the moment
            var commonsView = new CommonView({model: commonsModel});

            // should go into common view
            self.main = commonsView.render().el;

            //FIXME: quick hack
            self.scrollpane = $('<div>').css({ width: (GRID_WIDTH - 26) + 'px'}).addClass('leftside io-ox-calendar-edit-sidepanel');
            self.sidepanel = self.scrollpane.scrollable();

            var participantsView = new ParticipantsView({model: self.model});
            self.sidepanel.empty().append(participantsView.render().el);

            container.append(self.scrollpane, self.main);

            return self;
        }
    });


    var AppController = function (data) {
        var self = this;
        self.app = ox.ui.createApp({name: 'io.ox/calendar/edit', title: gt('Edit Appointment')});

        self.data = data;
        self.app.setLauncher(function () {
            console.log('set launcher');
            console.log(arguments);
            self.launch();
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
                console.log(self.data);

                self.win = self.view.render().el;
                self.app.setWindow(self.win);
                self.win.show();
            };

            if (self.data) {
                //hash support
                self.app.setState({ folder: self.data.folder_id, id: self.data.id});
                cont(self.data);
            } else {
                console.log('no data');
                api.get(self.app.getState())
                    .done(cont)
                    .fail(function (err) {
                        console.log(err);
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
        console.log('create Instance');
        console.log(arguments);
        var controller = new AppController(data);

        return controller.app;
    }


    return {
        getApp: createInstance
    };
});
