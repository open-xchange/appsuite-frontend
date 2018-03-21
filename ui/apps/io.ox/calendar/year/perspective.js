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

define('io.ox/calendar/year/perspective', [
    'io.ox/calendar/year/view',
    'io.ox/backbone/views/datepicker',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/year/style'
], function (View, Datepicker, gt) {

    'use strict';

    var YearDatepicker = Datepicker.extend({
        switchMode: function (mode, value) {
            this.trigger('select:year', value);
            this.close();
        },
        onToday: function () {
            this.setDate(this.getToday());
            this.$grid.focus();
        }
    });

    var ToolbarView = Backbone.View.extend({

        className: 'toolbar',

        events: {
            'click .prev': 'onPrev',
            'click .next': 'onNext',
            'click .info': 'onInfo'
        },

        initialize: function (opt) {
            this.app = opt.app;
        },

        render: function () {
            var self = this;

            this.$el.append(
                $('<div class="controls-container">').append(
                    $('<a href="#" role="button" class="control prev">').attr({
                        title: gt('Previous year'),
                        'aria-label': gt('Previous year')
                    })
                    .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                    $('<a href="#" role="button" class="control next">').attr({
                        title: gt('Next year'),
                        'aria-label': gt('Next year')
                    })
                    .append($('<i class="fa fa-chevron-right" aria-hidden="true">'))
                ),
                this.$yearInfo = $('<a href="#" class="info">').text(moment().year())
            );

            new YearDatepicker({ date: this.app.getDate().year(), todayButton: false })
                .attachTo(this.$yearInfo)
                .on('before:open', function () {
                    var year = self.app.getDate().year();
                    this.setDate(moment().year(year));
                    this.mode = 'decade';
                })
                .on('select:year', function (year) {
                    self.setYear({ year: year });
                });

            this.listenTo(this.app.props, 'change:date', function () {
                if (!this.$el.is(':visible')) return;
                var year = this.app.getDate().year();
                if (ox.debug) console.log('year: change:date', year);
                this.setYear({ year: year });
            });

            return this;
        },

        onInfo: function (e) {
            e.preventDefault();
        },

        onPrev: function (e) {
            e.preventDefault();
            this.setYear({ inc: -1 });
        },

        onNext: function (e) {
            e.preventDefault();
            this.setYear({ inc: 1 });
        },

        setYear: function (opt) {
            var year = opt.year || (this.app.getDate().year() + (opt.inc || 0));
            this.trigger('change:year', year);
            this.app.setDate(moment([year]));
            this.$yearInfo.text(year);
        }

    });

    var perspective = new ox.ui.Perspective('year');

    _.extend(perspective, {

        year: moment().year(),

        renderViews: function () {
            var start = moment().year(this.year).startOf('year'),
                end = moment().year(this.year).endOf('year'),
                container = this.main.find('.year-view-container').empty();
            if (container.length === 0) container = $('<div class="year-view-container">');
            for (; start.isBefore(end); start.add(1, 'month')) {
                container.append(
                    $('<div class="month-container">').append(
                        new View({
                            date: moment(start),
                            app: this.app
                        }).render().$el
                    )
                );
            }
            this.onWindowResize();
            return container;
        },

        render: function (app) {
            var self = this;

            this.app = app;
            this.year = app.getDate().year();

            this.main.addClass('year-view').append(
                new ToolbarView({ app: app }).on('change:year', this.changeYear.bind(this)).render().$el,
                this.renderViews()
            );

            $(window).on('resize', this.onWindowResize.bind(this));
            app.props.on('change:folderview', function () {
                self.onWindowResize();
            });
            this.onWindowResize();
            this.app.getWindow().on('show', this.restore.bind(this));

            return this;
        },

        restore: function () {
            this.changeYear(this.app.getDate().year());
            this.main.find('.toolbar .info').text(this.year);
            this.main.idle();
            this.main.find('button').prop('disabled', false);
        },

        changeYear: function (year) {
            if (this.year === year) return;
            this.year = year;
            this.renderViews();
        },

        onWindowResize: function () {
            var minWidth = 250,
                parentWidth = this.main.width(),
                numPerRow = ((parentWidth / minWidth) >> 0),
                allowed = [1, 2, 3, 4, 6];
            if (allowed.indexOf(numPerRow) < 0) {
                if (numPerRow <= 0) numPerRow = 1;
                else if (numPerRow > 6) numPerRow = 6;
                else if (numPerRow === 5) numPerRow = 4;
                else numPerRow = 1;
            }
            this.main.find('.month-container').css('width', (100 / numPerRow) + '%');
        }

    });

    return perspective;

});
