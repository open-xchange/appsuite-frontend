/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/settings/errorlog/settings/pane',
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'io.ox/core/date',
     'gettext!io.ox/core',
     'apps/io.ox/core/settings/errorlog/settings/charts.js'], function (ext, http, date, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'errorlog',
        title: gt('Error log'),
        ref: 'io.ox/core/settings/errorlog',
        index: 'last'
    });

    var ErrorLogView = Backbone.View.extend({

        tagName: 'div',
        className: 'error-log',

        events: {
            'click .nav a': 'onClickTab',
            'click .reload-statistics': 'onUpdateStatistics',
            'click .request-body .toggle': 'onToggleRequestBody'
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

        render: function () {

            // clear
            this.$el.empty();

            this.renderSummary();
            this.renderStatistics();
            this.renderChart();
            this.updateStatistics();
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
                        $.txt(gt('Date') + ': ' + (new date.Local()).format(date.DATE_TIME)), $.txt(', '),
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
                    gt('The graph shows performance frequencies in percent. Grey line shows ideal performance, blue line is measured performance.')
                )
            );
        },

        updateChart: function () {

            var canvas, data, list, chart, ctx;

            data = [0, 0, 0, 0, 0, 0, 0];
            list = http.statistics.data();

            _(list).each(function (t) {
                var i = 0;
                if (t < 100) i = 1;
                else if (t < 200) i = 2;
                else if (t < 300) i = 3;
                else if (t < 500) i = 4;
                else if (t < 1000) i = 5;
                else i = 5;
                data[i]++;
            });

            data = _(data).map(function (i) {
                return Math.round(i / list.length * 100);
            });

            chart = {
                labels: ['', '< 100 ms', '< 200 ms', '< 300 ms', '< 500 ms', '< 1s', '> 1s'],
                datasets: [{
                    fillColor: 'rgba(220, 220, 220, 0.5)',
                    strokeColor: 'rgba(220, 220, 220, 1)',
                    pointColor: 'rgba(220, 220, 220, 1)',
                    pointStrokeColor: '#fff',
                    data: [0, 30, 50, 20, 0, 0, 0]
                }, {
                    fillColor: 'rgba(0, 136, 204, 0.15)',
                    strokeColor: 'rgba(0, 136, 204, 0.80)',
                    pointColor: 'rgba(0, 136, 204, 1)',
                    pointStrokeColor: '#fff',
                    data: data
                }]
            };

            this.$el.find('.chart').empty().append(
                canvas = $('<canvas width="600" height="200">')
            );

            ctx = canvas.get(0).getContext('2d');
            new window.Chart(ctx).Line(chart, {});
        },

        renderTabs: function () {
            this.$el.append(
                // draw tab controls
                $('<ul class="nav nav-tabs">').append(
                    $('<li class="active">').append($('<a href="#errors">').text(gt('Errors'))),
                    $('<li>').append($('<a href="#slow">').text(gt('Slow requests'))),
                    $('<li>').append($('<a href="#loss">').text(gt('Loss')))
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
                // make slahes and commas readable
                .replace(/%2F/g, '/').replace(/%2C/g, ',');
        },

        getStrackTrace: function (model) {
            var stack = model.get('error_stack');
            return _.isArray(stack) ? stack[0] : '';
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
                    return JSON.stringify(data, null, '  ');
                })
                .compact()
                .uniq()
                .value()
                .join('\n');
        },

        getTime: function (model) {
            return new date.Local(model.get('timestamp')).format(date.DATETIME);
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

            var id = this.getTabId(model);

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
                    $('<div class="stack-trace">').text(this.getStrackTrace(model)),
                    $('<div class="url">').text(this.getUrl(model)),
                    $('<div class="request-body">').append(
                        $('<a href="#" class="toggle" data-visible="false">').text(gt('Show request body')),
                        $('<div class="body">').hide().text(this.getRequestBody(model))
                    )
                )
            );

            this.updateTab(id);
        }
    });

    var log = new ErrorLogView();

    ext.point('io.ox/core/settings/errorlog/settings/detail').extend({
        draw: function () {
            this.append(
                $('<h1>').text(gt('Error log')),
                log.render().$el
            );
        }
    });
});
