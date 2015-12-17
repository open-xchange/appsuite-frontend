/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/extensions', [
    'io.ox/backbone/mini-views/common',
    'io.ox/onboarding/clients/api',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'gettext!io.ox/core/onboarding'
], function (mini, api, yell, ext, gt) {

    'use strict';

    // scenario action views

    var POINT = 'io.ox/onboarding/clients/views';

    function notify(resp) {
        if (_.isObject(resp) && 'error' in resp) return yell(resp);
        return yell('info', resp);
    }

    var ActionsView = Backbone.View.extend({

        events: {
            'click .action>legend': 'accordion'
        },

        initialize: function (options) {
            _.extend(this, options);
            this.setElement($('<div class="actions">'));
        },

        render: function () {
            var scenarios = this.scenarios,
                config = this.config;
            _.each(scenarios, function (scenario) {
                var list = config.getActions(scenario.id),
                    node = $('<div>').attr('data-parent', scenario.id),
                    baton = ext.Baton({ data: list, config: config, model: config.model });
                // draw actions
                _.each(baton.data, function (action) {
                    node.attr('data-value', action.id);
                    ext.point(POINT + '/' + action.id).invoke('draw', node, action, baton);
                });
                this.$el.append(node);
                // expand first action
                this.$el.find('.action:first').addClass('expanded');
            }.bind(this));
            return this;
        },

        accordion: function (e) {
            e.preventDefault();
            // collapse other actions
            var target = $(e.target).closest('.action');
            target.toggleClass('expanded');
            target.parent().find('.action').not(target).removeClass('expanded');
        }
    });

    var DisplayActionView = Backbone.View.extend({

        labels: {
            // card
            'carddav_hostName': gt('hostname'),
            'carddav_login': gt('login'),
            // smtp
            'smtpLogin': gt('SMTP login'),
            'smtpServer': gt('SMTP server'),
            'smtpPort': gt('SMTP port'),
            'smtpSecure': gt('SMTP secure'),
            // imap
            'imapLogin': gt('IMAP login'),
            'imapServer': gt('IMAP server'),
            'imapPort': gt('IMAP port'),
            'imapSecure': gt('IMAP secure')
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        render: function () {
            var self = this, form;
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title sectiontitle">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Manual'))
                        ),
                    // content
                    $('<span class="content">').append(
                        $('<div class="description">')
                            .text(gt('Setup your profile manually.')),
                        form = $('<div class="data">')
                    )
                );
            // add rows
            var list = Object.keys(this.data).sort();
            _.each(list, function (key) {
                var value = self.data[key],
                    group = $('<div class="row">');
                group.append(
                    $('<label class="control-label col-sm-4">').text(self.labels[key] || key),
                    $('<div class="col-sm-7">').append(
                        $('<input class="form-control" readonly>').val(value)
                            .on('click', function () {
                                $(this).select();
                            })
                    )
                );
                form.append(group);
            });
            return this;
        }
    });

    var NumberActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        render: function () {
            var form;
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title sectiontitle">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('SMS'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Send me the profile data by SMS.')),
                        // form
                        form = $('<div class="data">'),
                        // action
                        $('<button>')
                            .addClass('btn btn-sm btn-primary')
                            .text(gt('Send'))
                    )
                );
            var value = this.model.get('number'),
                node = new mini.InputView({ name: 'number', model: this.model }).render()
                        .$el
                        .removeClass('form-control')
                        .addClass('field form-control')
                        .attr('title', this.name)
                        .attr('list', 'addresses')
                        .val(value || '');

            var group = $('<div class="row">');
            group.append(
                $('<label class="control-label col-sm-4">').text(gt('SMS')),
                $('<div class="col-sm-7">').append(
                    node,
                    $('<datalist id="addresses">').append(
                        $('<option>').attr('value', this.config.getUserMobile())
                    )
                )
            );
            if (value) node.val(value);
            form.append(group);
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    number: this.model.get('number')
                };
            // call
            api.execute(scenario, action, data).always(notify);
        }
    });

    var EmailActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        render: function () {
            var form;
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title sectiontitle">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Email'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Send me the profile data by mail.')),
                        // form
                        form = $('<div class="data">'),
                        // action
                        $('<button>')
                            .addClass('btn btn-sm btn-primary')
                            .text(gt('Send'))
                    )
                );
            var value = this.model.get('email'),
                node = new mini.InputView({ name: 'email', model: this.model }).render()
                        .$el
                        .removeClass('form-control')
                        .addClass('field form-control')
                        .attr('title', this.name)
                        .attr('list', 'addresses')
                        .val(value || '');

            var group = $('<div class="row">');
            group.append(
                $('<label class="control-label col-sm-4">').text(gt('Email')),
                $('<div class="col-sm-7">').append(
                    node,
                    $('<datalist id="addresses">').append(
                        $('<option>').attr('value', this.config.getUserMail())
                    )
                )
            );
            if (value) node.val(value);
            form.append(group);
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    email: this.model.get('email')
                };
            // call
            api.execute(scenario, action, data).always(notify);
        }
    });

    var DownloadActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            // root
            this.setElement(
                $('<fieldset class="action form-group">')
                .attr('data-action', action.id)
            );
        },

        render: function () {
            this.$el.empty()
                .append(
                    // title
                    $('<legend class="title sectiontitle">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right">'),
                            $('<i class="fa fa-fw fa-chevron-down">'),
                            $.txt(gt('Download'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .text(gt('Simply download the profile to your device.')),
                        // action
                        $('<button>')
                            .addClass('btn btn-sm btn-primary')
                            .text(gt('Download'))
                    )
                );
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            var url = api.getUrl(this.config.getScenarioCID(), this.id);
            require(['io.ox/core/download'], function (download) {
                download.url(url);
            });
        }
    });

    return {
        ActionsView: ActionsView,
        DisplayActionView: DisplayActionView,
        NumberActionView: NumberActionView,
        EmailActionView: EmailActionView,
        DownloadActionView: DownloadActionView
    };
});
