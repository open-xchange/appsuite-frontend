/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 */


define('io.ox/chat/actions/openGroupDialog', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/contacts/widgets/pictureUpload',
    'io.ox/chat/views/members',
    'io.ox/chat/views/addMember',
    'io.ox/backbone/mini-views',
    'io.ox/chat/data',
    'io.ox/core/notifications',
    'io.ox/chat/api',
    'gettext!io.ox/chat',
    'less!io.ox/contacts/edit/style'
], function (ext, ModalDialog, ImageUploadView, MemberView, AddMemberView, mini, data, notifications, api, gt) {

    'use strict';

    var PictureUpload = ImageUploadView.extend({

        render: function () {
            var result = ImageUploadView.prototype.render.call(this);
            var icon = this.model.get('type') === 'channel' ? 'fa-hashtag' : 'fa-group';
            this.$('.contact-photo').append($('<i class="fa fallback-icon">').addClass(icon));
            this.$('input').attr('data-state', 'manual');
            return result;
        },

        openEditDialog: function () {
            this.model.set('pictureFile', this.model.get('pictureFile') || this.model.get('file'));
            ImageUploadView.prototype.openEditDialog.apply(this, arguments);
            this.editPictureDialog.on('reset', function () {
                this.model.set('image1_data_url', '');
            }.bind(this));
            this.editPictureDialog.$title.text(gt('Change image'));
        }

    });

    function membersToObject(members) {
        var obj = {};
        members.forEach(function (email) {
            obj[email] = 'member';
        });
        return obj;
    }

    function open(obj) {

        var def = new $.Deferred();
        var originalModel = obj.id ? data.chats.get(obj.id) : new data.ChatModel(obj);
        var model = originalModel.has('roomId') ? originalModel.clone() : originalModel;
        var members = [data.users.getByMail(data.user.email)];
        if (obj.members) {
            obj.members.forEach(function (email) {
                var model = data.users.getByMail(email);
                if (model) members.push(model);
            });
        }
        var participants = (model.has('roomId') && model.members || new Backbone.Collection(members)).clone();
        var type = obj.type || model.get('type') || 'group';
        model.set('type', type);

        var dialog = new ModalDialog({
            point: 'io.ox/chat/actions/openGroupDialog',
            async: true,
            model: model,
            collection: participants,
            backdrop: true,
            width: model.get('type') === 'group' ? 420 : 380
        })
        .extend({
            header: function () {
                var title = this.model.id ? gt('Edit group chat') : gt('Create group chat'),
                    url = this.model.getIconUrl() ? this.model.getIconUrl() : '',
                    imageDef;

                if (this.model.isChannel()) title = this.model.id ? gt('Edit channel') : gt('Create channel');

                this.pictureModel = new Backbone.Model();

                if (url) {
                    var options = { url: url, xhrFields: { responseType: 'blob' } };
                    imageDef = api.request(options).then(function (blob) {
                        var blobUrl = URL.createObjectURL(blob);
                        this.pictureModel.set({
                            image1_data_url: blobUrl,
                            image1_url: blobUrl,
                            file: function () {
                                return api.request(options).then(
                                    function (blob) {
                                        blob = new Blob([blob]);
                                        blob.lastModified = true;
                                        return blob;
                                    }, function () {
                                        return '';
                                    }
                                );
                            }
                        });
                    }.bind(this));
                }

                $.when(imageDef).then(function () {
                    var title_id = _.uniqueId('title');
                    this.$('.modal-header').empty().append(
                        $('<h1 class="modal-title">').attr('id', title_id).text(title),
                        new PictureUpload({ model: this.pictureModel }).render().$el
                    );
                }.bind(this));
            },
            details: function () {
                var guidDescription = _.uniqueId('form-control-label-');
                var guidTitle = _.uniqueId('form-control-label-');
                var isChannel = this.model.isChannel();
                var label = isChannel ? gt('Channel name') : gt('Group name');
                this.$body.append(
                    $('<div class="row">').append(
                        $('<div class="col-xs-12">').append(
                            $('<div class="form-group">').append(
                                $('<label class="control-label">').attr('for', guidTitle).text(label),
                                new mini.InputView({ id: guidTitle, model: this.model, name: 'title', maxlength: data.serverConfig.maxGroupLength }).render().$el
                            ),
                            isChannel ? $.txt(gt('Other users can find and join your channel under "All channels". If you prefer a conversiom in a closed group, please create a group chat.')) : [],
                            $('<div class="form-group hidden">').append(
                                $('<label class="control-label">').attr('for', guidDescription).text('Description'),
                                new mini.TextView({ id: guidDescription, model: this.model, name: 'description' }).render().$el
                            )
                        )
                    )
                );
            },
            participants: function () {
                if (this.model.isChannel()) return;
                this.$body.append(
                    new AddMemberView({ collection: this.collection }).render().$el,
                    new MemberView({ collection: this.collection }).render().$el
                );
            }
        })
        .build(function () {
            this.$el.addClass('ox-chat-popup ox-chat');
        })
        .addCancelButton()
        .addButton((function (model) {
            var label = gt('Save');
            if (!model.id) label = model.isChannel() ? gt('Create channel') : gt('Create chat');
            return { action: 'save', label: label };
        }(model)))
        .on('save', function () {
            var updates = this.model.has('roomId') ? { roomId: this.model.get('roomId') } : this.model.toJSON(),
                maxGroupLength = data.serverConfig.maxGroupLength || -1,
                hiddenAttr = {},
                newTitle = this.model.get('title').trim();

            if (!newTitle) { // not empty
                dialog.idle();
                return notifications.yell('error', gt('The group could not be saved since the name can not be empty'));
            }
            if (maxGroupLength >= 0 && newTitle.length > maxGroupLength) { // not exceeding limit
                dialog.idle();
                return notifications.yell('error', gt('The chat could not be saved since the name exceeds the length limit of %1$s characters', maxGroupLength));
            }
            if (newTitle !== originalModel.get('title')) updates.title = newTitle; // only save when title changed

            if (this.model.get('description') !== originalModel.get('description')) updates.description = this.model.get('description');

            if (!_.isEqual(this.collection.pluck('email'), Object.keys(this.model.get('members') || {}))) {
                var emails = this.collection.pluck('email');
                if (this.model.isNew()) {
                    updates.members = membersToObject(emails);
                } else {
                    var prevEmails = Object.keys(this.model.get('members')),
                        addedEmails = _.difference(emails, prevEmails),
                        removedEmails = _.difference(prevEmails, emails);
                    if (addedEmails.length > 0) hiddenAttr.add = membersToObject(addedEmails);
                    if (removedEmails.length > 0) hiddenAttr.remove = removedEmails;
                }
            }

            if (this.pictureModel.get('pictureFileEdited') === '') {
                hiddenAttr.icon = null;
            } else if (this.pictureModel.get('pictureFileEdited')) {
                hiddenAttr.icon = this.pictureModel.get('pictureFileEdited');
            }

            if (Object.keys(updates).length <= 1 && Object.keys(hiddenAttr).length <= 0) {
                def.resolve(this.model.get('roomId'));
                this.close();
                return;
            }

            originalModel.save(updates, { hiddenAttr: hiddenAttr }).then(function () {
                this.close();
                data.chats.add(originalModel);
                def.resolve(originalModel.get('roomId'));
            }.bind(this), function (e) {
                originalModel.set(originalModel.previousAttributes());
                dialog.idle();
                if (e.responseJSON) return this.model.handleError(e);
                if (originalModel.get('roomId')) return notifications.yell('error', gt('Changes to this chat could not be saved.'));
                notifications.yell('error', gt('Chat could not be saved.'));
            }.bind(this));
        })
        .on('discard', def.reject)
        .open();

        return def.promise();
    }

    return open;
});
