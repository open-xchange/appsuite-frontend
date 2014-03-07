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
            'drop': 'onDrop'
        },

        onLeave: function (e) {
            if (this.leaving) this.hide(e);
        },

        onDrag: function (e) {
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
            if (!this.accepts(e)) return;
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

        drop: function (e) {
            // final event when a file was dropped over the dropzone
            var files = _(e.originalEvent.dataTransfer.files).toArray();
            // filter valid files
            files = _(files).filter(this.filter, this);
            // call proper event
            this.trigger(files.length > 0 ? 'drop' : 'invalid', files, e);
        },

        initialize: function (options) {
            this.options = options;
            this.visible = false;
            this.leaving = false;
            this.timeout = -1;
            $(document).on(EVENTS, $.proxy(this.onDrag, this));
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
        },

        isFile: function (e) {
            // adopted from: http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
            var dt = e.originalEvent.dataTransfer;
            if (_.browser.Firefox) return e.type === 'dragleave' ? dt.dropEffect === 'none' : dt.dropEffect !== 'none';
            return _(dt.types).contains('Files') || _(dt.types).contains('application/x-moz-file');
        },

        accepts: function (e) {
            // we need this function to make sure the user drags
            // a file and not just selected text, for example.
            return this.isFile(e);
        },

        filter: function (file) {
            // apply regex to filter valid files
            var filter = this.options.filter, name = file.name;
            return !_.isRegExp(filter) || filter.test(name);
        },

        render: function () {

            this.$el.hide().append(
                $('<div class="abs dropzone-caption">').text(this.options.text || ''),
                $('<div class="abs dropzone-dragover"><i class="icon-ok"></i></div>'),
                $('<div class="abs dropzone-overlay">').on({
                    // highlight dropzone
                    'dragover': function (e) {
                        $(this).parent().addClass('dragover');
                        e.originalEvent.dataTransfer.dropEffect = 'copy';
                    },
                    // remove highlight
                    'dragleave': function () {
                        $(this).parent().removeClass('dragover');
                    },
                    // while we can ignore document's drop event, we need this one
                    // to detect that a file was dropped over the dropzone
                    'drop': this.drop.bind(this)
                })
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
