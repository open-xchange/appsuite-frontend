/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/view-detail',
    ['io.ox/core/extensions',
     'io.ox/calendar/util',
     'io.ox/calendar/api',
     'io.ox/core/api/user',
     'io.ox/core/api/group',
     'io.ox/core/api/resource',
     'io.ox/core/folder/api',
     'io.ox/core/tk/attachments',
     'io.ox/core/extPatterns/links',
     'io.ox/calendar/participants',
     'io.ox/core/util',
     'gettext!io.ox/calendar',
     'io.ox/calendar/actions',
     'less!io.ox/calendar/style'
    ], function (ext, util, calAPI, userAPI, groupAPI, resourceAPI, folderAPI, attachments, links, ParticipantsView, coreUtil, gt) {

    'use strict';

    // draw via extension points

    ext.point('io.ox/calendar/detail').extend({
        index: 100,
        id: 'inline-actions',
        draw: function (baton) {
            ext.point('io.ox/calendar/detail/actions').invoke('draw', this, baton);
        }
    });

    // draw appointment date & time
    ext.point('io.ox/calendar/detail').extend({
        index: 200,
        id: 'date',
        draw: function (baton) {
            var node = $('<div>');
            this.append(node);
            ext.point('io.ox/calendar/detail/date').invoke('draw', node, baton);
        }
    });

    // draw appointment time
    ext.point('io.ox/calendar/detail/date').extend({
        index: 100,
        id: 'time',
        draw: function (baton) {
            this.append(
                util.addTimezoneLabel($('<div>').addClass('interval'), baton.data)
            );
        }
    });

    // draw date and recurrence information
    ext.point('io.ox/calendar/detail/date').extend({
        index: 200,
        id: 'date',
        draw: function (baton) {
            var recurrenceString = util.getRecurrenceString(baton.data);
            this.append(
                $('<div>').addClass('day').append(
                    $.txt(gt.noI18n(util.getDateInterval(baton.data))),
                    $.txt(gt.noI18n((recurrenceString !== '' ? ' \u2013 ' + recurrenceString : '')))
                )
            );
        }
    });

    // draw private flag
    ext.point('io.ox/calendar/detail').extend({
        index: 250,
        id: 'private-flag',
        draw: function (baton) {
            if (baton.data.private_flag) {
                $('<i class="fa fa-lock private-flag">').appendTo(this);
            }
        }
    });

    // draw title
    ext.point('io.ox/calendar/detail').extend({
        index: 300,
        id: 'title',
        draw: function (baton) {
            this.append(
                $('<h1>').addClass('title clear-title').text(gt.noI18n(baton.data.title || ''))
            );
        }
    });

    // draw location
    ext.point('io.ox/calendar/detail').extend({
        index: 400,
        id: 'location',
        draw: function (baton) {
            if (baton.data.location) {
                this.append(
                    $('<div class="location">').text(gt.noI18n(baton.data.location))
                );
            }
        }
    });

    // draw note/comment
    ext.point('io.ox/calendar/detail').extend({
        index: 500,
        id: 'note',
        draw: function (baton) {
            if (baton.data.note) {
                this.append(
                    $('<div>').addClass('note').html(util.getNote(baton.data))
                );
            }
        }
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 600,
        id: 'participants',
        draw: function (baton) {
            var pView = new ParticipantsView(baton, {summary: true, inlineLinks: 'io.ox/calendar/detail/inline-actions-participantrelated'});
            this.append(pView.draw());
        }
    });

    ext.point('io.ox/calendar/detail/inline-actions-participantrelated').extend({
        index: 700,
        id: 'inline-actions-participantrelated',
        draw: function (baton) {
            if (baton.data.participants && baton.data.participants.length > 1) {
                ext.point('io.ox/calendar/detail/actions-participantrelated').invoke('draw', this, baton);
            }
        }
    });

    // draw details
    ext.point('io.ox/calendar/detail').extend({
        index: 800,
        id: 'details',
        draw: function (baton, options) {
            var node = $('<dl>');
            this.append(
                $('<fieldset>').addClass('details')
                    .append(
                        $('<legend>').addClass('io-ox-label').append(
                            $('<h2>').text(gt('Details'))
                        ),
                        node.addClass('dl-horizontal')
                )
            );
            ext.point('io.ox/calendar/detail/details').invoke('draw', node, baton, options);
        }
    });

    // organizer
    ext.point('io.ox/calendar/detail/details').extend({
        index: 100,
        id: 'organizer',
        draw: function (baton) {

            // internal or external organizer?
            if (!baton.data.organizerId && !baton.data.organizer) return;

            this.append(
                $('<dt>').append(
                    $.txt(gt('Organizer')), $.txt(gt.noI18n(':\u00A0'))
                ),
                $('<dd class="detail organizer">').append(
                    coreUtil.renderPersonalName(
                        baton.data.organizerId ?
                        {
                            html: userAPI.getTextNode(baton.data.organizerId),
                            user_id: baton.data.organizerId
                        } : {
                            name: baton.data.organizer,
                            email: baton.data.organizer
                        },
                        baton.data
                    )
                )
            );
        }
    });

    // show as
    ext.point('io.ox/calendar/detail/details').extend({
        index: 200,
        id: 'shownAs',
        draw: function (baton) {
            this.append(
                $('<dt>')
                    .append($.txt(gt('Shown as')), $.txt(gt.noI18n(':\u00A0'))),
                $('<dd>')
                    .append(
                        $('<i>').addClass('fa fa-square shown_as ' + util.getShownAsClass(baton.data)),
                        $('<span>')
                            .addClass('detail shown-as')
                            .append($.txt(gt.noI18n('\u00A0')), $.txt(util.getShownAs(baton.data)))
                    )
            );
        }
    });

    // folder
    ext.point('io.ox/calendar/detail/details').extend({
        index: 300,
        id: 'folder',
        draw: function (baton) {
            if (baton.data.folder_id) {
                this.append(
                    $('<dt>')
                        .append($.txt(gt('Folder')), $.txt(gt.noI18n(':\u00A0'))),
                    $('<dd>')
                        .attr('data-folder', baton.data.folder_id)
                        .append(folderAPI.getTextNode(baton.data.folder_id))
                );
            }
        }
    });

    function getDeepLink (data) {
        return [
                ox.abs,
                ox.root,
                '/#app=io.ox/calendar&id=',
                data.folder_id || data.folder,
                '.',
                data.recurrence_id || data.id,
                '.',
                data.recurrence_position || 0,
                '&folder=',
                data.folder_id || data.folder
            ].join('');
    }

    //used to show deep link when outside calendar app (search, portal)
    ext.point('io.ox/calendar/detail/details').extend({
        index: 350,
        id: 'deeplink',
        draw: function (baton, options) {
            //stolen from io.ox/mail/detail/links: processDeepLinks
            if (options && options.deeplink)  {
                var url = getDeepLink(baton.data),
                    label = $('<dt class="detail-label">')
                            .html(gt('Direct link') + ':' + '&#160;'),
                    link = $('<dd class="detail">')
                                .attr('style', 'font-size: 12px;')
                                .append(
                                        $('<a role="button">')
                                        .attr({
                                                href: url,
                                                target: '_blank',
                                                class: 'deep-link btn btn-primary btn-xs deep-link-calendar',
                                                style: 'font-family: Arial; color: white; text-decoration: none; height: 16px; line-height: 16px; box-sizing: content-box;'
                                        })
                                        .text(gt('Appointment'))
                                    );
                this.append(label, link);
            }
        }
    });

    // created on/by
    ext.point('io.ox/calendar/detail/details').extend({
        index: 400,
        id: 'created',
        draw: function (baton) {
            if (baton.data.creation_date || baton.data.created_by) {
                this.append(
                    $('<dt>').append(
                        $.txt(gt('Created')), $.txt(gt.noI18n(':\u00A0'))
                    ),
                    $('<dd class="created">').append(
                        $('<span>').text(gt.noI18n(baton.data.creation_date ? util.getDate(baton.data.creation_date) : '')),
                        $('<span>').text(gt.noI18n(baton.data.creation_date ? ' \u2013 ' : '')),
                        coreUtil.renderPersonalName({
                            html: baton.data.created_by ? userAPI.getTextNode(baton.data.created_by) : '',
                            user_id: baton.data.created_by
                        }, baton.data)
                    )
                 );
            }
        }
    });

    // modified on/by
    ext.point('io.ox/calendar/detail/details').extend({
        index: 500,
        id: 'modified',
        draw: function (baton) {
            if (baton.data.last_modified || baton.data.modified_by) {
                this.append(
                    $('<dt>').append(
                        $.txt(gt('Modified')), $.txt(gt.noI18n(':\u00A0'))
                    ),
                    $('<dd class="modified">').append(
                        $('<span>').text(gt.noI18n(baton.data.last_modified ? util.getDate(baton.data.last_modified) : '')),
                        $('<span>').text(gt.noI18n(baton.data.last_modified ? ' \u2013 ' : '')),
                        coreUtil.renderPersonalName({
                            html: baton.data.modified_by ? userAPI.getTextNode(baton.data.modified_by) : '',
                            user_id: baton.data.modified_by
                        }, baton.data)
                    )
                 );
            }
        }
    });

    ext.point('io.ox/calendar/detail').extend({
        id: 'attachments',
        index: 550,
        draw: function (baton) {
            var $node = $('<fieldset>').append(
                $('<legend>').addClass('io-ox-label').append(
                    $('<h2>').text(gt('Attachments'))
                )
            );

            if (calAPI.uploadInProgress(_.ecid(baton.data))) {
                this.append(
                    $node.css({width: '30%', height: '12px'}).busy()
                );
            } else if (baton.data.number_of_attachments && baton.data.number_of_attachment !== 0) {
                this.append($node);
                ext.point('io.ox/calendar/detail/attachments').invoke('draw', $node, baton);
            }
        }
    });

    ext.point('io.ox/calendar/detail/attachments').extend(new attachments.AttachmentList({
        id: 'attachment-list',
        index: 200,
        module: 1,
        selector: '.window-container.io-ox-calendar-window'
    }));

    function redraw(e, baton) {
        $(this).replaceWith(e.data.view.draw(baton));
    }

    return {

        draw: function (baton, options) {
            // make sure we have a baton
            baton = ext.Baton.ensure(baton);
            options = _.extend({}, options);
            if (_.device('smartphone') && !options.deeplink) {
                baton.disable('io.ox/calendar/detail/actions', 'inline-links');
            }
            try {
                var node = $.createViewContainer(baton.data, calAPI).on('redraw', { view: this }, redraw);
                node.addClass('calendar-detail view user-select-text').attr('data-cid', String(_.cid(baton.data)));

                ext.point('io.ox/calendar/detail').invoke('draw', node, baton, options);

                return node;

            } catch (e) {
                console.error('io.ox/calendar/view-detail:draw()', e);
            }
        }
    };
});
