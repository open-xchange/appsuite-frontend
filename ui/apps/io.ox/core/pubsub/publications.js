/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/pubsub/publications',
    ['io.ox/core/pubsub/model',
     'io.ox/core/extensions',
     'io.ox/core/api/pubsub',
     'io.ox/core/api/templating',
     'io.ox/core/folder/api',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'settings!io.ox/core',
     'gettext!io.ox/core/pubsub',
     'less!io.ox/core/pubsub/style'
    ], function (pubsub, ext, api, templAPI, folderAPI, notifications, dialogs, settings, gt)  {

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
                    //infostore baton has no module etc...maybe it will be added later
                    module = baton.data.module || 'infostore/object';

                _(data).each(function (obj) {
                    if (obj.module === module)   {
                        target = obj.id;
                        _(obj.formDescription).each(function (description) {
                            //fill targetObj
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
        tagName: 'div',
        editMode: undefined,
        infostoreItem: false,
        initialize: function () {
            if (this.model.id) {
                this.editMode = true;
            } else {
                this.editMode = false;
            }

            if (this.model.attributes.entityModule === 'infostore/object') {
                this.infostoreItem = true;
            }
        },

        finish: function (url) {

            url = _.escape(url);
            var isFolder = !!this.model.attributes.entity.folder && !this.model.attributes.entity.id,
                message = isFolder ?
                    //#. %1$s is the publication link http://...
                    gt('The folder is available at %1$s') :
                    //#. %1$s is the publication link http://...
                    gt('The file is available at %1$s');

            new dialogs.ModalDialog()
                .append(
                    $('<div>').html(
                        gt.format(message, '<a href="' + url + '" target="_blank">' + url + '</a>')
                    )
                )
                .addPrimaryButton('cancel', gt('Close'))
                .show();
        },

        render: function () {
            var self = this;
            //build popup
            var popup = new dialogs.ModalDialog({ async: true })
                .addPrimaryButton('publish', gt('Share'))
                .addButton('cancel', gt('Cancel'));
            //Header
            if (self.model.attributes.entity.folder) {
                popup.getHeader().append($('<h4>').text(gt('Share this folder')));
            } else {
                popup.getHeader().append($('<h4>').text(gt('Share this file')));
            }
            //Body
            popup.getBody().addClass('publication-dialog max-height-250');

            var baton = ext.Baton({
                view: self,
                model: self.model,
                data: self.model.attributes,
                templates: [],
                popup: popup,
                target: self.model.attributes[self.model.attributes.target]
            });

            popup.on('publish', function () {

                self.model.save().done(function (id) {

                    //set id, if none is present (new model)
                    if (!self.model.id) { self.model.id = id; }

                    self.model.fetch().done(function (model) {

                        var publications = pubsub.publications(),
                            pubUrl = model[model.target].url;

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
                            self.finish(pubUrl);
                        }
                        folderAPI.reload(baton.model.get('entity').folder);
                    });
                })
                .fail(function (error) {
                    popup.idle();
                    if (!self.model.valid) {
                        if (!error.model) {
                            //backend Error
                            if (error.code === 'PUB-0006') {
                                popup.getBody().find('.siteName-control').addClass('has-error').find('.help-block').text(gt('Name already taken'));
                            }
                        } else {
                            // validation gone wrong: must be namefield empty because other fields are correctly filled by default
                            var errMsg = gt('Publications must have a name');
                            error.model.errors.each(function (msg) {
                                errMsg = msg.join(' ');
                            });
                            popup.getBody().find('.siteName-control').addClass('error').find('.help-inline').text(errMsg);
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
                templAPI.getNames().done(function (data) {
                    //get the templates if needed
                    baton.templates = data;
                    ext.point('io.ox/core/pubsub/publications/dialog').invoke('draw', popup.getBody(), baton);
                    // get folder first to have its name
                    folderAPI.get(baton.model.get('entity').folder).then(
                        function success(data) {
                            var target = baton.model.get('target'),
                                description = baton.model.get(target);
                            if (!description.siteName) {
                                description.siteName = data.title;
                            }
                            popup.getBody().find('.siteName-value').val(description.siteName);
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

            this.append(control = $('<div>').addClass('form-group siteName-control').append(
                            $('<label>').addClass('siteName-label control-label').text(gt('Name')).attr('for', 'siteName-value'),
                                node = $('<input class="form-control siteName-value">').attr({type: 'text', id: 'siteName-value'}).on('change', function () {
                                    if (node.val() === '' || node.val() === undefined) {
                                        control.addClass('has-error');
                                        control.find('.help-block').text(gt('Publications must have a name'));
                                    } else {
                                        control.removeClass('has-error');
                                        control.find('.help-block').text('');
                                    }
                                    baton.target.siteName = node.val();
                                }),
                                 $('<span>').addClass('help-block')));
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
                this.append($('<div>').addClass('form-group').append(
                    $('<label>').addClass('template-label control-label').attr('for', 'template-value').text(gt('Template')),
                    $('<div>').addClass('controls').append(
                        node = $('<select class="template-value form-control">').attr('id', 'template-value').on('change', function () {
                            baton.target.template = node.val();
                        }))));
                buildTemplates(node, templates);
            } else {
                //no matching templates found on server
                baton.popup.close();
                notifications.yell('error', gt('No matching templates on this Server'));
            }

            //prefill
            if (baton.target.template === '') {
                //set to first item in selection
                baton.target.template = node.val();
            } else {
                node.val(baton.target.template);
            }
        }
    });

    function cipherChange(e) {
        e.data.baton.target['protected'] = $(this).prop('checked');
    }

    ext.point('io.ox/core/pubsub/publications/dialog').extend({
        id: 'cypher',
        index: 300,
        draw: function (baton) {
            // end-users don't understand this, so this becomes optional
            if (settings.get('features/publicationCipherCode', false)) {
                this.append(
                    $('<div class="form-group">').append(
                        $('<div class="controls checkboxes">').append(
                            $('<label class="checkbox">').text(gt('Add cipher code')).append(
                                $('<input type="checkbox" class="cypher-checkbox">')
                                .prop('checked', baton.target['protected'] === true)
                                .on('change', { baton: baton }, cipherChange)
                            )
                        )
                    )
                );
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
        return require(['io.ox/contacts/util', 'io.ox/core/api/user']).then(function (util, userAPI) {
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
                    return ox.registry.call('mail-compose', 'compose', data);
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
                        $('<button type="button" class="email-btn btn btn-default">')
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
                                    if (node.prop('checked')) {
                                        baton.model.attributes.invite = true;
                                    } else {
                                        baton.model.attributes.invite = false;
                                    }
                                }));

                var wrapper = this.find('div.checkboxes');
                if (wrapper.length === 0)  {
                    // build wrapper
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
                            gt('The shared data will be accessible to everyone on the Internet. Please consider, which data you want to share.')),
                        $('<br>'),
                        $('<b>').addClass('privacy-label').text(gt('Privacy Notice')),
                        $('<div>').addClass('privacy-text').text(
                            gt('When using this feature, you as the current owner of the data are responsible for being careful with privacy rules and for complying with legal obligations (Copyright, Privacy Laws). ' +
                               'Especially when sharing personal data you are the responsible party according to the Federal Data Protection Act (BDSG, Germany) or other Privacy Acts of your country. ' +
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
