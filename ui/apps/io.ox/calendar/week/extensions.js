/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/week/extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (ext, util, folderAPI, gt) {

    'use strict';

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            var self = this,
                a = baton.model,
                folder = folderAPI.pool.getModel(a.get('folder')).toJSON(),
                conf = 1,
                confString = '%1$s',
                classes = '';

            function addColors(f) {
                var color = util.getAppointmentColor(f, a),
                    foregroundColor = util.getForegroundColor(color);
                if (!color) return;
                self.css({
                    'background-color': color,
                    'color': foregroundColor,
                    'border-left-color': foregroundColor === 'white' ? '' : foregroundColor
                }).data('background-color', color);
                self.addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
                if (util.canAppointmentChangeColor(f, a)) {
                    self.attr('data-folder', f.id);
                }
            }

            var folderId = a.get('folder');
            if (String(folder.id) === String(folderId)) {
                addColors(folder);
            } else if (folderId !== undefined) {
                folderAPI.get(folderId).done(addColors);
            }

            if (util.isPrivate(a) && ox.user_id !== (a.get('createdBy') || {}).entity && !folderAPI.is('private', folder)) {
                classes = 'private disabled';
            } else {
                var canModifiy = folderAPI.can('write', folder, a.attributes) && util.allowedToEdit(a, { synced: true, folderData: folder });
                conf = util.getConfirmationStatus(a);
                classes = (util.isPrivate(a) ? 'private ' : '') + util.getShownAsClass(a) +
                    ' ' + util.getConfirmationClass(conf) +
                    (canModifiy ? ' modify' : '');
                // if (conf === 'TENTATIVE') {
                //     confString =
                //         //#. add confirmation status behind appointment title
                //         //#. %1$s = apppintment title
                //         //#, c-format
                //         gt('%1$s (Tentative)');
                // }
            }

            this
                .attr('tabindex', 0)
                .addClass(classes)
                .append(
                    $('<div class="appointment-content">').append(
                        $('<div>').append(
                            util.returnIconsByType(a).type,
                            a.get('summary') ? $('<div class="title">').text(gt.format(confString, a.get('summary') || '\u00A0')) : ''
                        ),
                        a.get('location') ? $('<div class="location">').text(a.get('location') || '\u00A0') : '',
                        $('<div class="flags">').append(util.returnIconsByType(a).property)
                    )
                )
                .attr({
                    'data-extension': 'default'
                });

            this.on('calendar:weekview:rendered', function () {

                var contentHeight = $(this).find('.appointment-content').height(),
                    titleHeight = $(this).find('.title').height(),
                    noWrap = $(this).hasClass('no-wrap'),
                    locationHeight = $(this).find('.location').length < 1 || noWrap ? 0 : $(this).find('.location').height(),
                    flagsHeight = $(this).find('.flags').height();

                if (!flagsHeight) return;
                if (titleHeight + locationHeight < contentHeight - flagsHeight) {
                    $(this).find('.flags').addClass('bottom-right');
                } else {
                    $(this).find('.flags').hide();
                }
            });
        }
    });

    ext.point('io.ox/calendar/week/view').extend({
        id: 'resize',
        index: 100,
        draw: function () {
            // disable d'n'd on small devices or really big collections
            if (this.collection.length > this.limit || _.device('smartphone')) return;

            // init drag and resize widget on appointments
            var self = this,
                colWidth = this.$('.day:first').outerWidth(),
                paneOffset = this.$('.week-container').offset().left,
                paneHeight = this.height();

            // add resizable and draggable plugin to all appointments with modify class
            $('.week-container .day>.appointment.modify', this.$el).resizable({
                handles: 'n, s',
                grid: [0, this.cellHeight],
                // see Bug 32753 - Not possible to reduce an appointment to 30 minutes using drag&drop
                minHeight: this.cellHeight - 2,
                containment: 'parent',
                start: function (e, ui) {
                    // close sidepopup so it doesn't interfere with dragging/resizing
                    if (self.perspective && self.perspective.dialog) self.perspective.dialog.close();
                    var d = $(this).data('ui-resizable');
                    // get fresh dimensions as window size and/or timezone favorites might change
                    colWidth = self.$('.day:first').outerWidth();
                    paneOffset = self.$('.week-container').offset().left;
                    // init custom resize object
                    d.my = {};
                    // set current day
                    $.extend(d.my, {
                        curHelper: $(this),
                        all: $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el),
                        day: Math.floor((e.pageX - paneOffset) / colWidth),
                        handle: ''
                    });
                    d.my.firstPos = parseInt(d.my.all.first().closest('.day').attr('date'), 10);
                    d.my.lastPos = parseInt(d.my.all.last().closest('.day').attr('date'), 10);
                    d.my.lastHeight = d.my.all.last().height();
                    d.my.startPos = d.my.day;
                },
                resize:  function (e, ui) {
                    var el = $(this),
                        d = el.data('ui-resizable'),
                        day = Math.floor((e.pageX - paneOffset) / colWidth),
                        mouseY = e.pageY - (self.pane.offset().top - self.pane.scrollTop());

                    // detect direction
                    if (ui.position.top !== ui.originalPosition.top) {
                        d.my.handle = 'n';
                    } else if (ui.size.height !== ui.originalSize.height) {
                        d.my.handle = 's';
                    }

                    // add new style
                    d.my.all
                        .addClass('opac')
                        .css({
                            left: 0,
                            width: '100%',
                            maxWidth: '100%',
                            zIndex: 999
                        });

                    // resize actions
                    if (day >= d.my.firstPos && d.my.handle === 's') {
                        // right side
                        mouseY = self.roundToGrid(mouseY, 's');
                        // default move
                        if (day !== d.my.startPos) {
                            ui.element.css({
                                top: ui.originalPosition.top,
                                height: paneHeight - ui.position.top
                            });
                        } else {
                            d.my.bottom = ui.size.height + ui.position.top;
                        }
                        if (d.my.day === day && day !== d.my.startPos) {
                            d.my.curHelper.height(function () {
                                return mouseY - $(this).position().top;
                            });
                            d.my.bottom = mouseY;
                        } else if (day < d.my.day) {
                            // move left
                            if (day >= d.my.lastPos) {
                                d.my.all.filter(':visible').last().remove();
                            } else {
                                d.my.all.filter(':visible').last().hide();
                            }
                            d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            d.my.curHelper = d.my.all.filter(':visible').last();
                            d.my.curHelper.css({
                                minHeight: 0,
                                maxHeight: paneHeight
                            });
                        } else if (day > d.my.day) {
                            // move right
                            if (day > d.my.lastPos) {
                                // set new helper
                                $('.week-container .day[date="' + day + '"]', self.$el)
                                    .append(d.my.curHelper = el.clone());
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            } else {
                                d.my.curHelper = d.my.all.filter(':hidden').first();
                            }
                            if (day > d.my.firstPos) {
                                d.my.all.filter(':visible').slice(0, -1).css({
                                    height: 'auto',
                                    bottom: 0
                                });
                                d.my.curHelper.show().css({
                                    top: 0,
                                    height: mouseY,
                                    minHeight: 0
                                });
                            }
                        }
                    } else if (day <= d.my.lastPos && d.my.handle === 'n') {
                        // left side
                        mouseY = self.roundToGrid(mouseY, 'n');
                        if (day !== d.my.startPos) {
                            ui.element.css({
                                top: 0,
                                height: ui.size.height + ui.position.top
                            });
                        } else {
                            d.my.top = ui.position.top;
                        }
                        if (d.my.day === day && day !== d.my.startPos) {
                            // default move
                            d.my.curHelper.css({
                                top: mouseY,
                                height: (day === d.my.lastPos ? d.my.lastHeight : paneHeight) - mouseY
                            });
                            d.my.top = mouseY;
                        } else if (day > d.my.day) {
                            // move right
                            if (day < d.my.startPos) {
                                d.my.all.filter(':visible').first().remove();
                            } else {
                                // if original element - do not remove
                                d.my.all.filter(':visible').first().hide();
                            }
                            // update dataset
                            d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            d.my.curHelper = d.my.all.filter(':visible').first();
                        } else if (day < d.my.day) {
                            // move left
                            if (day < d.my.firstPos) {
                                // add new helper
                                $('.week-container .day[date="' + day + '"]', self.$el)
                                    .append(d.my.curHelper = el.clone().addClass('opac'));
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);

                            } else {
                                d.my.curHelper = d.my.all.filter(':hidden').last();
                            }
                            if (day < d.my.lastPos) {
                                d.my.all.filter(':visible').slice(0, -1).css({
                                    top: 0,
                                    height: paneHeight
                                }).end().last().height(function (i, h) {
                                    return $(this).position().top + h;
                                }).css({ top: 0 });
                                d.my.curHelper.show().css({
                                    top: mouseY,
                                    height: paneHeight - mouseY
                                });
                            }
                            // update dataset
                            d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                        }
                    }
                    // update day
                    d.my.day = day;
                },
                stop: function () {
                    var el = $(this),
                        d = el.data('ui-resizable'),
                        // use clone here to to the calculations. the actual update is triggered by the update request
                        event = self.collection.get(el.data('cid')).clone(),
                        date, curTimezone, eventTimezone;
                    d.my.all.removeClass('opac');
                    // save for update calculations
                    event.set({
                        oldStartDate: event.getMoment('startDate'),
                        oldEndDate: event.getMoment('endDate')
                    }, { silent: true });
                    switch (d.my.handle) {
                        case 'n':
                            date = event.getMoment('startDate');
                            curTimezone = moment().tz();
                            eventTimezone = date.tz();
                            // translate to current user timezone apply offset and translate back to appointments timezone
                            date.tz(curTimezone).startOf('day').add(self.getTimeFromPos(d.my.top), 'ms').tz(eventTimezone);
                            event.set('startDate', { value: date.format('YYYYMMDD[T]HHmmss'), tzid: event.get('startDate').tzid });
                            break;
                        case 's':
                            date = event.getMoment('startDate');
                            curTimezone = moment().tz();
                            eventTimezone = date.tz();
                            // translate to current user timezone apply offset and translate back to appointments timezone
                            date.tz(curTimezone).startOf('day').add(self.getTimeFromPos(d.my.bottom), 'ms').tz(eventTimezone);
                            event.set('endDate', { value: date.format('YYYYMMDD[T]HHmmss'), tzid: event.get('endDate').tzid });
                            break;
                        default:
                            break;
                    }
                    // disable widget
                    el.resizable('disable').busy();
                    self.onUpdateAppointment(event);
                }
            });

            // remove unused resizable panes
            $('.day>.appointment.rmnorth .ui-resizable-n, .day>.appointment.rmsouth .ui-resizable-s', this.$el).remove();
        }
    });

    ext.point('io.ox/calendar/week/view').extend({
        id: 'drag-and-drop',
        index: 200,
        draw: function () {
            // disable d'n'd on small devices or really big collections
            if (this.collection.length > this.limit || _.device('smartphone')) return;

            // init drag and resize widget on appointments
            var self = this,
                colWidth = this.$('.day:first').outerWidth(),
                paneHeight = this.height();

            $('.week-container .day>.appointment.modify', this.$el).draggable({
                grid: [colWidth, this.cellHeight],
                distance: 10,
                delay: 300,
                scroll: true,
                revertDuration: 0,
                revert: function (drop) {
                    if (drop === false) {
                        // no socket object drop occurred.
                        // revert the appointment by returning true
                        $(this).show();
                        return true;
                    }
                    // return false so that the appointment does not revert
                    return false;
                },
                start: function (e, ui) {
                    // close sidepopup so it doesn't interfere with dragging/resizing
                    if (self.perspective && self.perspective.dialog) self.perspective.dialog.close();
                    // write all appointment divs to draggable object
                    var d = $(this).data('ui-draggable');
                    d.my = {
                        all: $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el)
                            .addClass('opac')
                            .css({
                                left: 0,
                                width: '100%',
                                maxWidth: '100%',
                                zIndex: 999
                            })
                    };
                    _.extend(d.my, {
                        firstPos: parseInt(d.my.all.first().closest('.day').attr('date'), 10),
                        lastPos: parseInt(d.my.all.last().closest('.day').attr('date'), 10),
                        initPos: parseInt($(this).closest('.day').attr('date'), 10),
                        firstTop: d.my.all.first().position().top,
                        lastHeight: d.my.all.last().outerHeight(),
                        lastTop: ui.position.top,
                        height: $(this).height()
                    });
                },
                drag: function (e, ui) {
                    var d = $(this).data('ui-draggable'),
                        // normalize to colWith
                        left = ui.position.left -= ui.originalPosition.left,
                        move = Math.floor(left / colWidth),
                        day = d.my.initPos + move,
                        top = ui.position.top;

                    // correct position
                    if (d.my.firstPos === d.my.lastPos) {
                        // start and end on same day
                        d.my.mode = 4;
                    } else if (day === d.my.firstPos + move) {
                        // drag first element
                        d.my.mode = 3;
                    } else if (day === d.my.lastPos + move) {
                        // drag last element
                        d.my.mode = 2;
                    } else {
                        // drag in all other cases
                        d.my.mode = 1;
                    }

                    // abort moving
                    if (day < 0 || day >= self.columns) {
                        left = ui.position.left = d.my.lastLeft;
                    } else if (d.my.mode < 4) {
                        // hide apppintment parts outside of the pane
                        d.my.all.show();
                        if (d.my.firstPos + move < 0) {
                            d.my.all.slice(0, Math.abs(d.my.firstPos + move)).hide();
                        } else if (d.my.lastPos + move >= self.columns) {
                            d.my.all.slice((d.my.lastPos + move - self.columns + 1) * -1).hide();
                        }
                    }

                    if (d.my.mode === 4 && (top < 0 || (top + d.my.height) > paneHeight)) {
                        top = ui.position.top = d.my.lastTop;
                    }

                    // apply new position
                    d.my.all.css('left', left);

                    // elements do not move
                    if (ui.position.top < 0 || d.my.mode <= 2) {
                        ui.position.top = 0;
                    }

                    // last element
                    if (d.my.mode === 2) {
                        d.options.axis = 'x';
                    }

                    // handling on multi-drag
                    if (d.my.mode < 4) {
                        if (d.my.lastTop !== top) {
                            var diff = top - d.my.lastTop,
                                firstTop = d.my.firstTop + diff,
                                lastHeight = d.my.lastHeight + diff;

                            // calc first position
                            if (((d.my.firstTop >= 0 && firstTop < 0) || (d.my.firstTop >= paneHeight && firstTop < paneHeight)) && diff < 0) {
                                $('.week-container .day[date="' + (--d.my.firstPos) + '"]', self.$el)
                                    .append($(this).clone());
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            }
                            if (((d.my.firstTop < 0 && firstTop >= 0) || (d.my.firstTop < paneHeight && firstTop >= paneHeight)) && diff > 0) {
                                d.my.firstPos++;
                                d.my.all.first().remove();
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            }
                            if (firstTop < 0) {
                                firstTop += paneHeight;
                            } else if (firstTop >= paneHeight) {
                                firstTop -= paneHeight;
                            }
                            // update first element
                            d.my.all.first().css({
                                top: firstTop,
                                height: paneHeight - firstTop
                            });

                            // calc last position
                            if (((d.my.lastHeight <= 0 && lastHeight > 0) || (d.my.lastHeight <= paneHeight && lastHeight > paneHeight)) && diff > 0) {
                                $('.week-container .day[date="' + (++d.my.lastPos) + '"]', self.$el)
                                    .append($(this).clone());
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            }
                            if (((d.my.lastHeight > 0 && lastHeight <= 0) || (d.my.lastHeight > paneHeight && lastHeight <= paneHeight)) && diff < 0) {
                                d.my.lastPos--;
                                d.my.all.last().remove();
                                d.my.all = $('[data-cid="' + ui.helper.data('cid') + '"]', self.$el);
                            }
                            if (lastHeight <= 0) {
                                lastHeight += paneHeight;
                            } else if (lastHeight > paneHeight) {
                                lastHeight -= paneHeight;
                            }
                            d.my.all.last().css({
                                top: 0,
                                height: lastHeight
                            });

                            d.my.firstTop += diff;
                            d.my.lastHeight += diff;
                        }
                    }
                    d.my.lastTop = top;
                    d.my.lastLeft = left;
                },
                stop: function (e, ui) {
                    var d = $(this).data('ui-draggable'),
                        off = $('.week-container', this.$el).offset(),
                        move = Math.round(ui.position.left / colWidth),
                        event = self.collection.get($(this).data('cid')).clone(),
                        startTS = event.getMoment('startDate')
                            .add(self.getTimeFromPos(d.my.lastTop - ui.originalPosition.top), 'ms') // milliseconds
                            .add(move, 'days'), // days
                        endTS = startTS.clone().add(event.getMoment('endDate').diff(event.getMoment('startDate'), 'ms'), 'ms');
                    if (e.pageX < window.innerWidth && e.pageX > off.left && e.pageY < window.innerHeight) {
                        // save for update calculations
                        event.set({
                            oldStartDate: event.getMoment('startDate'),
                            oldEndDate: event.getMoment('endDate')
                        }, { silent: true });

                        event.set({
                            startDate: { value: startTS.format('YYYYMMDD[T]HHmmss'), tzid: event.get('startDate').tzid },
                            endDate: { value: endTS.format('YYYYMMDD[T]HHmmss'), tzid: event.get('endDate').tzid }
                        });
                        d.my.all.busy();
                        // disable widget
                        $(this).draggable('disable');

                        if (event.getMoment('startDate').valueOf() !== event.get('oldStartDate').valueOf()) {
                            self.onUpdateAppointment(event);
                        } else {
                            self.renderAppointments();
                        }
                    } else {
                        self.trigger('onRefresh');
                    }
                    d.my = null;
                }
            });
        }
    });

    ext.point('io.ox/calendar/week/view').extend({
        id: 'drag-and-drop-allday',
        index: 300,
        draw: function () {
            // disable d'n'd on small devices or really big collections
            if (this.collection.length > this.limit || _.device('smartphone')) return;

            // init drag and resize widget on appointments
            var self = this,
                colWidth = this.$('.day:first').outerWidth();

            // init drag and resize widget on full-time appointments
            $('.fulltime>.appointment.modify', this.$el).draggable({
                grid: [colWidth, 0],
                axis: 'x',
                delay: 300,
                scroll: true,
                snap: '.day',
                zIndex: 2,
                stop: function (e) {
                    if (e.pageX < window.innerWidth && e.pageY < window.innerHeight) {
                        $(this).draggable('disable').busy();
                        var newPos = Math.round($(this).position().left / (self.fulltimePane.width() / self.columns)),
                            event = self.collection.get($(this).data('cid')).clone(),
                            startTS = moment(self.startDate).add(newPos, 'days'),
                            endTS = startTS.clone().add(event.getMoment('endDate').diff(event.getMoment('startDate'), 'ms'), 'ms');
                        // save for update calculations
                        event.set({
                            oldStartDate: event.getMoment('startDate'),
                            oldEndDate: event.getMoment('endDate')
                        }, { silent: true });

                        event.set({
                            startDate: { value: startTS.format('YYYYMMDD'), tzid: event.get('startDate').tzid },
                            endDate: { value: endTS.format('YYYYMMDD'), tzid: event.get('endDate').tzid }
                        });
                        if (event.getMoment('startDate').valueOf() !== event.get('oldStartDate').valueOf()) {
                            self.onUpdateAppointment(event);
                        } else {
                            self.renderAppointments();
                        }
                    } else {
                        self.trigger('onRefresh');
                    }
                }
            })
            .resizable({
                grid: [colWidth, 0],
                minWidth: colWidth,
                handles: 'w, e',
                containment: 'parent',
                start: function () {
                    $(this).addClass('opac').css('zIndex', $(this).css('zIndex') + 2000);
                },
                stop: function (e, ui) {
                    var el = $(this),
                        event = self.collection.get(el.data('cid')).clone(),
                        newDayCount = Math.round(el.outerWidth() / (self.fulltimePane.width() / self.columns));
                    // save for update calculations
                    event.set({
                        oldStartDate: event.getMoment('startDate'),
                        oldEndDate: event.getMoment('endDate')
                    }, { silent: true });
                    el.removeClass('opac').css('zIndex', $(this).css('zIndex') - 2000);

                    if (parseInt(el.position().left, 10) !== parseInt(ui.originalPosition.left, 10)) {
                        var tsEnd = event.getMoment('endDate').subtract(newDayCount, 'days');
                        event.set('startDate', { value: tsEnd.format('YYYYMMDD'), tzid: event.get('startDate').tzid });
                    } else if (parseInt(el.width(), 10) !== parseInt(ui.originalSize.width, 10)) {
                        var tsStart = event.getMoment('startDate').add(newDayCount, 'days');
                        event.set('endDate', { value: tsStart.format('YYYYMMDD'), tzid: event.get('endDate').tzid });
                    }

                    el.resizable('disable').busy();
                    self.onUpdateAppointment(event);
                }
            });
        }
    });

});
