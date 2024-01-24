/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/preview/main', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/files/mediasupport',
    'gettext!io.ox/core'
], function (ext, capabilities, mediasupport, gt) {

    'use strict';

    // was: Modernizr.draganddrop but that test is gone
    var supportsDragOut = !!_.browser.Chrome;
    var dragOutHandler = $.noop;
    var clickableLink = $.noop;

    if (supportsDragOut) {
        dragOutHandler = function ($node) {
            $node.on('dragstart', function (e) {
                e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
            });
        };
        clickableLink = function (desc, clickHandler) {
            var $a = $('<a draggable="true">').attr({
                'data-downloadurl': desc.mimetype + ':' + desc.name + ':' + ox.abs + desc.downloadURL
            });
            if (clickHandler) {
                $a.on('click', clickHandler);
            } else {
                $a.attr({ href: desc.dataURL + '&delivery=view', target: '_blank' });
            }
            return $a;
        };
    } else {
        clickableLink = function (desc, clickHandler) {
            var link = $('<a target="_blank">', { href: desc.dataURL + '&delivery=view' });
            if (clickHandler) link.on('click', clickHandler);
            return link;
        };
    }

    var Renderer = {

        point: ext.point('io.ox/preview/engine'),

        getByExtension: function (fileExtension, file) {
            return this.point.chain().find(function (ext) {
                var tmp = ext.metadata('supports', fileExtension, file), match;
                tmp = _.isArray(tmp) ? tmp : [tmp];
                match = _(tmp).contains(fileExtension);
                return (match && _.isFunction(ext.verify)) ? ext.verify(file) : match;
            }).value();
        }
    };

    var Engine = function (options) {
        _.extend(this, options);
        if (!options.omitDragoutAndClick) {
            this.draw = function (file) {

                var $node;

                if (!options.omitClick) {
                    $node = clickableLink(file);
                    var label = supportsDragOut ?
                        gt('Open file. Drag to your desktop to download.') :
                        gt('Open file');
                    $node.attr({
                        'title': label,
                        'aria-label': $node.attr('aria-label') || label
                    });
                } else {
                    $node = $('<div>');
                }

                options.draw.apply($node, arguments);
                dragOutHandler($node, file);

                this.append($node);
            };
        }
    };

    // register image typed renderer
    Renderer.point.extend(new Engine({
        id: 'image',
        index: 10,
        supports: ['image/png', 'png', 'image/jpeg', 'jpg', 'jpeg', 'image/gif', 'gif', 'bmp'],
        draw: function (file, options) {

            var param, url = file.previewURL || file.dataURL;

            if (options.resize !== false) {
                param = {
                    width: options.width || 400,
                    height: options.height || 400,
                    scaleType: options.scaleType || 'contain',
                    delivery: 'view'
                };
                if (options.height === 'auto') delete param.height;
                if (options.width === 'auto') delete param.width;
                url += '&' + $.param(param);
            }

            this.append(
                $('<img>', { src: url, alt: gt('Preview') })
            );
        }
    }));

    Renderer.point.extend(new Engine({
        id: 'eml',
        supports: ['eml', 'message/rfc822'],
        verify: function (file) {
            // doesn't work for pim attachments
            return !file.pim;
        },
        draw: function (file) {
            var self = this.busy();
            require(['io.ox/mail/detail/view'], function (detail) {
                var data = file.data.nested_message;
                data.parent = file.parent;
                //preview during compose (forward mail as attachment)
                if (!data.parent && data.msgref) {
                    //get folder and id via msgref
                    var ids = data.msgref.split('/'),
                        id = ids.pop(),
                        folder = ids.join('/');
                    //set parent
                    data.parent = {
                        id: id,
                        folder: folder,
                        folder_id: folder,
                        needsfix: true
                    };
                }
                var view = new detail.View({ data: data, loaded: true });
                self.idle().append(view.render().expand().$el.addClass('no-padding'));
            });
        },
        omitClick: true
    }));

    Renderer.point.extend(new Engine({
        id: 'text',
        supports: ['txt', 'plain/text', 'asc', 'js', 'md', 'json', 'csv'],
        draw: function (file) {
            var node = this;
            require(['less!io.ox/preview/style'], function () {
                $.ajax({ url: file.dataURL, dataType: 'text' }).done(function (text) {
                    // plain text preview
                    node.text(text);
                });
            });
        },
        omitClick: true
    }));

    var Preview = function (file, options) {

        var self = this;

        // work with a copy
        this.file = _.copy(file, true);
        this.options = options || {};

        //ensure integer (if numeric) for valid url params
        if (this.options.width && _.isNumber(this.options.width)) {
            this.options.width = Math.floor(this.options.width);
        }
        if (this.options.height && _.isNumber(this.options.height)) {
            this.options.height = Math.floor(this.options.height);
        }

        this.renderer = null;

        if (this.file.file_mimetype) {
            this.file.mimetype = this.file.file_mimetype;
        } else if (!this.file.mimetype) {
            this.file.mimetype = 'application/octet-stream';
        }

        if (this.file.filename) {
            this.file.name = this.file.filename;
        }

        this.extension = (function () {
            var extension = String(self.file.name || '').match(/\.([a-z0-9]{2,})$/i);
            if (extension && extension.length > 0) {
                return String(extension[1]).toLowerCase();
            }
            return '';
        }());

        // get matching renderer
        this.renderer =
            // try by extension first
            (this.extension && Renderer.getByExtension(this.extension, this.file)) ||
            // try by mime type
            (this.file.mimetype && Renderer.getByExtension(this.file.mimetype, this.file)) ||
            // otherwise
            undefined;
    };

    Preview.prototype = {

        getRenderer: function () {
            return this.renderer;
        },

        supportsPreview: function () {
            return !!this.renderer;
        },

        appendTo: function (node) {
            if (this.supportsPreview()) {
                this.renderer.invoke('draw', node, this.file, this.options);
            }
        }
    };

    function Extension(options) {
        _.extend(this, options);

        var self = this;

        if (!this.isEnabled) {
            this.isEnabled = function (fileDescription) {
                if (options.parseArguments) {
                    fileDescription = options.parseArguments.apply(self, arguments);
                }
                if (!fileDescription) {
                    return false;
                }
                var prev = new Preview(fileDescription, options);
                return prev.supportsPreview();
            };
        }

        if (!this.draw) {
            this.draw = function (fileDescription) {
                if (options.parseArguments) {
                    fileDescription = options.parseArguments.apply(self, arguments);
                }
                if (!fileDescription) {
                    return false;
                }
                var prev = new Preview(fileDescription, options);
                prev.appendTo(this);
            };
        }
    }

    return {
        Preview: Preview,
        Renderer: Renderer,
        Engine: Engine,
        Extension: Extension,
        protectedMethods: {
            clickableLink: clickableLink,
            dragOutHandler: dragOutHandler
        },

        // convenience method
        getPreviewImage: function (file) {
            var preview = new Preview(file);
            window.preview = preview;
            return preview && preview.renderer && preview.renderer.getUrl ? preview.renderer.getUrl(file) : '';
        }
    };
});
