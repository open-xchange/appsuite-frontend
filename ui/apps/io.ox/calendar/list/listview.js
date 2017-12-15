/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/list/listview', [
    'io.ox/calendar/util',
    'io.ox/calendar/model',
    'io.ox/calendar/api',
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/tk/list',
    'gettext!io.ox/calendar',
    'io.ox/calendar/list/view-options'
], function (util, models, api, ext, folderAPI, ListView, gt) {

    'use strict';

    ext.point('io.ox/chronos/listview/item').extend({
        id: 'appointment-class',
        index: 100,
        draw: function () {
            this.closest('li').addClass('appointment');
        }
    });
    ext.point('io.ox/chronos/listview/item').extend({
        id: 'time',
        index: 200,
        draw: function (baton) {
            var self = this,
                model = baton.model,
                timeSplits = util.getStartAndEndTime(model.attributes),
                time = $('<div class="time custom_shown_as" aria-hidden="true">'),
                colorLabel = $('<div class="color-label">');

            if (model.get('folder')) {
                //conflicts with appointments, where you aren't a participant don't have a folder_id.
                folderAPI.get(model.get('folder')).done(function (folder) {
                    var conf = util.getConfirmationStatus(model.attributes, folderAPI.is('shared', folder) ? folder.created_by : ox.user_id);
                    self.addClass(util.getConfirmationClass(conf) + (model.get('hard_conflict') ? ' hardconflict' : ''));

                    if (baton.app.props.get('colorScheme') !== 'custom') return;
                    var color = util.getAppointmentColor(folder, model);
                    colorLabel.css({
                        'background-color': color
                    }).attr({
                        'data-folder': util.canAppointmentChangeColor(folder, model) ? folder.id : ''
                    });
                });
            }

            this.addClass('calendar').append(
                time.addClass(util.getShownAsClass(model))
                    .append(
                        $('<div class="fragment">').text(timeSplits[0]),
                        $('<div class="fragment">').text(timeSplits[1]),
                        colorLabel
                    )
            );
        }
    });

    ext.point('io.ox/chronos/listview/item').extend({
        id: 'content-container',
        index: 300,
        draw: function (baton) {
            var content = $('<div class="contentContainer" aria-hidden="true">');
            this.append(content);
            ext.point('io.ox/chronos/listview/item/content').invoke('draw', content, baton);
        }
    });

    ext.point('io.ox/chronos/listview/item/content').extend({
        id: 'date',
        index: 100,
        draw: function (baton) {
            var model = baton.model;
            this.append(
                $('<div class="date">')
                    .text(util.getDateInterval(model.attributes))
                    .toggle(!util.isAllday(model) && (util.getDurationInDays(model.attributes) > 0))
            );
        }
    });

    ext.point('io.ox/chronos/listview/item/content').extend({
        id: 'private',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<i class="fa fa-lock private-flag" aria-hidden="true">').toggle(util.isPrivate(baton.model))
            );
        }
    });

    ext.point('io.ox/chronos/listview/item/content').extend({
        id: 'summary',
        index: 300,
        draw: function (baton) {
            var model = baton.model,
                summary = model.get('summary') ? baton.model.get('summary') : gt('Private'),
                startDate = model.getMoment('startDate'),
                endDate = model.getMoment('endDate');

            var a11yLabel = [summary];
            if (util.isPrivate(model) && !!model.get('summary')) a11yLabel.push(gt('Private'));
            //#. %1$s is an appointment location (e.g. a room, a telco line, a company, a city)
            //#. This fragment appears within a long string for screen readers
            if (model.get('location')) a11yLabel.push(gt.format(gt.pgettext('a11y', 'location %1$s'), model.get('location')));
            a11yLabel.push(util.getShownAs(model));
            a11yLabel.push(startDate.isSame(endDate, 'day') ? util.getEvenSmarterDate(model) : util.getDateIntervalA11y(model.attributes));
            a11yLabel.push(util.getTimeIntervalA11y(model.attributes));

            this.closest('li').attr('aria-label', _.escape(a11yLabel.join(', ')) + '.');
            this.append($('<div class="title">').text(summary));
        }
    });

    ext.point('io.ox/chronos/listview/item/content').extend({
        id: 'location',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<div class="location-row">').append(
                    $('<span class="location">').text(baton.model.get('location') || '\u00A0')
                )
            );
        }
    });

    ext.point('io.ox/chronos/listview/notification/empty').extend({
        id: 'empty-label',
        index: 100,
        draw: function (baton) {
            var collection = baton.listView.collection,
                m = moment(collection.originalStart).add(collection.range || 0, 'month').startOf('day');
            this.addClass('empty').text(gt.format(gt('No appointments found until %s'), m.format('LLL')));
            baton.listView.drawTail();
        }
    });

    ext.point('io.ox/chronos/listview/notification/error').extend({
        id: 'error',
        index: 100,
        draw: function (baton) {
            function retry(e) {
                e.data.baton.listView.reload();
            }

            this.append(
                $('<i class="fa fa-exclamation-triangle" aria-hidden="true">'),
                $.txt(gt('Error: Failed to load appointments')),
                $('<button type="button" class="btn btn-link">')
                    .text(gt('Retry'))
                    .on('click', { baton: baton }, retry)
            );
        }
    });

    ext.point('io.ox/chronos/list-view/toolbar/top').extend({
        id: 'select-all',
        index: 100,
        draw: function (baton) {
            function toggleControl(i, state) {
                i.attr('class', state ? 'fa fa-check-square-o' : 'fa fa-square-o').parent().attr('aria-checked', state);
            }

            function toggleSelection(e) {
                if (e.type === 'click' || e.which === 32) {
                    e.preventDefault();
                    var i = $(this).find('i'), selection = e.data.baton.app.listView.selection;
                    if (i.hasClass('fa-check-square-o')) selection.selectNone(); else selection.selectAll();
                    // get the focus back
                    $(this).focus();
                }
            }

            var i;
            this.append(
                $('<a href="#" class="toolbar-item select-all" data-name="select-all" role="checkbox" aria-checked="false">').append(
                    i = $('<i class="fa fa-square-o" aria-hidden="true">'),
                    $.txt(gt('Select all'))
                )
                .on('click', { baton: baton }, toggleSelection)
                .on('dblclick', function (e) {
                    e.stopPropagation();
                })
                .on('keydown', { baton: baton }, toggleSelection)
            );

            baton.view.listView.on({
                'selection:all': function () {
                    toggleControl(i, true);
                },
                'selection:subset': function () {
                    toggleControl(i, false);
                }
            });
        }
    });

    return ListView.extend({

        ref: 'io.ox/chronos/listview',

        initialize: function (options) {
            ListView.prototype.initialize.call(this, options);
            this.$el.addClass('chronos-item');
            this.connect(api.collectionLoader);
            this.on('collection:set', this.onCollectionSet);
        },

        onCollectionSet: function () {
            this.listenTo(this.collection, 'paginate', _.debounce(this.onPaginatenEvent, 20));
        },

        getLabel: function (model) {
            return util.getEvenSmarterDate(model, true);
        },

        empty: function () {
            if (this.tail) this.tail.remove();
            return ListView.prototype.empty.apply(this, arguments);
        },

        renderListItem: function (model) {
            if (model === this.collection.last()) _.defer(this.drawTail.bind(this));
            return ListView.prototype.renderListItem.apply(this, arguments);
        },

        onPaginatenEvent: function () {
            this.drawTail();
            if (this.collection.length === 0) this.renderEmpty();
        },

        drawTail: function () {
            // only render if in listview. not in search
            if (this.collection.cid.indexOf('view=list') < 0) return;
            if (this.tail) this.tail.remove();
            var m = moment(this.collection.originalStart).add(this.collection.range, 'month');
            this.$el.append(
                this.tail = $('<li class="tail">').append(
                    $('<a href="#">')
                        .text(gt('Load appointments until %1$s', m.format('l')))
                        .on('click', this.onLoadMore.bind(this))
                )
            );
        },

        onLoadMore: function (e) {
            e.preventDefault();
            if (this.tail) this.tail.remove();
            this.loader.collection = this.collection;
            // must send paginate: true because pagination in calendar is somehow special
            this.paginate();
        },

        onSort: $.noop

    });

});
