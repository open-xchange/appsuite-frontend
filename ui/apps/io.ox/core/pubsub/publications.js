/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/pubsub/publications',
    ['gettext!io.ox/core/pubsub',
     'io.ox/core/pubsub/model',
     'io.ox/core/extensions',
     'io.ox/backbone/forms',
     'io.ox/core/api/pubsub',
     'io.ox/core/api/templating',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'less!io.ox/core/pubsub/style.less'], function (gt, pubsub, ext, forms, api, templAPI, folderAPI, notifications, dialogs)  {

    'use strict';

    var buildPublishDialog = function (baton) {
        //prepare data

        //check which baton we have standard or baton from folderview
        //folderview means new publication otherwise its an existing one
        if (baton.model) {
            //buildView
            var view = new PublicationView({model: baton.model});

            view.render();
        } else {
            api.publicationTargets.getAll().done(function (data) {
                var target = '',
                    targetObj = {},
                    module = baton.data.module || 'infostore/object';//infostore baton has no module etc...maybe it will be added later

                _(data).each(function (obj) {
                    if (obj.module === module)   {
                        target = obj.id;
                        _(obj.formDescription).each(function (description) {//fill targetObj
                            targetObj[description.name] = description.defaultValue || '';
                        });
                    }
                });
                var attr = {entityModule: module,
                            target: target};
                if (module === 'infostore/object') {
                    attr.entity = {id: baton.data.id};
                } else {
                    attr.entity = {folder: baton.data.id};
                }

                attr[target] = targetObj;

                //buildModel
                var model = new pubsub.Publication(attr);
                //buildView
                var view = new PublicationView({model: model});

                view.render();
            });
        }
    },
    PublicationView = Backbone.View.extend({
        tagName: "div",
        _modelBinder: undefined,
        editMode: undefined,
        infostoreItem: false,
        initialize: function (options) {
            if (this.model.id) {
                this.editMode = true;
            } else {
                this.editMode = false;
            }

            if (this.model.attributes.entityModule === 'infostore/object') {
                this.infostoreItem = true;
            }

            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            var self = this;
            //build popup
            var popup = new dialogs.ModalDialog({ async: true })
                .addPrimaryButton('publish', gt('Publish'))
                .addButton('cancel', gt('Cancel'));
            //Header
            if (self.model.attributes.entity.folder) {
                popup.getHeader().append($('<h4>').text(gt('Publish folder')));
            } else {
                popup.getHeader().append($('<h4>').text(gt('Publish item')));
            }
            //Body
            popup.getBody().addClass('form-horizontal publication-dialog max-height-250');

            var baton = ext.Baton({ view: self, model: self.model, data: self.model.attributes, templates: [], popup: popup, target: self.model.attributes[self.model.attributes.target]});

            popup.on('publish', function (action) {

                self.model.save().done(function (id) {
                    notifications.yell('success', gt("Publication has been added"));

                    //set id, if none is present (new model)
                    if (!self.model.id) { self.model.id = id; }

                    self.model.fetch().done(function (model, collection) {
                        var publications = pubsub.publications(),
                            pubUrl = model[model.target].url;
                        notifications.yell('success', gt('The publication has been made available as %s', pubUrl));
                        //update the model-(collection)
                        publications.add(model, {merge: true});
                        if (self.model.get('invite')) {
                            //TODO: handle url domain missmatch
                            //TODO: user collection
                            baton.model.attributes = $.extend(true, baton.model.attributes, model);
                            sendInvitation(baton).always(function () {
                                popup.close();
                            });
                        } else {
                            // close popup now
                            popup.close();
                        }
                        folderAPI.reload(baton.model.get('entity').folder);
                    });
                })
                .fail(function (error) {
                    popup.idle();
                    if (!self.model.valid) {
                        if (!error.model) {//backend Error
                            if (error.code === 'PUB-0006') {
                                popup.getBody().find('.siteName-control').addClass('error').find('.help-inline').text(gt('Name already taken'));
                            }
                        } else {//validation gone wrong
                            //must be namefield empty because other fields are correctly filled by default
                            popup.getBody().find('.siteName-control').addClass('error').find('.help-inline').text(gt('Publications must have a name'));
                        }
                    }
                });
            });

            function show() {
                // show popup
                popup.show(function () {
                    popup.getBody().find('input:text, input:checkbox').first().focus();
                });
            }

            if (!this.infostoreItem) {
                templAPI.getNames().done(function (data) {//get the templates if needed
                    baton.templates = data;
                    ext.point('io.ox/core/pubsub/publications/dialog').invoke('draw', popup.getBody(), baton);
                    // get folder first to have its name
                    folderAPI.get({ folder: baton.model.get('entity').folder }).then(
                        function success(data) {
                            popup.getBody().find('.siteName-value').val(data.title);
                            show();
                        },
                        function fail() {
                            show();
                        }
                    );
                });
            } else {
                ext.point('io.ox/core/pubsub/publications/dialog').each(function (extension) {
                    if (extension.id === 'url' || extension.id === 'emailbutton' || extension.id === 'legalinformation') {
                        extension.invoke('draw', popup.getBody(), baton);
                    }
                });
                // go!
                show();
            }
        }
    });

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'siteName',
        index: 100,
        draw: function (baton) {
            var node,
                control;

            this.append(control = $('<div>').addClass('control-group siteName-control').append(
                            $('<label>').addClass('siteName-label control-label').text(gt('Name')).attr('for', 'siteName-value'),
                            $('<div>').addClass('controls').append(
                                node = $('<input>').attr({type: 'text', id: 'siteName-value'}).addClass('siteName-value').on('change', function () {
                                    if (node.val() === '' || node.val() === undefined) {
                                        control.addClass('error');
                                        control.find('.help-inline').text(gt('Publications must have a name'));
                                    } else {
                                        control.removeClass('error');
                                        control.find('.help-inline').text('');
                                    }
                                    baton.target.siteName = node.val();
                                }),
                             $('<span>').addClass('help-inline'))));
            //prefill
            node.val(baton.target.siteName);
        }
    });

    function buildTemplates(node, list) {
        for (var i = 0; i < list.length; i++) {
            $('<option>').text(list[i]).val(list[i]).appendTo(node);
        }
    }

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'template',
        index: 200,
        draw: function (baton) {
            var templates = [],
                node;
            for (var i = 0; i < baton.templates.length; i++) {
                if (baton.templates[i] && baton.templates[i].indexOf(baton.data.entityModule) === 0) {
                    templates.push(baton.templates[i]);
                }
            }
            if (templates.length === 1) {
                node = $('<div>').val(templates[0]);
            } else if (templates.length > 0) {
                this.append($('<div>').addClass('control-group').append(
                    $('<label>').addClass('template-label control-label').attr('for', 'template-value').text(gt('Template')),
                    $('<div>').addClass('controls').append(
                        node = $('<select>').attr('id', 'template-value').addClass('template-value input-xlarge').on('change', function () {
                            baton.target.template = node.val();
                        }))));
                buildTemplates(node, templates);
            } else {//no matching templates found on server
                baton.popup.close();
                notifications.yell('error', gt("No matching templates on this Server"));
            }

            //prefill
            if (baton.target.template === '') {//set to first item in selection
                baton.target.template = node.val();
            } else {
                node.val(baton.target.template);
            }
        }
    });

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'cypher',
        index: 300,
        draw: function (baton) {
            var node;
            this.append($('<div>').addClass('control-group').append(
                    $('<div>').addClass('controls checkboxes').append(
                            $('<label>').addClass('checkbox').text(gt('Add cipher code')).append(
                            node = $('<input>').attr('type', 'checkbox').addClass('cypher-checkbox').on('change', function () {
                                if (node.attr('checked') === 'checked') {
                                    baton.target['protected'] = true;
                                } else {
                                    baton.target['protected'] = false;
                                }
                            }))))
                    );
            if (baton.target['protected'] === true) {
                node.attr('checked', true);
            } else {
                node.attr('checked', false);
            }
        }
    });

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'url',
        index: 400,
        draw: function (baton) {
            if (baton.view.editMode) {
                var link;
                if (baton.data.enabled) {
                    link = $('<a class="url-value">')
                        .attr({ id: 'url-value', href: baton.target.url, target: '_blank' })
                        .text(_.noI18n(baton.target.url));
                } else {
                    link = $('<div class="url-value">')
                        .css('color', '#aaa')
                        .text(_.noI18n(baton.target.url));
                }

                this.append(
                    $('<div class="control-group">').append(
                        $('<label class="url-label control-label" for="url-value">').text(_.noI18n('URL')),
                        $('<div class="controls">').append(link)
                    )
                );

            }
        }
    });

    function sendInvitation(baton) {
        return require(['io.ox/mail/write/main', 'io.ox/contacts/util', 'io.ox/core/api/user']).then(function (m, util, userAPI) {
                userAPI.getCurrentUser().then(function (user) {
                    //predefined data for mail
                    var url = baton.target.url,
                        text = gt('Hi!<br><br>%1$s shares a publication with you:<br>%2$s', util.getMailFullName(user.toJSON()), '<a href="' + url + '">' + url + '</a>'),
                        textplain = gt('Hi!<br><br>%1$s shares a publication with you:<br>%2$s', util.getMailFullName(user.toJSON()), url),
                        data = {
                            folder_id: 'default0/INBOX',
                            subject: gt('Publication'),
                            attachments: {
                                html: [{ content: text }],
                                text: [{ content: textplain }]
                            },
                            module: baton.model.attributes.entityModule,
                            target: baton.model.attributes.target,
                            headers: {
                                'X-OX-PubURL': url,
                                'X-OX-PubType': [baton.model.attributes.entityModule,
                                                 baton.model.attributes.target].toString()
                            }
                        } || {};
                    // use default email dialog
                    return m.getApp().launch().then(function () {
                        return this.compose(data);
                    });
                });
            });
    }

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'emailbutton',
        index: 500,
        draw: function (baton) {
            var node;
            if (baton.view.editMode) {
                this.append(
                    $('<div>').addClass('control-group').append(
                        $('<div>').addClass('controls').append(
                        $('<button type="button" class="email-btn btn">')
                            .text(gt('Share link by email'))
                            .on('click', function () {
                                sendInvitation(baton).always(function () {
                                    baton.popup.close();
                                });
                            })
                        )
                    ),
                    $('<br>')
                );
            } else {
                var temp = $('<label>').addClass('checkbox').text(gt('Share link by email')).append(
                               node = $('<input>').attr('type', 'checkbox').addClass('invite-checkbox').on('change', function () {
                                    if (node.attr('checked') === 'checked') {
                                        baton.model.attributes.invite = true;
                                    } else {
                                        baton.model.attributes.invite = false;
                                    }
                                }));

                var wrapper = this.find('div.checkboxes');
                if (wrapper.length === 0)  {//build wrapper
                    wrapper = this.append($('<div>').addClass('control-group').append(
                            $('<div>').addClass('controls').append(temp)));
                } else {
                    wrapper.append(temp);
                }
            }
        }
    });

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'legalinformation',
        index: 600,
        draw: function (baton) {
            var fullNode = $('<div>').addClass('alert alert-info').append($('<b>').addClass('warning-label').text(gt('Attention')),
                        $('<div>').addClass('warning-text').text(
                            gt('The published data will be accessible to everyone on the Internet. Please consider, which data you want to publish.')),
                        $('<br>'),
                        $('<b>').addClass('privacy-label').text(gt('Privacy Notice')),
                        $('<div>').addClass('privacy-text').text(
                            gt('When using this publish feature, you as the current owner of the data are responsible for being careful with privacy rules and for complying with legal obligations (Copyright, Privacy Laws). ' +
                               'Especially when publishing personal data you are the responsible party according to the Federal Data Protection Act (BDSG, Germany) or other Privacy Acts of your country. ' +
                               'According to European and other national regulations you as the responsible party are in charge of data economy, and must not publish or forward personal data without the person\'s consent. ' +
                               'Beyond legal obligations, we would like to encourage extreme care when dealing with personal data. Please consider carefully where you store and to whom you forward personal data. Please ensure appropriate access protection, e.g. by proper password protection.')));

            var link = $('<div>').css('cursor', 'pointer').addClass('control-group').append($('<a href="#">').addClass('controls').text(gt('Show legal information')).on('click', function (e) {
                    e.preventDefault();
                    link.replaceWith(fullNode);
                }));
            if (baton.view.infostoreItem && !baton.view.editMode) {
                this.append(fullNode);
            } else {
                this.append(link);
            }
        }
    });

    return {
        buildPublishDialog: buildPublishDialog
    };
});
