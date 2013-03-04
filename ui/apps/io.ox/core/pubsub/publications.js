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

define('io.ox/core/pubsub/publications', ['gettext!io.ox/core/pubsub',
                                          'io.ox/core/pubsub/model',
                                          'io.ox/core/extensions',
                                          'io.ox/backbone/forms',
                                          'io.ox/core/api/pubsub',
                                          'io.ox/core/api/templating',
                                          'io.ox/core/notifications',
                                          'io.ox/core/tk/dialogs'], function (gt, pubsub, ext, forms, api, templApi, notifications, dialogs)  {
    
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
                var target = '';
                _(data).each(function (obj) {
                    if (obj.module === baton.data.module)   {
                        target = obj.id;
                    }
                });
                var attr = {entity: {folder: baton.data.id},
                            entityModule: baton.data.module,
                            target: target};
                attr[target] = {'protected': true,
                                siteName: '',
                                template: '',
                                url: ''};
                
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
        initialize: function (options) {
            if (this.model.id) {
                this.editMode = true;
            } else {
                this.editMode = false;
            }
            
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            var self = this;
            //build popup
            var popup = new dialogs.ModalDialog({async: true})
                .addPrimaryButton('publish', gt('Publish'))
                .addButton('cancel', gt('Cancel'));
            
            //Header
            if (self.model.attributes.entity.folder) {
                popup.getHeader().append($('<h4>').text(gt('Publish folder')));
            } else {
                popup.getHeader().append($('<h4>').text(gt('Publish item')));
            }
            
            
            templApi.getNames().done(function (data) {//get the templates
                var baton = ext.Baton({ view: self, model: self.model, data: self.model.attributes, templates: data, popup: popup, target: self.model.attributes[self.model.attributes.target]});
                 //Body
                popup.getBody().addClass('form-horizontal');
                ext.point('io.ox/core/pubsub/publications/dialog').invoke('draw', popup.getBody(), baton);
                //go
                popup.show();
                popup.on('publish', function (action) {
                    self.model.save().done(function () {
                        if (self.model.get('invite'))
                            sendInvitation(baton);
                        else
                        popup.close();
                    }).fail(function (error) {
                        popup.idle();
                        if (!self.model.valid) {
                            if (!error.model) {//backend Error
                                if (error.error_params[0].indexOf('PUB-0006') === 0) {
                                    popup.getBody().find('.siteName-control').addClass('error').find('.help-inline').text(gt('Name already taken'));
                                } else {
                                    notifications.yell('error', _.noI18n(error.error));
                                }
                            } else {//validation gone wrong
                                //must be namefield empty because other fields are correctly filled by default
                                popup.getBody().find('.siteName-control').addClass('error').find('.help-inline').text(gt('Publications must have a name'));
                            }
                        }
                    });
                });
            });

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
                if (baton.templates[i].indexOf(baton.data.entityModule) === 0) {
                    templates.push(baton.templates[i]);
                }
            }
            if (templates.length === 1) {
                node = $('<div>').val(templates[0]);
            } else {
                this.append($('<div>').addClass('control-group').append(
                    $('<label>').addClass('template-label control-label').attr('for', 'template-value').text(gt('Template')),
                    $('<div>').addClass('controls').append(
                        node = $('<select>').attr('id', 'template-value').addClass('template-value').on('change', function () {
                            baton.target.template = node.val();
                        }))));
                buildTemplates(node, templates);
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
                node.attr('checked', 'checked');
            } else {
                node.attr('checked', 'unchecked');
            }
        }
    });
    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'url',
        index: 400,
        draw: function (baton) {
            if (baton.view.editMode) {
                this.append($('<div>').addClass('control-group').append(
                        $('<label>').addClass('url-label control-label').text(_.noI18n('URL')).attr('for', 'url-value'),
                        $('<div>').addClass('controls').append(
                            $('<a>').attr({id: 'url-value', href: baton.target.url}).addClass('url-value').text(_.noI18n(baton.target.url))
                            )));
            }
        }
    });
    
    function sendInvitation(baton) {
        require(['io.ox/mail/write/main'], function (m) {
            //predefined data for mail
            var url = baton.model.url(),
                data = {
                    folder_id: 'default0/INBOX',
                    subject: gt('Publication'),
                    attachments: {
                        html: [{ content: '<a href="' + url + '">' + url + '</a>' }],
                        text: [{ content: url }]
                    },
                    module: baton.model.attributes.entityModule,
                    target: baton.model.attributes.target,
                    headers: {
                        'X-OX-PubURL': url,
                        'X-OX-PubType': [baton.model.attributes.entityModule,
                                         baton.model.attributes.target].toString()
                    }
                } || {};
            //use default email dialog
            m.getApp().launch().done(function () {
                this.compose(data)
                    .done(function () {
                        baton.popup.close();
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
                this.append($('<div>').addClass('control-group').append(
                            $('<div>').addClass('controls').append(
                            $('<button>').addClass('email-btn btn').text(gt('Share Link by E-mail')).on('click', function () {
                                sendInvitation(baton);
                            }))),
                            $('<br>'));
            } else {
                this.find('div.checkboxes').append(
                            $('<label>').addClass('checkbox').text(gt('Share Link by E-mail')).append(
                            node = $('<input>').attr('type', 'checkbox').addClass('invite-checkbox').on('change', function () {
                                if (node.attr('checked') === 'checked') {
                                    baton.model.attributes.invite = true;
                                } else {
                                    baton.model.attributes.invite = false;
                                }
                            }))
                        );
            }
        }
    });
    
    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'legalinformation',
        index: 600,
        draw: function (baton) {
            var fullNode = $('<div>').append($('<b>').addClass('warning-label').text(gt('Attention')),
                        $('<div>').addClass('warning-text').text(
                            gt('The published data will be accessible to everyone on the Internet. Please consider, which data you want to publish.')),
                        $('<br>'),
                        $('<b>').addClass('privacy-label').text(gt('Privacy Notice')),
                        $('<div>').addClass('privacy-text').text(
                            gt('When using this publish feature, you as the current owner of the data are responsible for being careful with privacy rules and for complying with legal obligations (Copyright, Privacy Laws). ' +
                               'Especially when publishing personal data you are the responsible party according to the Federal Data Protection Act (BDSG, Germany) or other Privacy Acts of your country. ' +
                               'According to European and other national regulations you as the responsible party are in charge of data economy, and must not publish or forward personal data without the person\'s consent. ' +
                               'Beyond legal obligations, we would like to encourage extreme care when dealing with personal data. Please consider carefully where you store and to whom you forward personal data. Please ensure appropriate access protection, e.g. by proper password protection.')));
            
            var link = $('<div>').addClass('control-group').append($('<a>').addClass('controls').text(gt('Legal information')).on('click', function (e) {
                    e.preventDefault();
                    link.replaceWith(fullNode);
                }));
            this.append(link);
        }
    });
    
    return {
        buildPublishDialog: buildPublishDialog
    };
});