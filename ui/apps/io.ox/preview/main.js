/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Stefan Preuss <stefan.preuss@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/preview/main',
    ['io.ox/core/extensions',
     'io.ox/core/capabilities',
     'gettext!io.ox/preview'], function (ext, capabilities, gt) {

    'use strict';

    var supportsDragOut = Modernizr.draganddrop && _.browser.Chrome;
    var dragOutHandler = $.noop;
    var clickableLink = $.noop;

    if (supportsDragOut) {
        dragOutHandler = function ($node, desc) {
            $node.on('dragstart', function (e) {
                e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
            });
        };
        clickableLink = function (desc, clickHandler) {
            var $a = $('<a>', { draggable: true })
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
            var link = $('<a>', { href: desc.dataURL + '&delivery=view', target: '_blank'});
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
    if (Modernizr.audio) {
        Renderer.point.extend(new Engine({
            id: 'audio',
            index: 10,
            supports: (function () {
                var tmp = [];
                $.each(Modernizr.audio, function (id, elem) {
                    tmp.push(id);
                });
                return tmp;
            }()),
            draw: function (file) {
                var audiofile = $('<audio>').attr({
                    src: file.dataURL,
                    type: file.mimetype,
                    preload: 'metadata',
                    controls: 'control',
                    autoplay: false
                }).hide().appendTo(this.on('click', function () { return false; }));
                var self = this;
                require(['apps/mediaelement/mediaelement-and-player.js',
                        'css!mediaelement/mediaelementplayer.css'], function () {

                    var pw = self.closest('.file-details').width();

                    self.find('video, audio').mediaelementplayer({
                        audioWidth: pw,
                        videoWidth: pw,
                        plugins: ['flash', 'silverlight'],
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

    function previewLoaded() {
        $(this).css('visibility', '').closest('div').idle();
    }

    function previewFailed() {
        $(this).closest('div').empty();
    }

    // if available register office typed renderer
    if (capabilities.has('document_preview')) {
        Renderer.point.extend(new Engine({
            id: 'office',
            index: 10,
            supports:  ['doc', 'dot', 'docx', 'dotx', 'docm', 'dotm', 'xls', 'xlt', 'xla', 'xlsx', 'xltx', 'xlsm',
             'xltm', 'xlam', 'xlsb', 'ppt', 'pot', 'pps', 'ppa', 'pptx', 'potx', 'ppsx', 'ppam', 'pptm', 'potm', 'ppsm', 'pdf',
             'odt', 'ods', 'odp', 'odg', 'odc', 'odf', 'odi', 'odm', 'otg', 'otp', 'ott', 'ots', 'rtf' ],
            getUrl: function (file, options) {
                options = _.extend({ width: 400 }, options);
                var url = file.dataURL || file.url;
                return url + '&format=preview_image&width=' + options.width + '&delivery=view&scaleType=contain';
            },
            draw: function (file, options) {

                var $a = clickableLink(file, function (e) {
                        e.preventDefault();
                        if (file.module) {
                            file.source = 'task';
                            file.folder_id = file.folder;
                        } else if (file.data && file.data.mail) {
                            file.folder_id = file.data.mail.folder_id;
                            file.attached = file.data.id;
                            file.id = file.data.mail.id;
                            file.source = 'mail';
                        }

                        ox.launch('io.ox/office/preview/main', { action: 'load', file: file });
                    }),
                    width = options.width || '400',
                    $img = $('<img alt="">')
                        .css({ width: width + 'px', maxWidth: '100%', visibility: 'hidden' })
                        .addClass('io-ox-clickable')
                        .on({ load: previewLoaded, error: previewFailed });

                this.busy();

                // setting src now; just helpful for debugging/setTimeout
                $img.attr('src', file.dataURL + '&format=preview_image&width=' + width + '&delivery=view&scaleType=contain');

                $a.append($img);
                dragOutHandler($a);
                this.append($a);
            },
            omitDragoutAndClick: true
        }));
    }

    Renderer.point.extend(new Engine({
        id: 'eml',
        supports: ['eml', 'message/rfc822'],
        draw: function (file) {
            var self = this;
            require(['io.ox/mail/view-detail',
                      'io.ox/mail/util'], function (view, util) {
                var data = file.data.nested_message;
                util.removeChannelSuffix(data);
                data.parent = file.parent;
                //preview during compose (forward mail as attachment)
                if (!data.parent && data.msgref) {
                    /**
                     * removes first element of string list (separator '.')
                     * @example '2.3.2' becomes '3.2'
                     * @param  {string} id
                     * @return {string}
                     */
                    //TODO: (frank) there must be a better solution
                    var adjust = function (id) {
                        var list = id.split('.');
                        if (list.length > 1)
                            return list.splice(1, list.length).join('.');
                        else
                            return id;
                    };
                    //get folder and id via msgref
                    var ids = data.msgref.split('/'),
                        id = ids.pop(),
                        folder = ids.join('/');
                    //set parent
                    data.parent = {
                        id: id,
                        folder: folder,
                        folder_id: folder,
                        adjustid: adjust
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
            $.ajax({ url: file.dataURL, dataType: 'text' }).done(function (text) {
                // plain text preview
                node.addClass('plaintext').text(_.noI18n(text));
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
