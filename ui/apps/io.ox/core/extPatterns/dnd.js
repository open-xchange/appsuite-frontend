/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/extPatterns/dnd', [
    'io.ox/core/extensions',
    'io.ox/core/tk/upload'
], function (ext, upload) {

    'use strict';

    var UploadZone = function () {

        var dropZone, point, included = false, args = $.makeArray(arguments), options = args.shift();

        point = ext.point(options.ref);

        function handleDrop(event, extensionId, file, action) {
            var newArgs = [file];
            _(args).each(function (arg) {
                newArgs.push(arg);
            });
            if (action.extension && action.extension.action) {
                action.extension.action.apply(action.extension, newArgs);
            }
        }

        function handleMultiDrop(e, action, files) {
            if (action.extension && action.extension.multiple) {
                action.extension.multiple.apply(action.extension, [files].concat(args));
            }
        }

        function initDropZone() {
            var actions = [];

            if (included) {
                dropZone.remove();
            }

            if (dropZone) {
                dropZone.off('drop', handleDrop);
            }

            point.each(function (ext) {
                if (ext.isEnabled && !ext.isEnabled.apply(ext, args)) {
                    return;
                }

                actions.push({
                    id: ext.id,
                    label: ext.metadata('label', args),
                    extension: ext
                });
            });

            dropZone = upload.dnd.createDropZone({
                type: 'multiple',
                actions: actions
            });

            if (_.isFunction(dropZone.on)) {
                // temp. fix: avoids strange opera runtime error
                dropZone.on('drop', handleDrop);
                dropZone.on('drop-multiple', handleMultiDrop);
            }

            if (included) {
                dropZone.include();
            }
        }

        initDropZone();

        point.on('extended', initDropZone);

        this.update = function () {
            initDropZone();
        };

        this.include = function () {
            dropZone.include();
            included = true;
        };

        this.remove = function () {
            dropZone.remove();
            included = false;
        };
    };

    // Backbone Dropzone
    var InplaceDropzone = Backbone.View.extend({

        className: 'inplace-dropzone',

        events: {
            'drop': 'onDrop'
        },

        onDrag: function (e) {
            switch (e.type) {
                case 'dragenter':
                    this.show();
                    break;
                case 'drop':
                    e.preventDefault();
                /* falls through */
                case 'dragleave':
                    this.hide();
                    break;
                // no default
            }
        },

        onDrop: function () {
            console.log('DROP!');
        },

        show: function () {
            console.log('Show!');
        },

        hide: function () {
            console.log('Hide!');
        },

        initialize: function (options) {
            this.options = options;
            $(document).on('dragenter dragleave drop', $.proxy(this.onDrag, this));
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
        },

        render: function () {
            return this;
        },

        dispose: function () {
            this.stopListening();
            $(document).off('dragenter dragleave drop', this.onDrag);
        }
    });

    return {
        UploadZone: UploadZone,
        InplaceDropzone: InplaceDropzone
    };
});
