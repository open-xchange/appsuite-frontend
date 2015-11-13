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

define('io.ox/calendar/view-grid-template', [
    'io.ox/calendar/util',
    'io.ox/core/tk/vgrid',
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'io.ox/core/api/user',
    'io.ox/core/api/resource',
    'less!io.ox/calendar/style'
], function (util, VGrid, ext, folderAPI, gt, userAPI, resourceAPI) {

    'use strict';
    var fnClickPerson = function (e) {
        e.preventDefault();
        ext.point('io.ox/core/person:action').each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };

    var that = {

        // main grid template
        main: {
            build: function () {
                var title, location, time, date, shown_as, conflicts, isPrivate;
                this.addClass('calendar').append(
                    time = $('<div class="time">'),
                    date = $('<div class="date">'),
                    isPrivate = $('<i class="fa fa-lock private-flag">').hide(),
                    title = $('<div class="title">'),
                    $('<div class="location-row">').append(
                        shown_as = $('<span class="shown_as label label-info">&nbsp;</span>'),
                        location = $('<span class="location">')
                    ),
                    conflicts = $('<div class="conflicts">').hide()
                );

                return {
                    title: title,
                    location: location,
                    time: time,
                    date: date,
                    shown_as: shown_as,
                    conflicts: conflicts,
                    isPrivate: isPrivate
                };
            },
            set: function (data, fields) {
                var self = this,
                    isPrivate = _.isUndefined(data.title),
                    a11yLabel = '',
                    tmpStr = '';
                //conflicts with appointments, where you aren't a participant don't have a folder_id.
                if (data.folder_id) {
                    var folder = folderAPI.get(data.folder_id);
                    folder.done(function (folder) {
                        var conf = util.getConfirmationStatus(data, folderAPI.is('shared', folder) ? folder.created_by : ox.user_id);
                        self.addClass(util.getConfirmationClass(conf) + (data.hard_conflict ? ' hardconflict' : ''));
                    });
                }

                fields.title
                    .text(a11yLabel = isPrivate ? gt('Private') : gt.noI18n(data.title || '\u00A0'));
                if (data.conflict && !isPrivate) {
                    fields.title
                        .append(
                            $.txt(' ('),
                            $('<a>').append(userAPI.getTextNode(data.created_by)).on('click', { internal_userid: data.created_by }, fnClickPerson),
                            $.txt(')')
                        );
                }
                if (data.location) {
                    a11yLabel += ', ' + data.location;
                }
                fields.location.text(gt.noI18n(data.location || '\u00A0'));
                fields.time.text(tmpStr = gt.noI18n(util.getTimeInterval(data)));
                a11yLabel += ', ' + util.getTimeIntervalA11y(data);
                fields.date.text(tmpStr = gt.noI18n(util.getDateInterval(data)));
                a11yLabel += ', ' + gt.noI18n(util.getDateIntervalA11y(data));
                fields.shown_as.get(0).className = 'shown_as label ' + util.getShownAsLabel(data);
                if (data.participants && data.conflict) {
                    var conflicts = $('<span>');
                    fields.conflicts
                        .text(gt('Conflicts:'))
                        .append(conflicts);

                    _.chain(data.participants)
                    .filter(function (part) {
                        // participants who declined the appointment cannot conflit
                        return part.confirmation !== 2;
                    })
                    .each(function (participant, index, list) {
                        // check for resources
                        if (participant.type === 3) {
                            resourceAPI.get({ id: participant.id }).done(function (resource) {
                                conflicts.append(
                                    $('<span>')
                                        .addClass('resource-link')
                                        .text(gt.noI18n(resource.display_name))
                                        .css('margin-left', '4px')
                                );
                            });
                        }
                        // internal user
                        if (participant.type === 1) {
                            conflicts.append(
                                $('<a>')
                                    .append(userAPI.getTextNode(participant.id))
                                    .addClass('person-link ' + util.getConfirmationClass(participant.confirmation))
                                    .css('margin-left', '4px')
                                    .on('click', { internal_userid: participant.id }, fnClickPerson)
                            );
                        }
                        // separator
                        if (index < (list.length - 1)) {
                            conflicts.append($('<span>').addClass('delimiter')
                                .append($.txt(_.noI18n('\u00A0\u2022 '))));
                        }
                    });
                    fields.conflicts.show();
                    fields.conflicts.css('white-space', 'normal');
                    this.css('height', 'auto');
                } else {
                    fields.conflicts.hide();
                }

                if (data.private_flag === true) {
                    fields.isPrivate.show();
                } else {
                    fields.isPrivate.hide();
                }
                this.attr({ 'aria-label': _.escape(a11yLabel) });
            }
        },

        // simple grid-based list for portal & halo
        drawSimpleGrid: function (list) {

            // use template
            var tmpl = new VGrid.Template({
                    tagName: 'li',
                    defaultClassName: 'vgrid-cell list-unstyled'
                }),
                $ul = $('<ul>');

            // add template
            tmpl.add(that.main);

            _(list).each(function (data, i) {
                var clone = tmpl.getClone();
                clone.update(data, i);
                clone.appendTo($ul).node
                    .css('position', 'relative')
                    .data('appointment', data)
                    .addClass('hover');
            });

            return $ul;
        }

    };

    return that;
});
