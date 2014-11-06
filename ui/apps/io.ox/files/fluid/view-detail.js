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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/fluid/view-detail', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/files/actions',
    'io.ox/files/legacy_api',
    'io.ox/preview/main',
    'io.ox/core/api/user',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/tk/attachments',
    'gettext!io.ox/files',
    'io.ox/files/util',
    'less!io.ox/files/style'
], function (ext, links, actionPerformer, actions, filesAPI, preview, userAPI, getBreadcrumb, attachments, gt, util) {

    'use strict';

    var POINT = 'io.ox/files/details';

    // Inline Actions
    ext.point(POINT).extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/files/links/inline'
    }));

    if (_.device('smartphone')) {
        ext.point(POINT).disable('inline-links');
    }

    // Title
    ext.point(POINT).extend({
        id: 'title',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<h1>').addClass('title clear-title')
                .text(gt.noI18n(baton.data.filename || baton.data.title || '\u00A0'))
                .on('dblclick', function () {
                    actionPerformer.invoke('io.ox/files/actions/rename', null, baton);
                })
                .on('keydown', function (e) {
                    if ((e.keyCode || e.which) === 13) {
                        // enter
                        actionPerformer.invoke('io.ox/files/actions/rename', null, baton);
                    }
                }),
                baton.data.url ? $('<a>').text(baton.data.url).attr({ href: baton.data.url, target: '_blank' }) : $()
            );
        }
    });

    // Display locked file information
    ext.point(POINT).extend({
        index: 210,
        id: 'filelock',
        draw: function (baton) {
            if (filesAPI.tracker.isLocked(baton.data)) {
                var div, lockInfo;
                this.append(
                    div = $('<div>').addClass('alert alert-info')
                );
                if (filesAPI.tracker.isLockedByMe(baton.data)) {
                    lockInfo = gt('This file is locked by you');
                } else {
                    lockInfo = gt('This file is locked by %1$s');
                }
                lockInfo.replace(/(%1\$s)|([^%]+)/g, function (a, link, text) {
                    if (link) {
                        div.append(userAPI.getLink(baton.data.modified_by));
                    } else {
                        div.append($.txt(text));
                    }
                });
            }
        }
    });

    // Preview
    (function () {

        function parseArguments(file) {
            if (!file.filename) return null;
            return {
                name: file.filename,
                filename: file.filename,
                mimetype: file.file_mimetype,
                size: file.file_size,
                version: file.version,
                id: file.id,
                folder_id: file.folder_id,
                dataURL: filesAPI.getUrl(file, 'bare'),
                downloadURL: filesAPI.getUrl(file, 'download'),
                meta: file.meta
            };
        }

        ext.point(POINT).extend({
            id: 'preview',
            index: 300,
            draw: function (baton) {

                var lastWidth = 0, $previewNode, drawResizedPreview;

                function isEnabled(file) {
                    if (!file.filename) return false;
                    return (new preview.Preview(parseArguments(file))).supportsPreview() && util.previewMode(file);
                }

                function fnDrawPreview() {
                    var width = $previewNode.innerWidth();
                    if (width === lastWidth) return;
                    $previewNode.empty();
                    // Must only recalculate once we get bigger
                    lastWidth = width;
                    var file = parseArguments(baton.data);
                    // get proper URL
                    file.previewURL = filesAPI.getUrl(file, 'thumbnail', {
                        scaleType: 'contain',
                        thumbnailWidth: width,
                        thumbnailHeight: Math.round(width * 1.5)
                    });
                    var prev = new preview.Preview(file, { resize: false });
                    prev.appendTo($previewNode);
                }

                if (!isEnabled(baton.data)) return;

                this.append(
                    $previewNode = $('<div class="preview">')
                );

                // HACK: ugly hack for samsung galaxy s4 stock browser. Cannot exclude chrome because the stock browser says it's chrome
                if (_.device('small && android')) {
                    // delayed drawing of to large previews does not make the sidepane scrollable
                    // make it 1 pixel to big to force the s4 stockbrowser into scrolling mode
                    this.css('height', window.innerHeight + 1 + 'px');
                }
                drawResizedPreview = _.debounce(fnDrawPreview, 300);
                $(window).on('resize', drawResizedPreview);
                $previewNode.on('dispose', function () {
                    $(window).off('resize', drawResizedPreview);
                });
                _.defer(fnDrawPreview);
            }
        });
    }());

    // Description
    ext.point(POINT).extend({
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

    ext.point(POINT).extend({
        id: 'breadcrumb',
        index: 500,
        draw: function (baton, app) {
            var folderSet;
            if (app) {
                folderSet = app.folder.set;
            }
            this.append(
                getBreadcrumb(baton.data.folder_id, {
                    exclude: ['9'],
                    handler: folderSet,
                    last: false,
                    prefix: gt('Saved in'),
                    subfolder: false
                })
                .addClass('chromeless')
            );
        }
    });

    // Upload Field
    ext.point(POINT).extend({
        id: 'upload',
        index: 600,
        draw: function (baton) {
            //no uploads in mail preview
            if (baton.openedBy === 'io.ox/mail/compose') return;
            var file = baton.data,
            $node,
            $commentArea,
            $comment,
            $uploadButton,
            $cancelUploadButton,
            $progressBarWrapper,
            $progressBar,
            $input = attachments.fileUploadWidget({
                // two new versions at the same time makes no sense
                multi: false,
                buttontext: gt('Upload a new version')
            });

            $node = $('<form>').append(
                $('<div>').append(
                    $('<div class="pull-left">').append(
                        $input
                    ),
                    $uploadButton = $('<button type="button" data-action="upload" tabindex="1">')
                        .addClass('uploadbutton btn btn-primary pull-right').text(gt('Upload file')),
                    $cancelUploadButton = $('<button>',  { 'data-dismiss': 'fileupload', tabindex: 1, 'aria-label': 'cancel' })
                        .addClass('btn pull-right').text(gt('Cancel')).hide(),
                    $progressBarWrapper = $('<div>').addClass('row').append($progressBar = $('<div>').addClass('progress-bar')),
                    $('<div>').addClass('comment').append(
                        $comment = $('<div>').append(
                            $('<label>').text(gt('Version Comment')),
                            $commentArea = $('<textarea class="form-control" rows="5" tabindex="1"></textarea>')
                        ).hide()
                    )
                )
            ).appendTo(this);

            var resetCommentArea = function () {
                $uploadButton.text(gt('Upload new version'));
                $commentArea.removeClass('disabled').val('');
                $comment.hide();
                $uploadButton.hide();
                $cancelUploadButton.hide();
                //general upload error
                $uploadButton.removeClass('disabled');
                $input.closest('form').get(0).reset();
                //hide progressbar
                $progressBarWrapper.removeClass('progress');
                $progressBar.css('width', '0%');
            };

            var uploadFailed = function (e) {
                require(['io.ox/core/notifications']).pipe(function (notifications) {
                    if (e && e.data && e.data.custom) {
                        notifications.yell(e.data.custom.type, e.data.custom.text);
                    }
                });
                resetCommentArea();
            };

            $uploadButton.on('click', function (e) {
                e.preventDefault();
                $(this).addClass('disabled').text(gt('Uploading...'));
                $commentArea.addClass('disabled');

                if (_.browser.IE !== 9) {
                    // show progressbar
                    $progressBarWrapper.addClass('progress');
                    var files = $input.find('input[type="file"]')[0].files || [];

                    filesAPI.uploadNewVersion({
                        file: _(files).first(),
                        id: file.id,
                        folder: file.folder_id,
                        timestamp: _.now(),
                        json: { version_comment: $commentArea.val() }
                    }).progress(function (e) {
                        var sub = (e.loaded / e.total) * 100;
                        $progressBar.css('width', sub + '%');
                    }).done(resetCommentArea)
                    .fail(uploadFailed);
                } else {
                    $input.find('input[type="file"]').attr('name', 'file');

                    filesAPI.uploadNewVersionOldSchool({
                        form: $node,
                        id: file.id,
                        folder: file.folder_id,
                        timestamp: _.now(),
                        json: { version_comment: $commentArea.val() }
                    }).done(resetCommentArea);
                }
                return false;
            });

            $input.on('change', function () {
                if (!_.isEmpty($input.find('input[type="file"]').val())) {
                    $cancelUploadButton.show();
                    $uploadButton.show();
                    $comment.show();
                    $commentArea.focus();
                } else {
                    resetCommentArea();
                }
            });
            $cancelUploadButton.on('click', function (e) {
                e.preventDefault();
                resetCommentArea(e);
            });

        }
    });

    // Version List
    var versionSorter = function (version1, version2) {
        return version2.version - version1.version;
    };

    ext.point(POINT).extend({
        id: 'versions',
        index: 700,
        draw: function (baton, detailView, allVersions) {

            var $content, openedBy = baton.openedBy;

            function drawAllVersions(allVersions) {
                _.chain(allVersions)
                .sort(versionSorter)
                .each(function (version) {
                    var $versionnumber;
                    var $entryRow = $('<tr>')
                            .addClass('version ' + (version.current_version ? 'info' : ''))
                            .append(
                                $versionnumber = $('<td>').append(
                                    $('<span>').text(gt.noI18n(version.version)).addClass('versionLabel')
                                )
                            );

                    var baton = ext.Baton({ data: version, openedBy: openedBy });
                    baton.isCurrent = version.id === baton.data.current_version;
                    ext.point(POINT + '/version').invoke('draw', $entryRow, baton);
                    $content.append($entryRow);
                });
            }

            if (baton.data.number_of_versions >= 1) {

                $content = $('<table class="versiontable table table-striped table-hover table-bordered">').append(
                    $('<thead>').append(
                        $('<tr>').append(
                            $('<th>').text(_.noI18n('#')),
                            $('<th>').text(gt('File'))
                        )
                    )
                );

                // Then let's fetch all versions and update the table accordingly
                if (!allVersions) {
                    filesAPI.versions({ id: baton.data.id }).done(drawAllVersions);
                } else {
                    drawAllVersions(allVersions);
                }

                var $historyDefaultLabel = gt('Show version history') + ' (' + baton.data.number_of_versions + ')',
                    $historyButton = $('<a>', { 'data-action': 'history', 'href': '#', tabindex: 1 })
                        .addClass('noI18n').text($historyDefaultLabel)
                        .on('click', function (e) {
                            e.preventDefault();
                            if ($content.is(':hidden')) {
                                $(this).text(gt('Version history') + ' (' + baton.data.number_of_versions + ')');
                            } else {
                                $(this).text($historyDefaultLabel);
                            }
                            $content.toggle();
                        });

                this.append(
                    $('<h2 class="version-button">').append(
                        $historyButton
                    ),
                    $content
                );
            }
        }
    });

    // dropdown
    ext.point(POINT + '/version/dropdown').extend(new links.Dropdown({
        index: 10,
        label: '',
        ref: 'io.ox/files/versions/links/inline'
    }));

    // Extensions for the version detail table
    ext.point(POINT + '/version').extend({ index: 10,
        id: 'filename',
        draw: function (baton) {
            baton.label = _.noI18n(baton.data.filename);
            var row;

            this.append(
                row = $('<td>')
            );

            ext.point(POINT + '/version/dropdown').invoke('draw', row, baton);
        }
    });

    // Basic Info Fields
    var bytesToSize = function (bytes) {
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'], i;
        if (bytes === 0) {
            return 'n/a';
        } else {
            i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
            return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
        }
    };

    ext.point(POINT + '/version').extend({
        id: 'size',
        index: 20,
        draw: function (baton) {
            this.find('td:last').append($('<span class="size pull-left">').text(gt.noI18n(bytesToSize(baton.data.file_size))));
        }
    });

    ext.point(POINT + '/version').extend({
        id: 'created_by',
        index: 40,
        draw: function (baton) {
            this.find('td:last').append($('<span class="pull-right createdby">').append(userAPI.getLink(baton.data.created_by).attr('tabindex', 1)));
        }
    });

    ext.point(POINT + '/version').extend({
        id: 'last_modified',
        index: 30,
        draw: function (baton) {
            var d = moment(baton.data.last_modified);
            this.find('td:last').append($('<span class="pull-right last_modified">').text(gt.noI18n(d.format('l LT'))));
        }
    });

    ext.point(POINT + '/version').extend({
        id: 'comment',
        index: 50,
        draw: function (baton) {
            if (baton.data.version_comment !== null &&  baton.data.version_comment !== '') {
                this.find('td:last').append($('<div class="comment">').append($('<span>').addClass('version-comment').text(gt.noI18n(baton.data.version_comment || '\u00A0'))));
            }
        }
    });

    var draw = function (baton, app) {

        if (!baton) return $('<div>');

        baton = ext.Baton.ensure(baton);
        baton.app = app;

        if (app) {
            // save the appname so the extensions know what opened them (to disable some options for example)
            baton.openedBy = app.getName();
        }

        var node = $.createViewContainer(baton.data, filesAPI);
        node.on('redraw', createRedraw(node, app)).addClass('file-details view');
        ext.point(POINT).invoke('draw', node, baton, app);

        return node;
    };

    var createRedraw = function (node, app) {
        return function (e, data) {
            var replacement = draw(data, app);
            if ('former_id' in data) replacement.attr('former-id', data.former_id);
            if (node.find('.versiontable:visible')) {//keep versionhistory status (expanded/collapsed)
                replacement.find('[data-action="history"]').click();
            }
            node.replaceWith(replacement);
        };
    };

    return {
        draw: draw
    };
});
