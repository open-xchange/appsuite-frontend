/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/onboarding/clients/extensions', [
    'io.ox/backbone/mini-views/common',
    'io.ox/onboarding/clients/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'gettext!io.ox/core/onboarding'
], function (mini, api, ModalDialog, yell, ext, gt) {

    'use strict';

    // scenario action views

    var POINT = 'io.ox/onboarding/clients/views';

    function yellError(resp) {
        if (_.isObject(resp) && 'error' in resp) return yell(resp.warnings ? 'warning' : 'error', resp.error_desc || resp.error);
    }

    var util = {
        removeIcons: function (obj) {
            var target = $(obj.target || obj);
            target.parent().find('.button-clicked').remove();
        },
        addIcon: function (obj) {
            var target = $(obj.target || obj);
            util.removeIcons(obj);
            target.after($('<i class="fa fa-check button-clicked" aria-hidden="true">'));
        },
        disable: function (obj) {
            $(obj.target || obj).addClass('disabled');
            $(obj.target || obj).prop('disabled', true);
        },
        enable: function (obj) {
            $(obj.target || obj).removeClass('disabled');
            $(obj.target || obj).prop('disabled', false);
        },
        showWizard: function () {
            $('.client-onboarding, .wizard-backdrop').show();
        },
        hideWizard: function () {
            $('.client-onboarding, .wizard-backdrop').hide();
        }
    };

    var ActionsListView = Backbone.View.extend({

        events: {
            'click .section-title': 'accordion',
            'click .toggle-link': 'toggleMode'
        },

        initialize: function (options) {
            _.extend(this, options);
            this.setElement($('<div class="actions">'));
            this.register();
        },

        register: function () {
            // metrics
            var wizard = this.wizard;
            this.$el.on('click', '.action', function (e) {
                var id = $(this).attr('data-action'),
                    target = $(e.target),
                    eventname = target.hasClass('action-call') ? 'action:execute' : 'action:select',
                    detail = target.attr('data-detail');
                wizard.trigger(eventname, id, detail);
            });
        },

        getToggleNode: function () {
            var id = _.uniqueId('description');
            return [
                $('<div class="sr-only">').attr('id', id).text(gt('Show or hide alternative options for advanced users.')),
                $('<a href="#" class="toggle-link" data-value="to-advanced">').attr('aria-describedby', id).text(gt('Show more options')),
                $('<a href="#" class="toggle-link" data-value="to-simple">').attr('aria-describedby', id).text(gt('Show less options'))
            ];
        },

        toggleMode: function (e) {
            e.preventDefault();
            var step = this.$el.closest('.wizard-step'),
                toSimple = step.attr('data-mode') === 'advanced';
            // update model and trigger event
            step.attr('data-mode', toSimple ? 'simple' : 'advanced');
            this.wizard.trigger('mode:toggle', toSimple ? 'simple' : 'advanced');
            return this.update();
        },

        update: function () {
            var list = this.$el.find('.actions-scenario'),
                mode = this.$step.attr('data-mode');
            _.each(list, function (container) {
                container = $(container);
                // advanced: cover (hidden) actions of not selected
                // selections to be ready when users switches scenarios
                var actions = container.find(mode === 'advanced' ? '.action' : '.action:visible');
                if (actions.length <= 1) {
                    return container.addClass('single-action');
                }
                container.removeClass('single-action');
            });
        },

        render: function () {
            var scenarios = this.scenarios,
                config = this.config,
                self = this;
            _.each(scenarios, function (scenario) {
                var list = config.getActions(scenario.id) || [],
                    node = $('<div class="actions-scenario hidden" role="tablist">').attr('data-parent', scenario.id),
                    baton = ext.Baton({ data: list, config: config, model: config.model });
                // draw actions
                _.each(baton.data, function (action) {
                    node.attr('data-value', action.id);
                    var actionpoint = ext.point(POINT + '/' + action.type);
                    // TODO: remove when middleware is ready
                    if (actionpoint.list().length === 0 && ox.debug) console.error('missing view for client-onboarding action: ' + action.id);
                    actionpoint.invoke('draw', node, action, baton);
                });
                // add toggle link
                if (baton.data.length > 1) {
                    node.append(self.getToggleNode());
                }
                this.$el.append(node);
                // expand first action
                this.$el.find('.action:first').addClass('expanded');
            }.bind(this));
            // update
            this.update();
            return this;
        },

        accordion: function (e) {
            e.preventDefault();
            var target = $(e.target),
                action = target.closest('.action'),
                container = action.closest('.actions');
            if (container.find('.action:visible').length <= 1) {
                // does not collapse when only action visible
                action.addClass('expanded').find('.section-title').attr('aria-pressed', true);
            } else {
                action.toggleClass('expanded').find('.section-title').attr('aria-pressed', action.hasClass('expanded'));
            }
            // there can only be one
            action.closest('.actions-scenario').find('.action').not(action).removeClass('expanded').find('.section-title').attr('aria-pressed', false);
        }

    });

    var DisplayActionView = Backbone.View.extend({

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
            var id = _.uniqueId('controls');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" role="tab">')
                        .attr('aria-controls', id)
                        .append(
                            $.txt(gt('Show manual configuration options'))
                        ),
                    // data
                    $('<pre class="config">').append(
                        $('<div>').append(_.map(this.data, function (prop) {
                            var isTitle = !('value' in prop);
                            return $('<div class="property">').addClass(isTitle ? 'title' : '').text(prop.name + (isTitle ? '' : ':'));
                        })),
                        $('<div>').append(_.map(this.data, function (prop) {
                            var isTitle = !('value' in prop);
                            return $('<div class="value">').text(isTitle ? '\xa0' : prop.value).addClass(isTitle ? 'title' : '');
                        }))
                    )
                );
            return this;
        }
    });

    var ShortMessageActionView = Backbone.View.extend({

        tagName: 'fieldset',
        className: 'action form-group',
        events: {
            'click .btn': '_onClick',
            'keyup input': '_updateState',
            'change input': '_updateState'
        },

        initialize: function (action, options) {
            _.extend(this, action);
            this.model = options.baton.model;
            this.config = options.baton.config;
            this.$el.attr('data-action', action.id);
        },

        _input: function () {
            var value = this.model.get('sms') || this.config.getUserMobile();
            return new mini.InputView({ name: 'sms', type: 'tel', model: this.model }).render()
                    .$el
                    .removeClass('form-control')
                    .addClass('field form-control')
                    .attr('title', this.name)
                    .attr('list', 'addresses')
                    .attr('placeholder', gt('Cell phone'))
                    .val(value).trigger('change');
        },

        _select: function () {
            var select = new mini.SelectView({
                    name: 'code',
                    model: this.model,
                    list: this.config.getCodes()
                }),
                standard = this.default;
            // adjust node
            select.render().$el
                .removeClass('form-control')
                .addClass('select form-control')
                .attr('title', this.name)
                .attr('list', 'addresses')
                .val(this.model.get('code') || this.config.getCodes(standard).value).trigger('change');
            return select;
        },

        render: function () {
            var id = _.uniqueId('description');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" role="tab">')
                        .attr('aria-describedby', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Automatic Configuration (via SMS)'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .attr('id', id)
                            .text(gt('Please enter your mobile phone number, and we´ll send you a link to automatically configure your iOS device! It´s that simple!')),
                        // form
                        $('<div class="interaction">').append(
                            $('<form class="form-inline">').append(
                                $('<div class="row">').append(
                                    //$('<label class="control-label">').text(gt('Phone Number')),
                                    this._select().$el,
                                    this._input(),
                                    $('<button type="button" class="btn btn-primary action-call">').text(gt('Send'))
                                )
                            )
                        )
                    )
                );

            return this;
        },

        getNumber: function () {
            var local = this.model.get('sms'),
                prefix = this.model.get('code');
            // remove everything except digits and '+'
            local = local.replace(/[^\d+]+/g, '');
            prefix = prefix.replace(/[^\d+]+/g, '');
            // 0049... -> +49...
            local = local.replace(/^00/, '+');
            // valid country code entered?
            if (!!this.config.find(local)) return local;
            // keep only digits
            local = local.replace(/[\D]+/g, '');
            // remove leading zero
            local = local.replace(/^0+/, '');
            return prefix + local;
        },

        _updateState: function (e) {
            if (e.which === 13) return;
            var value = $(e.target).val().trim(),
                button = this.$('button.action-call');
            util.removeIcons(button);
            if (!value.length) return util.disable(button);
            util.enable(button);
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    sms: this.getNumber()
                };
            // call
            util.disable(e);

            // show modal only
            util.hideWizard();

            new ModalDialog({
                title: gt('Please confirm'),
                width: 600
            })
            .build(function () {
                //#. %1$s: a cell phone number
                this.$body.text(gt('Link will be sent to %1$s', data.sms));
            })
            .addCancelButton()
            .addButton({ action: 'apply', label: gt('Send') })
            .on('apply', function () {
                api.execute(scenario, action, data)
                .always(yellError)
                .done(_.partial(util.addIcon, e))
                .fail(_.partial(util.removeIcons, e))
                .fail(_.partial(util.enable, e));
            })
            .on('cancel', function () {
                util.showWizard();
                util.enable(e);
            })
            .open();
        }
    });

    var EmailActionView = Backbone.View.extend({

        events: {
            'click .btn': '_onClick',
            'keyup input': '_updateState',
            'change input': '_updateState'
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

        _input: function () {
            var value = this.model.get('email') || this.config.getUserMail();
            return new mini.InputView({ name: 'email', model: this.model }).render()
                .$el
                .addClass('field form-control')
                .attr('title', this.name)
                .attr('list', 'addresses')
                .val(value || '')
                .trigger('change');
        },

        render: function () {
            var id = _.uniqueId('description');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" role="tab">')
                        .attr('aria-describedby', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Configuration Email'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .attr('id', id)
                            .text(this.description),
                        // form
                        $('<div class="interaction">').append(
                            $('<form class="form-inline">').append(
                                $('<div class="row">').append(
                                    this._input(),
                                    // action
                                    $('<button type="button" class="btn btn-primary action-call">').text(gt('Send'))
                                )
                            )
                        )
                    )
                );
            return this;
        },

        _updateState: function (e) {
            if (e.which === 13) return;
            var value = $(e.target).val().trim(),
                button = this.$('button.action-call');
            util.removeIcons(button);
            if (!value.length) return util.disable(button);
            util.enable(button);
        },

        _onClick: function (e) {
            e.preventDefault();
            var scenario = this.config.getScenarioCID(),
                action = this.id,
                data = {
                    email: this.model.get('email')
                };
            // call
            api.execute(scenario, action, data)
                .always(yellError)
                .done(_.partial(util.addIcon, e))
                .fail(_.partial(util.removeIcons, e))
                .fail(_.partial(util.enable, e));
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
            var ref = _.uniqueId('description-');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" role="tab">')
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Automatic Configuration'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">')
                            .attr('id', ref)
                            .text(this.description),
                        // action
                        $('<button type="button" class="btn btn-primary action-call">')
                            .attr('aria-describedby', ref)
                            .text(gt('Download profile'))
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

    var ClientActionView = Backbone.View.extend({

        events: {
            'click .action-call': '_onClick'
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

        getImage: function () {
            // placeholder is a transparent base64 image; less variable defines background image url
            if (!this.image && !this.imageplaceholder) return $();
            // appstore button
            return $('<a href="#" class="app">').append(
                $('<img class="app-icon action-call" role="button">').attr({
                    'data-detail': this.store.name,
                    'src': this.image || this.imageplaceholder
                })
            );
        },

        getButton: function () {
            if (!this.store.image) return $('<button type="button" class="btn btn-primary action-call">').text(gt('Download'));
            // appstore button
            return $('<a href="#" class="store">').append(
                $('<img class="store-icon action-call" role="button">').attr({
                    'data-detail': this.store.name,
                    'src': this.store.image
                })
            );
        },

        render: function () {
            var id = _.uniqueId('description');
            this.$el.empty()
                .append(
                    // title
                    $('<button class="title section-title" role="tab">')
                        .attr('aria-describedby', id)
                        .append(
                            $('<i class="fa fa-fw fa-chevron-right" aria-hidden="true"> '),
                            $('<i class="fa fa-fw fa-chevron-down" aria-hidden="true">'),
                            $.txt(gt('Installation'))
                        ),
                    $('<span class="content">').append(
                        // description
                        $('<div class="description">').attr(id, id).text(this.store.description),
                        this.getImage(),
                        this.getButton()

                    )
                );
            return this;
        },

        _onClick: function (e) {
            e.preventDefault();
            window.open(this.link);
        }
    });

    return {
        ActionsListView: ActionsListView,
        DisplayActionView: DisplayActionView,
        ShortMessageActionView: ShortMessageActionView,
        EmailActionView: EmailActionView,
        DownloadActionView: DownloadActionView,
        ClientActionView: ClientActionView
    };
});
