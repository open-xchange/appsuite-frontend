/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/attachments/view', [
    'io.ox/core/extensions',
    'io.ox/core/attachments/backbone',
    'io.ox/core/strings',
    'gettext!io.ox/core',
    'io.ox/backbone/views/extensible',
    'less!io.ox/core/attachments/style'
], function (ext, backbone, strings, gt, ExtensibleView) {

    'use strict';

    //
    // New attachment list (combines a flat list and a preview)
    //

    var List = ExtensibleView.extend({

        scrollStep: 120,
        openByDefault: false,

        events: {
            'click .toggle-details': 'onToggleDetails',
            'click .toggle-mode': 'onToggleMode',
            'click .scroll-left': 'scrollLeft',
            'click .scroll-right': 'scrollRight'
        },

        initialize: function (options) {

            this.options = _.extend({ AttachmentView: View, editable: false, mode: 'list' }, options);

            this.listenTo(this.collection, 'add', this.addAttachment);

            // add class here to support $el via options
            this.$el.addClass('mail-attachment-list')
                .addClass(_.device('touch') ? 'touch' : '');

            // editable?
            if (this.options.editable) this.$el.addClass('editable');

            if (this.options.mode === 'preview') this.$el.addClass('show-preview');

            this.$header = $('<div class="header">');
            this.$list = $('<ul class="inline-items">');
            this.$preview = $('<ul class="inline-items preview">');
            this.$footer = $('<footer>');
            this.isListRendered = false;

            // things to do whenever the collection changes:
            this.listenTo(this.collection, 'add remove reset', function () {
                // toggle if empty
                var length = this.getValidModels().length;
                this.$el.toggleClass('empty', length === 0);
                // update scroll controls
                this.updateScrollControls();
                // update summary
                this.renderSummary(length);
                if (this.openByDefault) this.toggleDetails(true);
            });
            this.listenTo(this.collection, 'remove', function () {
                this.$preview.trigger('scroll');
            });

            // initial toggle if empty
            this.$el.toggleClass('empty', this.getValidModels().length === 0);
        },

        render: function () {

            var listId = _.uniqueId('list-container-'),
                previewId = _.uniqueId('preview-container-');

            this.renderHeader();

            this.$el.append(
                // header
                this.$header,
                // short list
                $('<div class="list-container">').attr('id', listId).append(
                    this.$list
                ),
                // preview list
                $('<div class="preview-container">').attr('id', previewId).append(
                    $('<button type="button" class="scroll-left"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>'),
                    this.$preview,
                    $('<button type="button" class="scroll-right"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>')
                ),
                // footer
                this.$footer
            );

            if (this.openByDefault) this.toggleDetails(true);

            this.updateScrollControls();
            this.updateAriaControls();
            this.$header.find('.toggle-mode').attr('aria-controls', [listId, previewId].join(' '));

            return this;
        },

        renderHeader: function () {

            this.$header.append(
                $('<a href="#" class="toggle-details" aria-expanded="false" role="button">').append(
                    $('<i class="fa fa-paperclip" aria-hidden="true">'),
                    $('<span class="summary">'),
                    $('<i class="fa toggle-caret" aria-hidden="true">')
                ),
                $('<span class="links" role="presentation">'),
                $('<a href="#" class="pull-right toggle-mode" role="button">').attr('title', gt('Toggle preview'))
                    .append('<i class="fa" aria-hidden="true">')
            );

            this.renderSummary();
        },

        renderSummary: function (length) {
            length = length || this.getValidModels().length;
            this.$header.find('.summary').text(
                gt.ngettext('%1$d attachment', '%1$d attachments', length, length)
            );
        },

        renderList: function () {

            // use inner function cause we do this twice
            function render(list, target, mode) {
                target.append(
                    list.map(this.renderAttachment.bind(this, mode))
                );
            }

            var models = this.getValidModels();
            render.call(this, models, this.$list, 'list');
            render.call(this, models, this.$preview, 'preview');

            this.isListRendered = true;
        },

        renderAttachment: function (mode, model) {
            return new this.options.AttachmentView({ point: this.options.point, mode: mode, model: model }).render().$el;
        },

        addAttachment: function (model) {
            if (!this.isListRendered) return;
            if (!this.collection.isValidModel(model)) return;
            this.$list.append(this.renderAttachment('list', model));
            this.$preview.append(this.renderAttachment('preview', model));
        },

        getValidModels: function () {
            return this.collection.getValidModels();
        },

        updateAriaControls: function () {
            var id;
            if (this.$el.hasClass('show-preview')) id = this.$('.preview-container').attr('id');
            else id = this.$('.list-container').attr('id');
            this.$header.find('.toggle-details').attr('aria-controls', id);
            this.$header.find('.toggle-mode').attr('aria-pressed', this.$el.hasClass('show-preview'));
        },

        toggleDetails: function (forceOpen) {
            this.$el.toggleClass('open', forceOpen === true || undefined);
            this.$header.find('.toggle-details').attr('aria-expanded', this.$el.hasClass('open'));
            this.trigger('change:expanded', this.$el.hasClass('open'));
            if (!this.isListRendered) this.renderList();
        },

        onToggleDetails: function (e) {
            e.preventDefault();
            this.toggleDetails();
            this.updateScrollControls();
        },

        onToggleMode: function (e) {
            e.preventDefault();
            this.$el.toggleClass('show-preview');
            this.trigger('change:layout', this.$el.hasClass('show-preview') ? 'preview' : 'list');
            // to provoke lazyload
            this.$preview.trigger('scroll');
            this.updateScrollControls();
            this.updateAriaControls();
            $(window).trigger('resize');
        },

        scrollLeft: function () {
            this.scrollList(-1);
        },

        scrollRight: function () {
            this.scrollList(+1);
        },

        scrollList: function (delta) {
            var index = this.getScrollIndex() + delta, max = this.getMaxScrollIndex();
            // ignore invalid indexes
            if (index < 0 || index > max) return;
            // update controls with new index
            this.updateScrollControls(index);
            // clear queue, don't jump to end; to support fast consecutive clicks
            this.$preview.stop(true, false).animate({ scrollLeft: index * this.scrollStep }, 'fast');
        },

        getScrollIndex: function () {
            // make sure we're always at a multiple of 120 (this.scrollStep)
            return Math.ceil(this.$preview.scrollLeft() / this.scrollStep);
        },

        getMaxScrollIndex: function () {
            var width = this.$preview.width(), scrollWidth = this.$preview.prop('scrollWidth');
            return Math.max(0, Math.ceil((scrollWidth - width) / this.scrollStep));
        },

        updateScrollControls: function (index) {
            if (index === undefined) index = this.getScrollIndex();
            var max = this.getMaxScrollIndex();
            this.$('.scroll-left').prop('disabled', index <= 0);
            this.$('.scroll-right').prop('disabled', index >= max);
        }
    });

    var Preview = Backbone.View.extend({

        className: 'preview',

        events: {
            'keydown': 'onKeydown'
        },

        initialize: function () {
            this.listenTo(this.model, 'change:id', this.render);
            this.$el.on('error.lazyload', this.fallback.bind(this));
        },

        lazyload: function (previewUrl) {
            // use defer to make sure this view has already been added to the DOM
            _.defer(function () {
                this.$el.lazyload({ container: this.$el.closest('ul'), effect: 'fadeIn', previewUrl: previewUrl });
            }.bind(this));
        },

        getColor: function (extension) {
            // word blue
            if (/^do[ct]x?$/.test(extension)) return '#2C5897';
            // excel green
            if (/^xlsx?|o[dt]s$/.test(extension)) return '#1D7047';
            // powerpoint orange
            if (/^p[po]tx?$/.test(extension)) return '#D04423';
            // pdf red
            if (/^pdf$/.test(extension)) return '#C01E07';
            // zip orange
            if (/^(zip|gz|gzip|tgz)$/.test(extension)) return '#FF940A';
        },

        fallback: function () {
            var extension = this.model.getExtension(), color;
            if (!extension) return;
            color = this.getColor(extension);
            this.$el.append(
                $('<div class="abs fallback ellipsis">')
                    .css({ color: color && 'white', backgroundColor: color })
                    .text(extension)
            );
        },

        render: function () {
            var url = this.model.previewUrl({ delayExecution: true });
            if (_.isString(url)) {
                this.$el.addClass('lazy').attr('data-original', url);
                this.lazyload();
            } else if (url !== null) {
                this.$el.addClass('lazy');
                this.lazyload(url);
            } else {
                this.fallback();
            }
            this.$el.attr('tabindex', '0');
            return this;
        },

        onKeydown: function (e) {
            if (e.which !== 13 && e.which !== 32) return;
            $(e.target).trigger('click');
            e.preventDefault();
            e.stopPropagation();
        }

    });

    var View = Backbone.View.extend({

        tagName: 'li',
        className: 'item',

        events: {
            'click .remove': 'onRemove'
        },

        attributes: function () {
            //previews don't have an id. use cid instead. Otherwise preview in mail compose breaks.
            return { 'data-id': this.model.get('id') || this.model.cid };
        },

        initialize: function (options) {

            this.options = _.extend({ mode: 'list' }, options);

            this.preview = this.options.mode === 'preview' && new Preview({ model: this.model, el: this.el });

            this.listenTo(this.model, {
                'change:uploaded': function (model) {
                    var w = model.get('uploaded') * 100;
                    // special case. Has been reset to 0 and therefore needs to be rendered again
                    if (w === 0) this.render();
                    this.$('.progress').width(w + '%');
                },
                'change:file_size change:size': this.render,
                'upload:complete': function () {
                    this.render();
                },
                'remove': this.onRemoveModel
            });

            var point = this.options.point ? this.options.point + '/view' : 'io.ox/core/attachment/view';
            ext.point(point).invoke('initialize', this);
        },

        onRemove: function (e) {
            e.preventDefault();
            this.model.collection.remove(this.model);
        },

        onRemoveModel: function () {
            // this must be event-based otherwise list and preview get out of sync
            this.remove();
        },

        render: function () {

            this.$el.empty().append(
                $('<span class="file">'),
                $('<span class="filesize">'),
                // progress?
                this.model.needsUpload() ? $('<div class="progress-container">').append($('<div class="progress">')) : $()
            );

            if (this.preview) this.preview.render();
            if (!this.preview) this.renderFileSize();

            this.renderContent();
            this.renderControls();

            return this;
        },

        renderFileSize: function () {
            var size = this.model.getSize();
            if (size > 0) this.$('.filesize').text(' (' + strings.fileSize(size, 1) + ')');
        },

        renderContent: function () {
            this.$('.file')
                .attr('title', this.model.getTitle())
                .text(this.model.getShortTitle(_.device('smartphone') ? 23 : 50));
        },

        renderControls: function () {
            this.$el.append(
                $('<a href="#" class="control remove">')
                    .attr('title', gt('Remove attachment'))
                    .append($('<i class="fa fa-trash-o" aria-hidden="true">'))
            );
        }
    });

    return {
        List: List,
        View: View,
        Preview: Preview,
        // export for convenience
        Model: backbone.Model,
        Collection: backbone.Collection
    };
});
