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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/tk/attachmentEdit', ['io.ox/core/api/attachment', 'less!io.ox/core/tk/attachmentEdit.less'], function (attachmentAPI) {
	'use strict';
	var counter = 0;

	function AttachmentList(options) {
		_.extend(this, {

			init: function () {
				this.attachmentsToAdd = [];
				this.attachmentsToDelete = [];
				this.attachmentsOnServer = [];

				this.allAttachments = [];

				this.loadAttachments();
			},

			render: function () {
				var self = this;
				_(this.allAttachments).each(function (attachment) {
					this.$el.append(self.renderAttachment(attachment));
				});
				return this;
			},
			renderAttachment: function (attachment) {
				var $el = $('<div class="io-ox-core-tk-attachment">');
				$el.text(attachment.filename);
				return $el;
			},
			loadAttachments: function () {
				var self = this;
				if (this.model.id) {
					attachmentAPI.getAll(this.model.attributes).done(function (attachments) {
						self.attachmentsOnServer = attachments;
						self.updateState();
					});
				}
			},

			updateState: function () {
				var self = this;
				this.allAttachments = _(this.attachmentsOnServer.concat(this.attachmentsToAdd)).reject(function (attachment) {
					return _(self.attachmentsToDelete).any(function (toDelete) {
						return toDelete.id === attachment.id;
					});
				});
				this.attachmentsChanged();
			},

			attachmentsChanged: function () {
				this.$el.empty();
				this.render();
			},
			addFile: function (file) {
				console.log(file);
				this.addAttachment({file: file, newAttachment: true, cid: counter++});
			},
			addAttachment: function (attachment) {
				this.attachmentsToAdd.push(attachment);
				this.updateState();
			},

			deleteAttachment: function (attachment) {
				if (attachment.newAttachment) {
					this.attachmentsToAdd = _(this.attachmentsToAdd).reject(function (att) {
						return att.cid === attachment.cid;
					});
				} else {
					this.attachmentsToDelete.push(attachment);
				}
				this.updateState();
			},

			save: function (id, folderId) {
				var apiOptions = {
					module: this.module,
					attached: id || this.model.id,
					folder: folderId || this.get('folder') || this.get('folder_id')
				};

				attachmentAPI.remove(apiOptions, _(this.attachmentsToDelete).pluck('id'));
				attachmentAPI.create(apiOptions, _(this.attachmentsToAdd).pluck('file'));

				this.attachmentsToAdd = [];
				this.attachmentsToDelete = [];
				this.attachmentsOnServer = [];

				this.allAttachments = [];
			}

		}, options);
	}

	return {
		AttachmentList: AttachmentList
	};
});
