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

define('io.ox/preview/main',
    ['io.ox/core/extensions',
     'io.ox/core/capabilities',
     'io.ox/files/mediasupport',
     'gettext!io.ox/preview'
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
            var $a = $('<a>', { draggable: true, tabindex: 1 })
                .attr('data-downloadurl', desc.mimetype + ':' + desc.name + ':' + ox.abs + desc.dataURL + '&delivery=download');
            if (clickHandler) {
                $a.on('click', clickHandler);
            } else {
                $a.attr({ href: desc.dataURL + '&delivery=view', target: '_blank'});
            }
            return $a;
        };
    } else {
        clickableLink = function (desc, clickHandler) {
            var link = $('<a>', { href: desc.dataURL + '&delivery=view', target: '_blank', tabindex: 1});
            if (clickHandler) {
                link.on('click', clickHandler);
            }
            return link;
        };

    }

    var Renderer = {

        point: ext.point('io.ox/preview/engine'),

        getByExtension: function (fileExtension) {
            return this.point.chain().find(function (ext) {
                var tmp = ext.metadata('supports');
                tmp = _.isArray(tmp) ? tmp : [tmp];
                return _(tmp).contains(fileExtension);
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
                    if (supportsDragOut) {
                        $node.attr('title', gt('Click to open. Drag to your desktop to download.'));
                    } else {
                        $node.attr('title', gt('Click to open.'));
                    }
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
            var param = {
                width: options.width || 400,
                height: options.height || 400,
                scaleType: options.scaleType || 'contain',
                delivery: 'view'
            };
            if (options.height === 'auto') {
                delete param.height;
            }
            this.append(
                $('<img>', { src: file.dataURL + '&' + $.param(param), alt: 'Preview' }));
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
            draw: function (file) {
                $('<audio>').attr({
                    src: file.dataURL + '&delivery=view&content_type=' + file.mimetype,
                    type: file.mimetype,
                    preload: 'metadata',
                    controls: 'control',
                    autoplay: false
                }).hide().appendTo(this.on('click', function () { return false; }));
                var self = this;
                require(['apps/mediaelement/mediaelement-and-player.js',
                        'css!mediaelement/mediaelementplayer.css'], function () {

                    var pw = self.closest('.file-details, .scrollable-pane').width() || '100%';

                    self.find('audio').mediaelementplayer({
                        audioWidth: pw,
                        videoWidth: pw,
                        plugins: ['flash', 'silverlight'],
                        pluginPath: 'apps/mediaelement/',
                        enableAutosize: false,
                        timerRate: 250,
                        features: ['playpause', 'progress', 'current', 'volume'],
                        enablePluginDebug: true,
                        pauseOtherPlayers: true,
                        keyActions: [{
                            keys: [32, 179], // SPACE
                            action: function (player, media) {
                                if (media.paused || media.ended) {
                                    media.play();
                                } else {
                                    media.pause();
                                }
                            }
                        },
                        {
                            keys: [39, 228], // RIGHT
                            action: function (player, media) {
                                var newVolume = Math.min(media.volume + 0.1, 1);
                                media.setVolume(newVolume);
                            }
                        },
                        {
                            keys: [37, 227], // LEFT
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

    Renderer.point.extend(new Engine({
        id: 'eml',
        supports: ['eml', 'message/rfc822'],
        draw: function (file) {
            var self = this;
            require(['io.ox/mail/view-detail'], function (view) {
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
                self.append(view.draw(data).css('padding', 0));
            });
        },
        omitClick: true
    }));

    Renderer.point.extend(new Engine({
        id: 'text',
        supports: ['txt', 'plain/text', 'asc', 'js', 'md'],
        draw: function (file) {
            var node = this;
            require(['io.ox/core/emoji/util', 'less!io.ox/preview/style.less'], function (emoji) {
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

        this.file = _.copy(file, true); // work with a copy
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
        if (this.extension || this.file.mimetype) {
            this.renderer = Renderer.getByExtension(this.extension || this.file.mimetype);
        }
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
