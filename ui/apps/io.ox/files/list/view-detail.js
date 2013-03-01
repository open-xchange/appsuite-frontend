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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/list/view-detail',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/extPatterns/layouts',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/tk/keys',
     'io.ox/core/date',
     'io.ox/core/event',
     'io.ox/files/actions',
     'io.ox/files/api',
     'io.ox/preview/main',
     'io.ox/core/tk/upload',
     'io.ox/core/api/user',
     'io.ox/core/api/folder',
     'io.ox/core/tk/attachments',
     'gettext!io.ox/files',
     'less!io.ox/files/style.less'], function (ext, links, layouts, actionPerformer, KeyListener, date, Event, actions, filesAPI, preview, upload, userAPI, folderAPI, attachments, gt) {

    'use strict';

    // Title
    ext.point('io.ox/files/details').extend({
        id: 'title',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div>').addClass('title clear-title')
                .text(gt.noI18n(baton.data.title || baton.data.filename || '\u00A0'))
                .on('dblclick', function () {
                    actionPerformer.invoke('io.ox/files/actions/rename', null, baton);
                })
            );
        }
    });

    // Inline Actions
    ext.point('io.ox/files/details').extend(new links.InlineLinks({
        index: 200,
        id: 'inline-links',
        ref: 'io.ox/files/links/inline'
    }));

    // Preview
    (function () {

        function parseArguments(file) {
            if (!file.filename) {
                return null;
            }
            return {
                name: file.filename,
                filename: file.filename,
                mimetype: file.file_mimetype,
                size: file.file_size,
                dataURL: filesAPI.getUrl(file, 'bare'),
                version: file.version,
                id: file.id
            };
        }

        ext.point('io.ox/files/details').extend({
            id: 'preview',
            index: 300,
            draw: function (baton) {

                function isEnabled(file) {
                    if (!file.filename) {
                        return false;
                    }
                    return (new preview.Preview(parseArguments(file))).supportsPreview();
                }

                var lastWidth = 0, $previewNode, drawResizedPreview;

                function fnDrawPreview() {
                    var width = $previewNode.innerWidth();
                    if (width > lastWidth) {
                        $previewNode.empty();
                        lastWidth = width; // Must only recalculate once we get bigger
                        var prev = new preview.Preview(parseArguments(baton.data), { width: width, height: 'auto'});
                        prev.appendTo($previewNode);
                    }
                }

                if (isEnabled(baton.data)) {
                    $previewNode = $('<div class="preview">');
                    this.append($previewNode);
                    drawResizedPreview = _.debounce(fnDrawPreview, 300);
                    $(window).on('resize', drawResizedPreview);
                    $previewNode.on('dispose', function () {
                        $(window).off('resize', drawResizedPreview);
                    });
                    _.defer(fnDrawPreview);
                }
            }
        });
    }());

    // Description
    ext.point('io.ox/files/details').extend({
        id: 'description',
        index: 400,
        draw: function (baton) {
            var text = $.trim(baton.data.description || '');
            if (text !== '') {
                this.append(
                    $('<div class="description">')
                    .text(gt.noI18n(text))
                    .on('dblclick', function () {
                        actionPerformer.invoke('io.ox/files/actions/edit-description', null, baton);
                    })
                );
            }
        }
    });

    // Upload Field
    ext.point('io.ox/files/details').extend({
        id: 'upload',
        index: 400,
        draw: function (baton) {
            if (!ox.uploadsEnabled) return;
            var self = this, file = baton.data;

            this.append(
                $('<h4>').text(gt('Upload a new version'))
            );

            var $node = $('<form>').appendTo(this),
            $commentArea = $('<textarea rows="5"></textarea>'),
            $comment = $('<div class="span12">').hide().append(
                $('<label>').text(gt('Version Comment')),
                $commentArea
            ),
            $button = $('<button>').css({'margin-top': 25}).text(gt('Upload'))
                .addClass('btn btn-primary')
                .attr({
                    'disabled': 'disabled',
                    'data-action': 'upload'
                }),
            $input = attachments.fileUploadWidget('span9');

            $node.append(
                $('<div>').addClass('row-fluid').append(
                    $input,
                    $('<div>').addClass('span3').append(
                        $button
                    )
                ),
                $comment
            );

            var resetCommentArea = function () {
                $button.removeClass('disabled').text(gt('Upload new version'));
                $commentArea.removeClass('disabled').val('');
                $comment.hide();
            };

            $button.on('click', function () {

                $button.addClass('disabled').text(gt('Uploading...'));
                $commentArea.addClass('disabled');

                if (_.browser.IE !== 9) {
                    var files = $input.find('input[type="file"]')[0].files || [];

                    filesAPI.uploadNewVersion({
                        file: _(files).first(),
                        id: file.id,
                        folder: file.folder_id,
                        timestamp: file.last_modified,
                        json: {version_comment: $commentArea.val()}
                    }).done(resetCommentArea);
                } else {
                    $input.find('input[type="file"]').attr('name', 'file');

                    filesAPI.uploadNewVersionOldSchool({
                        form: $node,
                        id: file.id,
                        folder: file.folder_id,
                        timestamp: file.last_modified,
                        json: {version_comment: $commentArea.val()}
                    }).done(resetCommentArea);
                }
                return false;
            });

            $input.on('change', function () {
                $button.removeAttr('disabled');
                $comment.show();
                $commentArea.focus();
            });

            new KeyListener($comment).on('shift+enter', function (evt) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                $button.click();
            }).include();
        }
    });

    // Version List
    var versionSorter = function (version1, version2) {
        if (version1.version === version2.version) {
            return 0;
        }
        if (version1.current_version) {
            return -1;
        }
        if (version2.current_version) {
            return 1;
        }
        return version2.version - version1.version;
    };

    ext.point('io.ox/files/details').extend({
        id: 'versions',
        index: 500,
        draw: function (baton, detailView, allVersions) {

            var $content;

            function drawAllVersions(allVersions) {
                _.chain(allVersions)
                .sort(versionSorter)
                .each(function (version) {
                    var $entryRow = $('<div>')
                            .addClass('row-fluid version ' + (version.current_version ? 'current' : ''))
                            .append(
                                $('<div>').addClass('span1').append(
                                    $('<span>').text(gt.noI18n(version.version)).addClass('versionLabel')
                                )
                            ),
                        $detailsPane = $('<div>').addClass('span11').appendTo($entryRow);
                    var baton = ext.Baton({ data: version });
                    baton.isCurrent = version.id === baton.data.current_version;
                    new layouts.Grid({ ref: 'io.ox/files/details/version' }).draw.call($detailsPane, baton);
                    $content.append($entryRow);
                });
            }

            if (baton.data.number_of_versions >= 1) { // || (file.current_version && file.version > 1);)

                this.append(
                    $('<h4>').text(gt('File versions'))
                );

                $content = $('<div class="versions">');

                // Then let's fetch all versions and update the table accordingly
                if (!allVersions) {
                    filesAPI.versions({ id: baton.data.id }).done(drawAllVersions);
                } else {
                    drawAllVersions(allVersions);
                }

                this.append($content);
            }
        }
    });

    // dropdown
    ext.point('io.ox/files/details/version/dropdown').extend(new links.DropdownLinks({
        label: '',
        ref: 'io.ox/files/versions/links/inline'
    }));

    // Extensions for the version detail table
    ext.point('io.ox/files/details/version').extend({ index: 10,
        id: 'filename',
        dim: {
            span: 6
        },
        draw: function (baton) {
            baton.label = baton.data.filename || 'YEAH';
            ext.point('io.ox/files/details/version/dropdown').invoke('draw', this, baton);
        }
    });

    // Basic Info Fields
    var bytesToSize = function (bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'], i;
        if (bytes === 0) {
            return 'n/a';
        } else {
            i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
            return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
        }
    };

    ext.point('io.ox/files/details/version').extend({
        index: 20,
        id: 'size',
        dim: {
            span: 2
        },
        draw: function (baton) {
            this.text(gt.noI18n(bytesToSize(baton.data.file_size))).css({textAlign: 'right'});
        }
    });

    ext.point('io.ox/files/details/version').extend({
        index: 30,
        id: 'created_by',
        dim: {
            span: 4,
            orientation: 'right'
        },
        draw: function (baton) {
            this.append($('<span>').append(userAPI.getLink(baton.data.created_by)).addClass('pull-right'));
        }
    });

    ext.point('io.ox/files/details/version').extend({
        index: 40,
        id: 'comment',
        dim: {
            span: 8
        },
        draw: function (baton) {
            this.addClass('version-comment').text(gt.noI18n(baton.data.version_comment || '\u00A0'));
        }
    });

    ext.point('io.ox/files/details/version').extend({
        index: 50,
        id: 'creation_date',
        dim: {
            span: 4,
            orientation: 'right'
        },
        draw: function (baton) {
            var d = new date.Local(date.Local.utc(baton.data.creation_date));
            this.append($('<span class="pull-right">').text(gt.noI18n(d.format(date.DATE_TIME))));
        }
    });

    var draw = function (baton) {

        if (!baton) return $('<div>');

        baton = ext.Baton.ensure(baton);

        var node = $.createViewContainer(baton.data, filesAPI);
        node.on('redraw', createRedraw(node)).addClass('file-details view');

        ext.point('io.ox/files/details').invoke('draw', node, baton);

        return node;
    };

    var createRedraw = function (node) {
        return function (e, data) {
            node.replaceWith(draw(data));
        };
    };

    return {
        draw: draw
    };
});
