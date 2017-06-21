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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/vacationnotice/settings/view-form', [
    'io.ox/core/api/mailfilter',
    'io.ox/mail/vacationnotice/settings/model',
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/settings/util',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/core/yell',
    'io.ox/core/api/user',
    'io.ox/contacts/util',
    'gettext!io.ox/mail',
    'less!io.ox/mail/vacationnotice/settings/style'
], function (api, model, views, ext, mini, ModalView, util, DatePicker, yell, userAPI, contactsUtil, gt) {

    'use strict';

    var POINT = 'io.ox/mail/vacation-notice/edit',
        INDEX = 0,
        INDEX_RANGE = 0;

    function open(model) {

        return new ModalView({
            async: true,
            focus: 'input[name="active"]',
            model: model || new Backbone.Model({
                active: true, activateTimeFrame: true, days: '2', from: 'default', subject: 'Out of office',
                dateFrom: +moment(), dateUntil: +moment().add(1, 'week')
            }),
            point: POINT,
            render: false,
            title: gt('Vacation notice'),
            width: 640
        })
        .inject({
            updateActive: function () {
                var enabled = this.model.get('active');
                this.$body.toggleClass('disabled', !enabled).find(':input').prop('disabled', !enabled);
                this.updateDateRange();
            },
            updateDateRange: function () {
                var enabled = this.model.get('active') && this.model.get('activateTimeFrame');
                this.$('.date-range .form-control').prop('disabled', !enabled);
            }
        })
        .build(function () {
            this.$el.addClass('edit-vacation');
        })
        .addCancelButton()
        .addButton({ label: gt('Apply changes'), action: 'apply' })
        .on('open', function () {
            var view = this;
            this.busy();
            getData().then(
                function (data) {
                    view.data = data;
                    view.config = data.config;
                    view.render().idle().updateActive();
                },
                function (e) {
                    yell(e);
                    view.close();
                }
            );
        })
        .open();
    }

    ext.point(POINT).extend(
        //
        // switch
        //
        {
            index: INDEX += 100,
            id: 'switch',
            render: function () {

                this.$header.prepend(
                    new mini.SwitchView({ name: 'active', model: this.model, label: '', size: 'large' })
                        .render().$el.attr('title', gt('Enable or disable vacation notice'))
                );

                this.listenTo(this.model, 'change:active', this.updateActive);
            }
        },
        //
        // Time range
        //
        {
            index: INDEX += 100,
            id: 'range',
            render: function (baton) {
                // supports date?
                if (!_(this.config.tests).findWhere({ test: 'currentdate' })) return;
                this.$body.append(
                    baton.branch('range', this, $('<div class="form-group date-range">'))
                );
            }
        }
    );

    ext.point(POINT + '/range').extend(
        //
        // Date range / checkbox
        //
        {
            index: INDEX_RANGE += 100,
            id: 'checkbox',
            render: function (baton) {

                this.listenTo(baton.model, 'change:activateTimeFrame', function () {
                    this.updateDateRange();
                });

                baton.$el.append(
                    util.checkbox('activateTimeFrame', model.fields.activateTimeFrame, baton.model)
                );
            }
        },
        //
        // Date range / from & until
        //
        {
            index: INDEX_RANGE += 100,
            id: 'from-util',
            render: function (baton) {
                baton.$el.append(
                    $('<div class="row">').append(
                        ['dateFrom', 'dateUntil'].map(function (id) {
                            return $('<div class="col-md-4">').append(
                                $('<label>').attr('for', 'vacation_notice_' + id).text(model.fields[id]),
                                new mini.DateView({ name: id, model: baton.model, id: 'vacation_notice_' + id })
                                    .render().$el
                                    .prop('disabled', !baton.model.get('activateTimeFrame'))
                            );
                        })
                    )
                );
            }
        }
    );

    ext.point(POINT).extend(
        //
        // Subject
        //
        {
            index: INDEX += 100,
            id: 'subject',
            render: function (baton) {
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label for="vacation_notice_subject">').append(model.fields.subject),
                        new mini.InputView({ name: 'subject', model: baton.model, className: 'form-control', id: 'vacation_notice_subject' }).render().$el
                    )
                );
            }
        },
        //
        // Mail text
        //
        {
            index: INDEX += 100,
            id: 'text',
            render: function (baton) {
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label for="vacation_notice_text">').text(model.fields.text),
                        new mini.TextView({ name: 'text', model: baton.model, id: 'vacation_notice_text', rows: '8' }).render().$el
                    )
                );
            }
        },
        //
        // Days
        //
        {
            index: INDEX += 100,
            id: 'days',
            render: function (baton) {
                this.$body.append(
                    $('<div class="form-group row">').append(
                        $('<label for="vacation_notice_days" class="col-md-12">').text(model.fields.days),
                        $('<div class="col-md-4">').append(
                            new mini.SelectView({ list: this.data.days, name: 'days', model: baton.model, id: 'vacation_notice_days' }).render().$el
                        )
                    )
                );
            }
        },
        //
        // Sender
        //
        {
            index: INDEX += 100,
            id: 'sender',
            render: function () {
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label for="days">').text(model.fields.sendFrom),
                        new mini.SelectView({ list: this.data.from, name: 'from', model: this.model, id: 'from' }).render().$el
                    )
                );
            }
        },
        // Aliases
        {
            index: INDEX += 100,
            id: 'aliases',
            render: function () {

                var model = this.model,
                    primaryMail = model.get('primaryMail') || this.data.aliases[0];

                // remove primary mail from aliases
                this.data.aliases.splice(_(this.data.aliases).indexOf(primaryMail), 1);

                if (!this.data.aliases.length) return;

                this.$body.append(
                    $('<div class="help-block">').text(
                        gt('The Notice is sent out for messages received by %1$s. You may choose to send it out for other recipient addresses too:', primaryMail)
                    ),
                    _(this.data.aliases).map(function (alias) {
                        return util.checkbox(alias, alias, model);
                    }),
                    $('<div>').append(
                        $('<button class="btn btn-link" data-action="select-all">')
                            .text('Select all')
                            .on('click', { view: this }, onSelectAll)
                    )
                );

                function onSelectAll(e) {
                    var view = e.data.view;
                    _(view.data.aliases).each(function (alias) {
                        view.model.set(alias, true);
                    });
                }
            }
        }
    );

    // function createVacationEdit(ref, multiValues, activateTimeframe, config) {
    //     ext.point(ref + '/edit/view').extend({
    //         index: 250,
    //         id: ref + '/edit/view/sender',
    //         draw: function (baton) {
    //             var SelectView = mini.SelectView.extend({
    //                 onChange: function () {
    //                     var valuePosition = _.findIndex(baton.multiValues.from, { value: this.$el.val() });
    //                     this.model.set(this.name, baton.multiValues.fromArrays[valuePosition]);
    //                 },
    //                 update: function () {
    //                     var valuePosition,
    //                         modelValue = this.model.get(this.name);
    //                     if (_.isArray(modelValue)) {
    //                         this.$el.val(baton.multiValues.from[_.findIndex(baton.multiValues.fromArrays, modelValue)].value);
    //                     } else {
    //                         valuePosition = _.findIndex(baton.multiValues.from, { value: modelValue });
    //                         if (valuePosition === -1) valuePosition = _.findIndex(baton.multiValues.from, { label: modelValue });
    //                         this.$el.val(baton.multiValues.from[valuePosition].value);
    //                     }
    //                 }
    //             });

    //             this.append(
    //                 $('<div>').addClass('form-group').append(
    //                     $('<div class="row">').append(
    //                         $('<label class="col-sm-2">').attr({ 'for': 'days' }).text(model.fields.sendFrom),
    //                         $('<div class="col-sm-6">').append(
    //                             new SelectView({ list: baton.multiValues.from, name: 'from', model: baton.model, id: 'from', className: 'form-control' }).render().$el
    //                         )
    //                     )
    //                 )
    //             );
    //         }
    //     });

    //
    // Get required data
    //
    var getData = (function () {

        var userFullName = '';

        function getDays() {
            return _.range(1, 32).map(function (i) { return { label: i, value: i }; });
        }

        function getFrom(aliases) {
            return [].concat(
                // default sender
                { value: 'default', label: gt('default sender') },
                // aliases
                _(aliases).map(function (key, value) {
                    return {
                        value: userFullName ? userFullName + ' <' + value + '>' : value,
                        label: userFullName ? '"' + userFullName + '" <' + value + '>' : value
                    };
                })
            );
        }

        function getFromArrays(aliases) {
            return [].concat(
                ['default', 'default'],
                _(aliases).map(function (value) {
                    return userFullName ? [userFullName, value] : [value];
                })
            );
        }

        return function () {

            return $.when(userAPI.get(), api.getConfig()).then(function (user, config) {

                userFullName = contactsUtil.getMailFullName(user).trim();
                var aliases = _.object(user.aliases, user.aliases);

                return {
                    aliases: user.aliases,
                    config: config,
                    days: getDays(),
                    from: getFrom(aliases),
                    fromArrays: getFromArrays(aliases),
                    user: user
                };
            });
        };

    }());

    return {
        getData: getData,
        open: open
    };

});
