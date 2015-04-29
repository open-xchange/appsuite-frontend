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
 */

define('io.ox/core/dropzone', [], function () {

    'use strict';

    var EVENTS = 'dragenter dragover dragleave drop';

    // Backbone Dropzone
    var InplaceDropzone = Backbone.View.extend({

        className: 'inplace-dropzone',

        events: {
            'drop': 'onDrop',
            'dragenter .dropzone-overlay': 'onDragenter',
            'dragover .dropzone-overlay': 'onDragover',
            'dragleave .dropzone-overlay': 'onDragleave'
        },

        onLeave: function (e) {
            if (this.leaving) this.hide(e);
        },

        onDrag: function (e) {
            if (!this.$el.parent().is(':visible')) return;
            switch (e.type) {
            case 'dragenter':
            case 'dragover':
                this.stop(e);
                this.leaving = false;
                if (!this.visible) this.show(e);
                return false;
            case 'dragleave':
                this.leaving = true;
                clearTimeout(this.timeout);
                this.timeout = setTimeout(this.onLeave.bind(this), 100, e);
                break;
            case 'drop':
                this.stop(e);
                this.hide();
                return false;
            }
        },

        stop: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },

        show: function (e) {
            // show dropzone
            if (!this.isFile(e)) return;
            this.visible = true;
            this.$el.show();
            this.trigger('show');
        },

        hide: function () {
            // hide dropzone
            this.visible = false;
            this.$el.hide().removeClass('dragover');
            this.trigger('hide');
        },

        initialize: function (options) {
            this.options = options;
            this.visible = false;
            this.leaving = false;
            this.timeout = -1;
            $(document).on(EVENTS, this.onDrag.bind(this));
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
        },

        isFile: function (e) {
            // we need this function to make sure the user drags
            // a file and not just selected text, for example.
            // adopted from: http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
            var dt = e.originalEvent.dataTransfer;
            if (_.browser.Firefox) return e.type === 'dragleave' ? dt.dropEffect === 'none' : dt.dropEffect !== 'none';
            return _(dt.types).contains('Files') || _(dt.types).contains('application/x-moz-file');
        },

        getFiles: function (e) {
            var files = _(e.originalEvent.dataTransfer.files).toArray(),
                filter = this.options.filter;
            // no regex?
            if (!_.isRegExp(filter)) return files;
            // apply regex to filter valid files
            return _(files).filter(function (file) {
                return filter.test(file.name);
            });
        },

        onDragenter: function (e) {
            // highlight dropzone
            $(e.currentTarget).parent().addClass('dragover');
        },

        onDragover: function (e) {
            // takes care of drop effect
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        },

        onDragleave: function (e) {
            // remove highlight
            $(e.currentTarget).parent().removeClass('dragover');
        },

        // while we can ignore document's drop event, we need this one
        // to detect that a file was dropped over the dropzone
        onDrop: function (e) {
            // final event when a file was dropped over the dropzone
            var files = this.getFiles(e);
            // call proper event
            this.trigger(files.length > 0 ? 'drop' : 'invalid', files, e);
        },

        render: function () {

            this.$el.hide().append(
                $('<div class="abs dropzone-caption">').text(this.options.caption || ''),
                $('<div class="abs dropzone-dragover"><i class="fa fa-check"></i></div>'),
                $('<div class="abs dropzone-overlay">')
            );

            return this;
        },

        dispose: function () {
            this.stopListening();
            $(document).off(EVENTS, this.onDrag);
        }
    });

    return {
        Inplace: InplaceDropzone
    };
});
