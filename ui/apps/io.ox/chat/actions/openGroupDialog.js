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
    'io.ox/participants/add',
    'io.ox/participants/views',
    'io.ox/participants/model',
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views',
    'io.ox/contacts/api',
    'io.ox/chat/data'
], function (ext, ModalDialog, PictureUpload, AddParticipantView, pViews, pModel, views, mini, contactsAPI, data) {

    'use strict';

    function open(obj) {
        var userIds, originalModel,
            model = data.chats.get(obj.id);

        if (model) {
            userIds = model.members.map(function (user) {
                return _.cid(user.get('cid'));
            });
        } else {
            var mailAddresses = [data.user.email];
            if (obj.members) mailAddresses.push.apply(mailAddresses, obj.members);
            userIds = mailAddresses.map(function (address) {
                var user = data.users.getByMail(address);
                if (!user) return;
                return _.cid(user.get('cid'));
            });
            userIds = _(userIds).chain().compact().unique().value();
        }

        return contactsAPI.getList(userIds).then(function (users) {
            model = model || new Backbone.Model(obj);
            model.set('type', model.get('type') || obj.type || 'group');
            var participants = new Backbone.Collection(users.map(function (user) {
                return new pModel.Participant(user);
            }));

            originalModel = model.has('id') ? model.clone() : new Backbone.Model();

            return openDialog(model, participants, originalModel);
        });
    }

    function openDialog(model, participants, originalModel) {
        var def = new $.Deferred();

        new ModalDialog({
            point: 'io.ox/chat/actions/openGroupDialog',
            model: model,
            collection: participants,
            backdrop: true
        })
        .extend({
            header: function () {
                var title = this.model.get('id') ? 'Edit group' : 'Create new group';
                if (this.model.get('type') === 'channel') title = this.model.get('id') ? 'Edit channel' : 'Create new channel';

                var title_id = _.uniqueId('title');
                this.$('.modal-header').append(
                    $('<h1 class="modal-title">').attr('id', title_id).text(title)
                );
            },
            details: function () {
                var guidDescription = _.uniqueId('form-control-label-');
                var guidTitle = _.uniqueId('form-control-label-');

                this.$body.append(
                    $('<div class="row details-container">').append(
                        $('<div class="col-xs-6">').append(
                            $('<div class="form-group">').append(
                                $('<label class="control-label">').attr('for', guidTitle).text('Name'),
                                new mini.InputView({ id: guidTitle, model: this.model, name: 'title' }).render().$el
                            ),
                            $('<div class="form-group">').append(
                                $('<label class="control-label">').attr('for', guidDescription).text('Description'),
                                new mini.TextView({ id: guidDescription, model: this.model, name: 'description' }).render().$el
                            )
                        )
                    )
                );
            },
            participants: function () {
                if (this.model.get('type') === 'channel') return;

                var baton = new ext.Baton({ model: this.model });
                this.collection = this.collection || new Backbone.Collection();

                this.$body.append(
                    new pViews.UserContainer({
                        point: 'io.ox/chat/actions/openGroupDialog',
                        model: this.model,
                        baton: baton,
                        collection: this.collection
                    }).render().$el,
                    new AddParticipantView({
                        point: 'io.ox/chat/actions/openGroupDialog',
                        collection: this.collection,
                        scrollIntoView: true,
                        apiOptions: {
                            contacts: true,
                            users: true
                        } }).render().$el
                );
            }
        })
        .build(function () {
            this.$el.addClass('ox-chat-popup');
        })
        .addCancelButton()
        .addButton({ action: 'save', label: model.get('id') ? 'Edit' : 'Create' })
        .on('save', function () {
            var dataObj = this.model.toJSON();
            dataObj.members = this.collection.pluck('email1');

            if (this.model.get('title') === originalModel.get('title')) delete dataObj.title;
            if (this.model.get('description') === originalModel.get('description')) delete dataObj.description;

            if (dataObj.pictureFileEdited === '') {
                dataObj.file = null;
            } else if (this.model.get('pictureFile') === originalModel.get('pictureFile')) {
                dataObj.file = undefined;
            } else {
                dataObj.file = dataObj.pictureFileEdited;
            }

            data.chats.addAsync(dataObj).done(function (model) {
                def.resolve(model.get('id'));
            });
        })
        .on('discard', def.reject)
        .open();

        return def.promise();
    }

    var point = views.point('io.ox/chat/actions/openGroupDialog'),
        pictureUpload = new PictureUpload({
            id: 'upload-group-picture',
            index: 250,
            customizeNode: function () {
                this.$el.addClass('contact-picture-upload f6-target');
            }
        });

    pictureUpload.render = _.wrap(pictureUpload.render, function (render) {
        render.call(this);
        var fileId = this.model.get('fileId'),
            imageUrl = fileId ? data.API_ROOT + '/files/' + fileId + '/thumbnail' : undefined;

        if (imageUrl) this.setPreview(imageUrl);
        this.fileInput.attr('data-state', 'manual');

        return this;
    });

    point.extend(pictureUpload, {
        // need to use render function here because view encapsulation requires the draw function to be called
        // but dialogs invoke render
        render: function (baton) {
            var container = this.$body.find('.details-container'),
                elem = $('<div class="col-xs-6">');

            container.append(elem);

            baton.extension.draw.call(elem, baton);
        }
    });

    return open;
});
