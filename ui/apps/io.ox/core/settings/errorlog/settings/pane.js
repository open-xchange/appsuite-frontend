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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/settings/errorlog/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/http',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'static/3rd.party/Chart.js/Chart.js'
], function (ext, http, settings, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'errorlog',
        title: gt('Error log'),
        ref: 'io.ox/core/settings/errorlog',
        index: 'last',
        advancedMode: true,
        settingsgroup: 'tools'
    });

    var ErrorLogView = Backbone.View.extend({

        tagName: 'div',
        className: 'error-log',

        events: {
            'click .nav a': 'onClickTab',
            'click .reload-statistics': 'onUpdateStatistics',
            'click .toggle-request-body': 'onToggleRequestBody',
            'click .toggle-stack-trace': 'onToggleStackTrace'
        },

        initialize: function () {
            this.collection = http.log();
            this.collection.on('add', this.onAdd, this);
        },

        onAdd: function (model) {
            this.updateStatistics();
            this.renderError(model);
        },

        onClickTab: function (e) {
            e.preventDefault();
            $(e.target).tab('show');
        },

        onUpdateStatistics: function (e) {
            e.preventDefault();
            this.updateStatistics();
        },

        onToggleRequestBody: function (e) {
            e.preventDefault();
            var node = $(e.target);
            if (node.data('visible')) {
                node.data('visible', false).text(gt('Show request body')).next().hide();
            } else {
                node.data('visible', true).text(gt('Hide request body')).next().show();
            }
        },

        onToggleStackTrace: function (e) {
            e.preventDefault();
            var node = $(e.target);
            if (node.data('visible')) {
                node.data('visible', false).text(gt('Show stack trace')).next().hide();
            } else {
                node.data('visible', true).text(gt('Hide stack trace')).next().show();
            }
        },

        render: function () {

            // clear
            this.$el.empty();

            this.renderSummary();

            if (settings.get('ping/enabled', false)) {
                this.renderStatistics();
                this.renderChart();
                this.updateStatistics();
            }

            this.renderTabs();
            this.collection.each(this.renderError, this);

            return this;
        },

        getSummary: function () {
            return [
            ].join(', ');
        },

        getUptime: function () {
            // return up-time in minutes
            return Math.round((_.now() - ox.t0) / 1000 / 60);
        },

        renderSummary: function () {
            this.$el.append(
                $('<section class="summary">').append(
                    $('<div>').append(
                        $.txt(gt('Date') + ': ' + moment().format('l LT')), $.txt(', '),
                        $.txt(gt('Host') + ': '), $('<b>').text(location.hostname), $.txt(', '),
                        $.txt(gt('UI version') + ': '), $('<b>').text(ox.serverConfig.version), $.txt(', '),
                        $.txt(gt('Server version') + ': '), $('<b>').text(ox.serverConfig.serverVersion), $.txt(', '),
                        $.txt(gt('Browser') + ': ' + navigator.userAgent)
                    )
                )
            );
        },

        updateStatistics: function () {

            this.$el.find('.statistics').empty().append(
                $('<div>').append(
                    $.txt(gt('Total: %1$s requests', http.statistics.count())), $.txt('. '),
                    $.txt(gt('Average time: %1$s ms', http.statistics.avg())), $.txt('. '),
                    $.txt(gt('Loss: %1$s %', Math.round(http.statistics.loss() * 100))), $.txt('. '),
                    $.txt(gt('Uptime: %1$s minutes', this.getUptime())), $.txt('.')
                ),
                $('<div>').append(
                    $('<a href="#" class="reload-statistics">').text(gt('Reload statistics'))
                )
            );

            this.updateChart();
        },

        renderStatistics: function () {

            this.$el.append($('<section class="statistics">'));
        },

        renderChart: function () {

            this.$el.append(
                $('<section class="chart">'),
                $('<section class="chart-description">').text(
                    gt('The blue graph shows the distribution of request durations in percent. The gray graph shows a trivial network ping to recognize slow connections.')
                )
            );
        },

        updateChart: function () {

            var canvas, data, chart, ctx;

            function transform(list) {

                var data = [
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0
                ];

                // get frequencies
                _(list).each(function (t) {
                    if (t >= 1000) {
                        data[data.length - 1]++;
                    } else if (t >= 500) {
                        data[data.length - 2]++;
                    } else {
                        data[Math.max(1, Math.round(t / 50))]++;
                    }
                });

                // convert to percentages
                data = _(data).map(function (i) {
                    return Math.round(i / list.length * 100);
                });

                return data;
            }

            var data = transform(http.statistics.data()),
                ping = transform(http.statistics.ping());

            chart = {
                labels: [0, '', 100, '', 200, '', 300, '', 400, '', '> 0.5s', '> 1s'],
                datasets: [{
                    fillColor: 'rgba(220, 220, 220, 0.5)',
                    strokeColor: 'rgba(220, 220, 220, 1)',
                    pointColor: 'rgba(220, 220, 220, 1)',
                    pointStrokeColor: '#fff',
                    data: ping
                }, {
                    fillColor: 'rgba(0, 136, 204, 0.15)',
                    strokeColor: 'rgba(0, 136, 204, 0.80)',
                    pointColor: 'rgba(0, 136, 204, 1)',
                    pointStrokeColor: '#fff',
                    data: data
                }]
            };

            this.$el.find('.chart').empty().append(
                canvas = _.device('smartphone') ? $('<canvas width="300" height="100">') : $('<canvas width="600" height="200">')
            );

            ctx = canvas.get(0).getContext('2d');
            new window.Chart(ctx).Line(chart, {});
        },

        renderTabs: function () {
            this.$el.append(
                // draw tab controls
                $('<ul class="nav nav-tabs" role="tablist">').append(
                    $('<li class="active" role="presentation">').append($('<a href="#errors" role="tab">').text(gt('Errors'))),
                    $('<li>').append($('<a href="#slow" role="tab">').text(gt('Slow requests'))),
                    $('<li>').append($('<a href="#loss" role="tab">').text(gt('Loss')))
                ),
                // draw tab panes
                $('<div class="tab-content">').append(
                    $('<div class="tab-pane active" id="errors">')
                        .append($('<div class="empty">').text(gt('No errors'))),
                    $('<div class="tab-pane" id="slow">')
                        .append($('<div class="empty">').text(gt('No slow requests'))),
                    $('<div class="tab-pane" id="loss">')
                        .append($('<div class="empty">').text(gt('No lost requests')))
                )
            );
        },

        getMessage: function (model) {
            return model.get('error');
        },

        getID: function (model) {
            var id = model.get('error_id'), code = model.get('code');
            return !id ? '' : '(ID: ' + id + (code ? ' / ' + code : '') + ')';
        },

        getUrl: function (model) {
            return model.get('url')
                // obscure password parameters (see bug #27250)
                .replace(/(password\w*)=[^&#]+/g, '$1=****')
                // make slahes and commas readable
                .replace(/%2F/g, '/').replace(/%2C/g, ',');
        },

        getStrackTrace: function (model) {
            var stack = model.get('error_stack');
            return _.isArray(stack) ? stack.join('\n') : '';
        },

        getRequestBody: function (model) {
            return _([model.get('params'), model.get('data')])
                .chain()
                .map(function (data) {
                    if (!data) return null;
                    try {
                        // JSON.parse might fail ...
                        if (_.isString(data)) data = JSON.parse(data);
                    } catch (e) {
                        // ... in this case we just return the string
                        return data;
                    }
                    // obscure password properties (at least top-level; see bug #27250)
                    if (_.isObject(data)) {
                        _(data).each(function (value, key) {
                            if (/password/.test(key)) data[key] = '****';
                        });
                    }
                    return JSON.stringify(data, null, '  ');
                })
                .compact()
                .uniq()
                .value()
                .join('\n');
        },

        getTime: function (model) {
            return moment(model.get('timestamp')).format('l LT');
        },

        getTabId: function (model) {
            if (http.statistics.isLoss(model.get('status'))) return '#loss';
            if (model.get('took') > 1000) return '#slow';
            return '#errors';
        },

        updateTab: function (id) {

            var items = this.$el.find(id).children(), tab;

            if (items.length > 0) {
                tab = this.$el.find('a[href="' + id + '"]');
                tab.find('.count').remove();
                tab.append(
                    $('<span class="count">').text(' (' + items.length + ')')
                );
            }
        },

        renderError: function (model) {

            var id = this.getTabId(model), self = this;

            this.$el.find(id)
            .find('.empty').remove().end()
            .append(
                $('<section class="error">').append(
                    $('<div class="message">').append(
                        $('<b>').text(this.getMessage(model)),
                        $.txt(' '),
                        $('<span class="error-id">').text(this.getID(model)),
                        $.txt(' '),
                        $('<span class="datetime">').text(this.getTime(model))
                    ),
                    $('<div class="url">').text(this.getUrl(model)),
                    $('<div>').append(
                        $('<a href="#" class="toggle-request-body" data-visible="false">').text(gt('Show request body')),
                        $('<div class="request-body">').hide().text(this.getRequestBody(model))
                    )
                    .append(function () {
                        var trace = self.getStrackTrace(model);
                        return trace ? [
                            $('<a href="#" class="toggle-stack-trace" data-visible="false">').text(gt('Show stack trace')),
                            $('<div class="stack-trace">').hide().text(trace)
                        ] : [];
                    })
                )
            );

            this.updateTab(id);
        }
    });

    ext.point('io.ox/core/settings/errorlog/settings/detail').extend({
        draw: function () {
            this.append(
                $('<h1>').text(gt('Error log')),
                (new ErrorLogView()).render().$el
            );
        }
    });
});
