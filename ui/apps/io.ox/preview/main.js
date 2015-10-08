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
 * @author Stefan Preuss <stefan.preuss@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/preview/main', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/files/mediasupport',
    'gettext!io.ox/core'
], function (ext, capabilities, mediasupport, gt) {

    'use strict';

    var supportsDragOut = Modernizr.draganddrop && _.browser.Chrome;
    var dragOutHandler = $.noop;
    var clickableLink = $.noop;

    if (supportsDragOut) {
        dragOutHandler = function ($node) {
            $node.on('dragstart', function (e) {
                e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
            });
        };
        clickableLink = function (desc, clickHandler) {
            var $a = $('<a draggable="true" tabindex="1">').attr({
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
            var link = $('<a>', { href: desc.dataURL + '&delivery=view', target: '_blank', tabindex: 1 });
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
                        gt('Click to open. Drag to your desktop to download.') :
                        gt('Click to open.');
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

    // register audio typed renderer
    if (mediasupport.hasSupport('audio')) {
        Renderer.point.extend(new Engine({
            id: 'audio',
            index: 10,
            supports: (function () {
                return mediasupport.supportedExtensionsArray('audio');
            }()),
            verify: function (file) {
                // chrome cannot play audio files attachments (content-length issue; see bug 29491)
                return !file || !file.attachment || !_.device('chrome');
            },
            draw: function (file) {
                $('<audio>').attr({
                    src: file.dataURL + '&delivery=view&content_type=' + String(file.mimetype || '').split(';')[0],
                    type: file.mimetype,
                    preload: 'metadata',
                    controls: 'control',
                    autoplay: false
                }).hide().appendTo(this.on('click', function () { return false; }));
                var self = this;
                require([
                    'static/3rd.party/mediaelement/mediaelement-and-player.js',
                    'css!3rd.party/mediaelement/mediaelementplayer.css'
                ], function () {

                    var pw = self.closest('.file-details, .scrollable-pane').width() || '100%';

                    self.find('audio').mediaelementplayer({
                        audioWidth: pw,
                        videoWidth: pw,
                        plugins: ['flash', 'silverlight'],
                        pluginPath: 'apps/3rd.party/mediaelement/',
                        enableAutosize: false,
                        timerRate: 250,
                        features: ['playpause', 'progress', 'current', 'volume'],
                        enablePluginDebug: true,
                        pauseOtherPlayers: true,
                        keyActions: [{
                            // SPACE
                            keys: [32, 179],
                            action: function (player, media) {
                                if (media.paused || media.ended) {
                                    media.play();
                                } else {
                                    media.pause();
                                }
                            }
                        },
                        {
                            // RIGHT
                            keys: [39, 228],
                            action: function (player, media) {
                                var newVolume = Math.min(media.volume + 0.1, 1);
                                media.setVolume(newVolume);
                            }
                        },
                        {
                            // LEFT
                            keys: [37, 227],
                            action: function (player, media) {
                                var newVolume = Math.max(media.volume - 0.1, 0);
                                media.setVolume(newVolume);
                            }
                        }]
                    });
                });
            }
        }));
    }
    if (mediasupport.hasSupport('video')) {
        Renderer.point.extend(new Engine({
            id: 'video',
            index: 10,
            supports: (function () {
                return mediasupport.supportedExtensionsArray('video');
            }()),
            verify: function (file) {
                return !file || !file.attachment || !_.device('chrome');
            },
            draw: function (file) {
                $('<video>').attr({
                    src: file.dataURL + '&delivery=view&content_type=' + String(file.mimetype || '').split(';')[0],
                    type: file.mimetype,
                    preload: 'none',
                    controls: 'control',
                    autoplay: 'autoplay'
                }).appendTo(this.on('click', function () { return false; }));
                var self = this;
                require([
                    'static/3rd.party/mediaelement/mediaelement-and-player.js',
                    'css!3rd.party/mediaelement/mediaelementplayer.css'
                ], function () {
                    // TODO: sizing mediaplayer on changing viewport dimensions
                    var pw = self.closest('.file-details, .scrollable-pane').width() || '100%';
                    self.find('video').mediaelementplayer({
                        audioWidth: pw,
                        videoWidth: pw,
                        plugins: ['flash', 'silverlight'],
                        pluginPath: 'apps/3rd.party/mediaelement/',
                        enableAutosize: true,
                        timerRate: 250,
                        features: ['playpause', 'progress', 'current', 'volume'],
                        enablePluginDebug: true,
                        pauseOtherPlayers: true
                    });
                });
            }
        }));
    }

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
            require(['io.ox/core/emoji/util', 'less!io.ox/preview/style'], function (emoji) {
                $.ajax({ url: file.dataURL, dataType: 'text' }).done(function (text) {
                    // plain text preview with emoji support
                    // need to escape here; plain text might surprise with bad HTML
                    var html = emoji.processEmoji(_.escape(text));
                    node.addClass('preview-plaintext').html(html);
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
        if (this.options.width && _.isNumber(this.options.width))
            this.options.width = Math.floor(this.options.width);
        if (this.options.height && _.isNumber(this.options.height))
            this.options.height = Math.floor(this.options.height);

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
