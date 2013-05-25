/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/calendar/view-grid-template",
    ["io.ox/calendar/util",
     "io.ox/core/tk/vgrid",
     "io.ox/core/extensions",
     "gettext!io.ox/calendar",
     "io.ox/core/api/user",
     "io.ox/core/api/resource",
     "less!io.ox/calendar/style.less"], function (util, VGrid, ext, gt, userAPI, resourceAPI) {

    "use strict";
    var fnClickPerson = function (e) {
        e.preventDefault();
        ext.point("io.ox/core/person:action").each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };

    var that = {

        // main grid template
        main: {
            build: function () {
                var title, location, time, date, shown_as, conflicts, isPrivate;
                this.addClass("calendar")
                    .append(time = $("<div>").addClass("time"))
                    .append(date = $("<div>").addClass("date"))
                    .append(isPrivate = $('<i class="icon-lock private-flag">').hide())
                    .append(title = $("<div>").addClass("title"))
                    .append(
                        $('<div class="location-row">').append(
                            shown_as = $('<span class="shown_as label label-info">&nbsp;</span>'),
                            location = $('<span class="location">')
                        )
                    )
                    .append(conflicts = $("<div>").addClass("conflicts").hide());

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
            set: function (data, fields, index) {
                this.addClass(util.getConfirmationClass(util.getConfirmationStatus(data)) + (data.hard_conflict ? ' hardconflict' : ''));
                fields.title
                    .text(data.title ? gt.noI18n(data.title || '\u00A0') : gt('Private'));
                if (data.conflict) {
                    fields.title
                        .append(
                            $.txt(' ('),
                            $('<a>').append(userAPI.getTextNode(data.created_by)).on('click', { internal_userid: data.created_by }, fnClickPerson),
                            $.txt(')')
                        );
                }
                fields.location.text(gt.noI18n(data.location || '\u00A0'));
                fields.time.text(util.getTimeInterval(data));
                fields.date.text(gt.noI18n(util.getDateInterval(data)));
                fields.shown_as.get(0).className = "shown_as label " + util.getShownAsLabel(data);
                if (data.participants && data.conflict) {
                    var conflicts = $('<span>');
                    fields.conflicts
                        .text(gt('Conflicts:'))
                        .append(conflicts);

                    _(data.participants).each(function (participant, index, list) {
                        // check for resources
                        if (participant.type === 3) {
                            resourceAPI.get({id: participant.id}).done(function (resource) {
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
                                    .addClass('person-link')
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
            }
        },

        // template for labels
        label: {
            build: function () {
                this.addClass("calendar-label");
            },
            set: function (data, fields, index) {
                var d = util.getSmartDate(data);
                this.text(gt.noI18n(d));
            }
        },

        // detect new labels
        requiresLabel: function (i, data, current) {
            if (!data) {
                return false;
            }
            var d = util.getSmartDate(data);
            return (i === 0 || d !== current) ? d : false;
        },

        // simple grid-based list for portal & halo
        drawSimpleGrid: function (list) {

            // use template
            var tmpl = new VGrid.Template(),
                $div = $("<div>");

            // add template
            tmpl.add(that.main);

            _(list).each(function (data, i) {
                var clone = tmpl.getClone();
                clone.update(data, i);
                clone.appendTo($div).node
                    .css("position", "relative")
                    .data("appointment", data)
                    .addClass("hover");
            });

            return $div;
        },

        // simple click handler used by several simple grids
        hOpenDetailPopup: function (e) {

            var data = e.data || $(this).data("appointment");

            require(["io.ox/calendar/view-detail", "io.ox/core/tk/dialogs"],
                function (view, dialogs) {
                    new dialogs.ModalDialog({
                            width: 600,
                            easyOut: true
                        })
                        .append(view.draw(data))
                        .addButton("close", "Close")
                        .show();
                    data = null;
                }
            );

            return false;
        }
    };

    return that;
});
