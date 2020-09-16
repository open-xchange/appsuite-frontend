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
    'settings!io.ox/calendar',
    'io.ox/calendar/list/view-options'
], function (util, models, api, ext, folderAPI, ListView, gt, settings) {

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

            // reset classes in case the div gets reused
            this.attr('class', 'list-item-content');

            if (model.get('folder')) {
                //conflicts with appointments, where you aren't a participant don't have a folder_id.
                folderAPI.get(model.get('folder')).done(function (folder) {
                    var conf = util.getConfirmationStatus(model);
                    self.addClass(util.getConfirmationClass(conf) + (model.get('hard_conflict') ? ' hardconflict' : ''));

                    var color = util.getAppointmentColor(folder, model);
                    colorLabel.css({
                        'background-color': color
                    }).attr({
                        'data-folder': util.canAppointmentChangeColor(folder, model) ? folder.id : ''
                    });

                    time.addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
                });
            }

            this.addClass('calendar ' + util.getShownAsClass(model)).append(
                time.append(
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
            if (!util.isPrivate(baton.model)) return;
            this.append(
                $('<i class="fa private-flag" aria-hidden="true">').addClass(util.isPrivate(baton.model, true) ? 'fa-user-circle' : 'fa-lock')
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

            if (model.get('folder')) {
                folderAPI.get(model.get('folder')).done(function (folder) {
                    var color = util.getAppointmentColor(folder, model),
                        colorName = util.getColorName(color);

                    if (colorName) {
                        //#. Will be used as aria lable for the screen reader to tell the user which color/category the appointment within the calendar has.
                        a11yLabel.push(gt('Category') + ': ' + util.getColorName(color));
                        this.closest('li').attr('aria-label', _.escape(a11yLabel.join(', ')) + '.');
                    }
                }.bind(this));
            }
        }
    });

    ext.point('io.ox/chronos/listview/item/content').extend({
        id: 'location',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<span class="gray location">').text(baton.model.get('location') || '\u00A0')
            );
        }
    });

    ext.point('io.ox/chronos/listview/notification/empty').extend({
        id: 'empty-label',
        index: 100,
        draw: function (baton) {
            var collection = baton.listView.collection,
                m = moment(collection.originalStart).add(collection.range || 0, 'month').startOf('day');
            if (collection.cid.indexOf('folders') < 0) return;
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
                i.attr('class', state ? 'fa fa-check-square-o' : 'fa fa-square-o').parent().attr('aria-pressed', state);
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
                $('<button type="button" class="btn btn-link select-all" data-name="select-all">').append(
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
            this.$el.addClass('chronos-item').attr('aria-label', gt('List view'));
            this.connect(api.collectionLoader);
            this.listenTo(settings, 'change:showDeclinedAppointments', this.rerender);
            this.on('collection:change:attendees', this.onChangeAttendee);
        },

        onChangeAttendee: function (model) {
            // only call rerender, if the confirmation status is false and declined appointments are not shown
            if (util.getConfirmationStatus(model) !== 'DECLINED') return;
            if (settings.get('showDeclinedAppointments', false)) return;
            this.collection.remove(model);
            this.selection.dodge();
        },

        rerender: function () {
            function cont() {
                if (!this.originalCollection) return;
                this.setCollection(this.originalCollection);
                this.collection.trigger('reset');
            }
            if (this.$el.is(':visible')) cont.call(this); else this.app.getWindow().one('show', cont.bind(this));
        },

        setCollection: function (collection) {
            // disable sorting for search results
            var options = this.loader.mode === 'search' ? { comparator: false } : {};
            function filter(model) {
                if (util.getConfirmationStatus(model) !== 'DECLINED') return true;
                return settings.get('showDeclinedAppointments', false);
            }

            function setIndex(collection) {
                collection.forEach(function (model, i) {
                    model.set('index', i);
                });
            }

            // use intermediate collection to filter declined appointments if necessary
            if (this.originalCollection) this.stopListening(this.originalCollection);
            this.originalCollection = collection;
            collection = new models.Collection(collection.filter(filter), options);
            collection.cid = this.originalCollection.cid;

            // apply intermediate collection to ListView
            var hasCollection = !!this.collection;
            ListView.prototype.setCollection.call(this, collection);
            if (hasCollection && collection.length > 0) collection.trigger('reset');

            this.listenTo(this.originalCollection, {
                'all': function (event) {
                    var args = _(arguments).toArray();
                    if (/(add|remove|reset|sort)/.test(event)) return;
                    this.collection.trigger.apply(this.collection, args);
                }.bind(this),
                'add': function (model) {
                    if (!filter(model)) return;
                    this.collection.add(model);
                }.bind(this),
                'reset': function (data) {
                    if (!data) return;
                    this.collection.reset(data.filter(filter));
                    setIndex(this.collection);
                }.bind(this),
                'remove': function (data) {
                    this.collection.remove(data);
                },
                'remove sort': function () {
                    // check for comparator first
                    if (this.collection.comparator) this.collection.sort();
                    setIndex(this.collection);
                }.bind(this),
                'change:startDate': function (model) {
                    var startDate = model.getMoment('startDate'),
                        prevStartDate = util.getMoment(model.previous('startDate'));
                    if (startDate.isSame(prevStartDate, 'day')) return;

                    var end = moment(this.originalCollection.originalStart).add(this.originalCollection.range, 'month');
                    if (startDate.isAfter(end)) return this.originalCollection.remove(model);

                    this.collection.sort();
                    setIndex(this.collection);

                    _.defer(function () {
                        this.onSort();
                    }.bind(this));
                }.bind(this)
            });

            this.listenTo(this.collection, 'paginate', _.debounce(this.onPaginatenEvent, 20));
            return this;
        },

        getLabel: function (model) {
            return util.getEvenSmarterDate(model, true);
        },

        empty: function () {
            if (this.tail) this.tail.remove();
            return ListView.prototype.empty.apply(this, arguments);
        },

        onAdd: function (model) {
            if (this.$('[data-cid="' + $.escape(model.cid) + '"]').length > 0) return;
            return ListView.prototype.onAdd.call(this, model);
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
            // make sure there is no leftover busy indicator, not needed in calendar besides showing the busy animation
            if (this.getBusyIndicator().length) this.removeBusyIndicator();
            // only render if in listview. not in search
            if (this.collection.cid.indexOf('view=list') < 0) return;
            if (this.tail) this.tail.remove();
            var m = moment(this.originalCollection.originalStart).add(this.originalCollection.range, 'month');
            this.$el.append(
                this.tail = $('<li class="tail" role="presentation">').append(
                    $('<a href="#">')
                        .text(gt('Load appointments until %1$s', m.format('l')))
                        .on('click', this.onLoadMore.bind(this))
                )
            );
        },

        onLoadMore: function (e) {
            e.preventDefault();
            if (this.tail) this.tail.remove();
            this.loader.collection = this.originalCollection;
            this.paginate();
        }

    });

});
