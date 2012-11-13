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
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('io.ox/portal/mediaplugin',
    ['io.ox/core/extensions',
     'io.ox/core/flowControl',
     'gettext!io.ox/portal',
     'less!io.ox/portal/mediaplugin.css',
     'less!io.ox/core/fancybox/jquery.fancybox-1.3.4.css',
     'apps/io.ox/core/fancybox/jquery.fancybox-1.3.4.pack.js'], function (ext, control, gt) {

    'use strict';

    var MediaPlugin = function () {
        var feeds = [],
            presentation = [],
            mpext = {},
            entrySelector = 'div.scrollable-pane > div > div.io-ox-portal-mediaplugin > div.mediaplugin-entry';

        var options = {bigPreview: false, elementsPerPage: 20};

        var setOptions = function (o) {
            options = $.extend(options, o);
        };

        var escape = function (html) {
            var newHtml = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            newHtml = html.replace(/<([^>]+)>/g, function (match, contents) {
                var allowed = ['p', '/p', 'ul', '/ul', 'li', '/li', 'strong', '/strong', 'br', 'br/', 'blockquote', '/blockquote', 'span', '/span', '/a'];

                if (_.include(allowed, contents) || contents.substring(0, 2) === 'a ') {
                    return '<' + contents + '>';
                } else {
                    return '&lt;' + contents + '&gt;';
                }
            });
            return newHtml;
        };

        var addFeed = function (data) {
            feeds.push(data);
        };

        var loadFeed = function (extension, count, offset) {
            var callback = 'mpcb_' + extension.id.replace(/[^a-z0-9]/g, '_') + "_" + new Date().getTime();

            if (count) {
                callback += "_" + count;
            }

            if (offset) {
                callback += "_" + offset;
            }

            var myurl = extension.url + callback;

            if (offset || count) {
                myurl = mpext.appendLimitOffset(myurl, count, offset);
            }

            return $.ajax({
                url: myurl,
                dataType: 'jsonp',
                jsonp: false,
                jsonpCallback: callback
            }).pipe(function (data) {
                if (mpext.determineSuccessfulResponse) {
                    return mpext.determineSuccessfulResponse(data);
                } else {
                    return data;
                }
            });
        };

        var drawTile = function (extension, $node, data, counter) {
            var $preview = elementPreview(data, counter, extension);
            $node.append($preview);
        };

        var loadTile = function (extension) {
            return loadFeed(extension, options.elementsPerPage);
        };

        var resizeImage = function ($img, maxWidth, maxHeight) {
            if ($img.width() && $img.height()) {
                if ($img.width() > maxWidth && $img.width() > $img.height()) {
                    $img.css('width', maxWidth + 'px');
                    $img.css('height', 'auto');
                } else if ($img.height() > maxHeight) {
                    $img.css('height', maxHeight + 'px');
                    $img.css('width', 'auto');
                } else {
                    $img.attr({
                        width: $img.width(),
                        height: $img.height()
                    });
                }
            }
        };

        var popupContent = function ($popup, entry, lastClickedOn) {
            if (mpext.getImagesFromEntry) {
                var tempImageCollection = [];
                $(entrySelector).each(function (key, val) {
                    var entry = $(val).data("entry");
                    mpext.getImagesFromEntry(entry, tempImageCollection);
                });

                if (tempImageCollection.length > 0) {
                    $('<a/>')
                        .addClass('label io-ox-action-link')
                        .css({'cursor': 'pointer', 'float': 'right'})
                        .text(gt('Fullscreen'))
                        .appendTo($popup)
                        .on('click', function () {
                                var i = lastClickedOn - 1;

                                // Push visible and all following images to our collection
                                presentation = tempImageCollection.splice(i);

                                // Push already seen images to the collection for cycling through all images
                                if (lastClickedOn > 0) {
                                    // TODO fix mixed (photos, videos, text) blogs
                                    presentation = presentation.concat(tempImageCollection.splice(0, i));
                                }

                                $.fancybox(presentation,
                                {
                                    'cyclic': true,
                                    'type': 'image',
                                    'autoDimensions': true,
                                    'transitionIn': 'none',
                                    'transitionOut': 'none',
                                    'overlayOpacity': '0.9'
                                });
                            });
                }
            }

            var $busyIndicator = $('<div/>').html('&nbsp;').addClass('io-ox-busy');
            $popup.append($busyIndicator);

            if (mpext.popupContent) {
                mpext.popupContent($popup, entry, $busyIndicator);
            }
        };

        var elementPreview = function (entry, counter, extension) {
            var $entry = $("<div>").addClass("mediaplugin-entry").data("entry", entry).attr({'data-counter': counter});//.css({'border': '1px solid red'});

            if (mpext.elementPreview) {
                var $img = mpext.elementPreview($entry, entry);

                if ($img !== false) {
                    if (options.bigPreview) {
                        // Determine if tile-preview or sidepopup
                        if (extension && extension.id) {
                            $('div[widget-id="' + extension.id + '"]').css({
                                'background-image': 'url(' + $img.attr('data-original') + ')',
                                'background-size': 'cover',
                                'background-repeat': 'no-repeat',
                                'position': 'relative'
                            });

                            $('div[widget-id="' + extension.id + '"] > h1').addClass("io-ox-portal-mediaplugin-big").css({
                                opacity: 0.7,
                                position: "absolute",
                                bottom: "0px",
                                width: "100%"
                            });
                            $entry.addClass("mediaplugin-entry-big-tile").css({opacity: 0.7});
                        } else {
                            $img.css({height: 'auto'});
                            if ($img.attr('data-original')) {
                                $img.attr({src: 'apps/themes/default/grey.gif'})
                                    .addClass('lazy');
                            }
                            $entry.append($img);
//                            $entry.find('div').css({opacity: 0.7});
                            $entry.addClass("mediaplugin-entry-big");
                        }
                    } else {
                        $entry.append($img);
                    }
                }
            }
//            $entry.append($("<div>").css({'clear': 'both', 'float': ''}));

            return $entry;
        };

        var lazyLoader = function () {
            $('img.lazy[src!=data-original]').lazyload({container: $('div.io-ox-sidepopup-pane'), threshold: 200});
        };

        var init = function (m) {
            mpext = m;

            var requiredMethods = ['determineSuccessfulResponse', 'getDataArray', 'appendLimitOffset', 'appendLimitOffset', 'elementPreview', 'popupContent', 'getImagesFromEntry'];

            for (var i = 0; i < requiredMethods.length; i++) {
                var method = requiredMethods[i];
                if (!m[method]) {
                    console.error("Missing function " + method);
                    throw new Error("Missing function " + method);
                }
            }

            _(feeds).each(function (extension) {
                var $mediapluginEntries = $('<div>').addClass('io-ox-portal-mediaplugin').attr({'tabindex': 1});
                var $busyIndicator = $('<div>').html('&nbsp;');
                var offset = 0;
                var lastClickedOn = 0;
                var counter = 0;
                var dataFromPreview = false;

                ext.point("io.ox/portal/widget").extend({
                    id: extension.id,
                    index: extension.index,
                    tileClass: options.bigPreview ? 'io-ox-portal-widget-phototile' : '',
                    tileType: 'B',
                    title: extension.description,

                    preview: function () {
                        var deferred = $.Deferred();
                        loadTile(extension).done(function (j) {
                            dataFromPreview = j;

                            var data = mpext.getDataArray(j);

                            if (!data || data && data.length === 0) {
                                console.log("cancel loading of " + extension.id);
                                deferred.resolve(control.CANCEL);
                                return;
                            }

                            var $node = $('<div/>').addClass('io-ox-portal-mediaplugin');
                            drawTile(extension, $node, data[0], counter++);
                            deferred.resolve($node);
                        }).fail(function () {
                            deferred.resolve(control.CANCEL);
                            return;
                        });
                        return deferred;
                    },

                    load: function () {
                        if (dataFromPreview !== false) {
                            var def = new $.Deferred();
                            def.resolve(dataFromPreview);
                            return def;
                        } else {
                            return loadFeed(extension, options.elementsPerPage);
                        }
                    },

                    loadMoreResults: function (finishFn) {
                        $busyIndicator.addClass('io-ox-busy');

                        offset++;

                        $.when(loadFeed(extension, options.elementsPerPage, offset), _.wait(1000)).done(function (j) {
                                _(mpext.getDataArray(j)).each(function (entry) {
                                    $mediapluginEntries.append(elementPreview(entry, counter++));
                                });
                                lazyLoader();

                                finishFn($busyIndicator);
                                console.log("loadMoreResults done");
                            })
                            .fail(function () {
                                console.log("loadMoreResults error");
                                finishFn($busyIndicator);
                            });
                    },

                    draw: function (j) {
                        var self = this;

                        var onKeyDown = function (e) {
                            var showPopup = false;
                            var event = $.Event();

                            if (e.which === 40) {
                                lastClickedOn++;
                                showPopup = true;
                            } else if (e.which === 38) {
                                lastClickedOn--;
                                showPopup = true;
                            }

                            if (showPopup) {
                                if (lastClickedOn > 0) {
                                    // zero based
                                    event.target = $(entrySelector + ':eq(' + (lastClickedOn - 1) + ')');
                                } else {
                                    event.target = null;
                                }

                                if (event.target === null || event.target.length === 0) {
                                    showPopup = false;
                                    if (e.which === 40) {
                                        lastClickedOn--;
                                    } else if (e.which === 38) {
                                        lastClickedOn++;
                                    }
                                }
                            }

                            if (showPopup) {
                                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                    var $o = $('div.io-ox-sidepopup-pane');
                                    var top = $o.scrollTop() - $o.offset().top + event.target.offset().top;
                                    $o.animate({scrollTop: top}, 250, 'swing', function () {
                                        new dialogs.SidePopup({disableCloseByScroll: true}).show(event, function (popup, e, el) {
                                            popupContent(popup, el.data("entry"), el.attr('data-counter'));
                                        });
                                    });
                                });

                                return false;
                            }
                        };

                        $(this).on('onResume', function () {
                            console.log('onResume');
                            $(document).on('keydown', onKeyDown);
                        });

                        $(this).on('onAppended', function () {
                            lazyLoader();
                        });

                        $(this).on('onPause', function () {
                            console.log('onPause');
                            $(document).off('keydown', onKeyDown);
                        });

                        $('<h1>').addClass('clear-title').text(mpext.getTitle ? mpext.getTitle(j) : extension.description || "Media").appendTo(self);
                        $mediapluginEntries.empty().appendTo(self);
                        $busyIndicator.appendTo(self);

                        var deferred = new $.Deferred();

                        require(
                                ["io.ox/core/tk/dialogs"],
                                function (dialogs) {
                                    _(mpext.getDataArray(j)).each(function (entry) {
                                        $mediapluginEntries.append(elementPreview(entry, counter++));
                                    });

                                    // TODO Additional link for more results?
            //                        var $more = $('<a/>', {id: 'mediaplugin-more-results'})
            //                            .text(gt("More results..."))
            //                            .click(function () {
            //                                $(this).trigger('moreResults-' + extension.id);
            //                            });
            //                        self.append($more);

                                    new dialogs.SidePopup({disableCloseByScroll: true})
                                        .delegate(self, options.big ? ".mediaplugin-entry-big" : ".mediaplugin-entry", function (popup, e, target) {
                                            lastClickedOn = target.attr('data-counter');
                                            console.log("Last clicked on: " + lastClickedOn);
                                            popupContent(popup, target.data("entry"), lastClickedOn);
                                        });
                                    deferred.resolve();
                                }
                        );
                        return deferred;
                    }
                });
            });
        };

        var getOption = function (key) {
            if (options[key]) {
                return options[key];
            } else {
                return false;
            }
        };

        return {
            addFeed: addFeed,
            init: init,
            resizeImage: resizeImage,
            setOptions: setOptions,
            getOption: getOption,
            escape: escape
        };
    };

    return MediaPlugin;
});
