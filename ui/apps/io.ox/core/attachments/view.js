/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/attachments/view', [
    'io.ox/core/attachments/backbone',
    'io.ox/core/strings',
    'gettext!io.ox/core',
    'less!io.ox/core/attachments/style'
], function (backbone, strings, gt) {

    'use strict';

    //
    // New attachment list (combines a flat list and a preview)
    //

    var List = Backbone.View.extend({

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

            // Previewmode on smartpfone as default
            if (_.device('smartphone')) this.$el.addClass('show-preview');

            this.$header = $('<header role="heading">');
            this.$list = $('<ul class="inline-items">');
            this.$preview = $('<ul class="inline-items preview">');
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
            });

            // initial toggle if empty
            this.$el.toggleClass('empty', this.getValidModels().length === 0);
        },

        render: function () {

            this.renderHeader();

            this.$el.append(
                // header
                this.$header,
                // short list
                $('<div class="list-container">').append(
                    this.$list
                ),
                // preview list
                $('<div class="preview-container">').append(
                    $('<button type="button" class="scroll-left"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>'),
                    $('<button type="button" class="scroll-right"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>'),
                    this.$preview
                )
            );

            this.updateScrollControls();

            if (this.openByDefault) this.toggleDetails();

            return this;
        },

        renderHeader: function () {

            this.$header.append(
                $('<a href="#" class="pull-right toggle-mode">').append('<i class="fa">'),
                $('<a href="#" class="toggle-details" tabindex="1">').append(
                    $('<i class="fa toggle-caret" aria-hidden="true">'),
                    $('<i class="fa fa-paperclip" aria-hidden="true">'),
                    $('<span class="summary">')
                ),
                $('<span class="links">')
            );

            this.renderSummary();
        },

        renderSummary: function (length) {
            length = length || this.getValidModels().length;
            this.$header.find('.summary').text(
                gt.format(gt.ngettext('%1$d attachment', '%1$d attachments', length), length)
            );
        },

        renderList: function () {

            // use inner function cause we do this twice
            function render(list, target, mode) {
                target.append(
                    _(list).map(this.renderAttachment.bind(this, mode))
                );
            }

            var models = this.getValidModels();
            render.call(this, models, this.$list, 'list');
            render.call(this, models, this.$preview, 'preview');

            this.isListRendered = true;
        },

        renderAttachment: function (mode, model) {
            return new this.options.AttachmentView({ mode: mode, model: model }).render().$el;
        },

        addAttachment: function (model) {
            if (!this.isListRendered) return;
            this.$list.append(this.renderAttachment('list', model));
            this.$preview.append(this.renderAttachment('preview', model));
        },

        filter: function (model) {
            return model.isFileAttachment();
        },

        getValidModels: function () {
            return this.collection.filter(this.filter, this);
        },

        toggleDetails: function () {
            this.$el.toggleClass('open');
            if (!this.isListRendered) this.renderList();
        },

        onToggleDetails: function (e) {
            e.preventDefault();
            this.toggleDetails();
        },

        onToggleMode: function (e) {
            e.preventDefault();
            this.$el.toggleClass('show-preview');
            // to provoke lazyload
            this.$preview.trigger('scroll');
            this.updateScrollControls();
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
            return Math.round(this.$preview.scrollLeft() / this.scrollStep);
        },

        getMaxScrollIndex: function () {
            var width = this.$preview.width(), scrollWidth = this.$preview.prop('scrollWidth');
            return Math.max(0, Math.ceil((scrollWidth - width) / this.scrollStep));
        },

        updateScrollControls: function (index, max) {
            if (index === undefined) index = this.getScrollIndex();
            var max = this.getMaxScrollIndex();
            this.$('.scroll-left').attr('disabled', index <= 0 ? 'disabled' : null);
            this.$('.scroll-right').attr('disabled', index >= max ? 'disabled' : null);
        }
    });

    var Preview = Backbone.View.extend({

        className: 'preview',

        initialize: function () {
            this.listenTo(this.model, 'change:meta', function () {
                if (this.$el.hasClass('lazy')) return;
                // render again since we might now have a preview URL
                this.$('.fallback').remove();
                this.render();
            });
        },

        lazyload: function () {
            // use defer to make sure this view has already been added to the DOM
            _.defer(function () {
                this.$el.lazyload({ container: this.$el.closest('ul'), effect: 'fadeIn' });
            }.bind(this));
        },

        getColor: function (extension) {
            // word blue
            if (/^do[ct]x?$/.test(extension)) return '#2C5897';
            // excel green
            if (/^xlsx?$/.test(extension)) return '#1D7047';
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
                $('<div class="abs fallback">')
                    .css({ color: color && 'white', backgroundColor: color })
                    .text(extension)
            );
        },

        render: function () {
            var url = this.model.previewUrl();
            if (_.isString(url)) {
                this.$el.addClass('lazy').attr('data-original', url);
                this.lazyload();
            } else {
                this.fallback();
            }
            return this;
        }
    });

    var View = Backbone.View.extend({

        tagName: 'li',
        className: 'item',

        events: {
            'click .remove': 'onRemove'
        },

        attributes: function () {
            return { 'data-id': this.model.get('id') };
        },

        initialize: function (options) {

            this.options = _.extend({ mode: 'list' }, options);

            this.preview = this.options.mode === 'preview' && new Preview({ model: this.model, el: this.el });

            this.listenTo(this.model, {
                'change:uploaded': function (model) {
                    var w = model.get('uploaded') * this.$el.width();
                    this.$('.progress').width(w);
                },
                'upload:complete': function () {
                    this.render();
                },
                'remove': this.onRemoveModel
            });
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

            this.$el.append(
                $('<span class="file">'),
                $('<span class="filesize">'),
                // progress?
                this.model.needsUpload() ? $('<div class="progress">') : $()
            );

            if (this.preview) this.preview.render();
            if (!this.preview) this.renderFileSize();

            this.renderContent();
            this.renderControls();

            return this;
        },

        renderFileSize: function () {
            var size = this.model.getSize();
            if (size) this.$('.filesize').text(' (' + strings.fileSize(size) + ')');
        },

        renderContent: function () {
            this.$('.file').text(this.model.getShortTitle());
        },

        renderControls: function () {
            this.$el.append(
                $('<a href="#" class="control remove" tabindex="1">')
                    .attr('title', gt('Remove attachment'))
                    .append($('<i class="fa fa-trash-o">'))
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
