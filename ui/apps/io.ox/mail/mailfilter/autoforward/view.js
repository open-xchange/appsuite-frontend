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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/mailfilter/autoforward/view', [
    'io.ox/mail/mailfilter/autoforward/model',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util',
    'io.ox/core/extensions',
    'io.ox/core/yell',
    'gettext!io.ox/mail',
    // yep, also use vacationnotice here
    'less!io.ox/mail/mailfilter/vacationnotice/style'
], function (Model, ModalView, mini, util, ext, yell, gt) {

    'use strict';

    var POINT = 'io.ox/mail/auto-forward/edit',
        INDEX = 0;

    function open() {
        return getData().then(openModalDialog, fail);
    }

    function fail(e) {
        yell('error', e.code === 'MAIL_FILTER-0015' ?
            gt('Unable to load mail filter settings.') :
            gt('Unable to load your auto forward settings. Please retry later.')
        );
        throw e;
    }

    function openModalDialog(data) {

        return new ModalView({
            async: true,
            focus: 'input[name="active"]',
            model: data.model,
            point: POINT,
            title: gt('Auto forward'),
            width: 640
        })
        .inject({
            updateActive: function () {
                var enabled = this.model.get('active');
                this.$body.toggleClass('disabled', !enabled).find(':input').prop('disabled', !enabled);
            }
        })
        .build(function () {
            this.data = data;
            this.$el.addClass('rule-dialog');
        })
        .addCancelButton()
        .addButton({ label: gt('Apply changes'), action: 'save' })
        .on('open', function () {
            this.updateActive();
        })
        .on('save', function () {
            this.model.save().done(this.close).fail(this.idle).fail(yell);
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
                        .render().$el.attr('title', gt('Enable or disable auto forward'))
                );

                this.listenTo(this.model, 'change:active', this.updateActive);
            }
        },
        //
        // Address
        //
        {
            index: INDEX += 100,
            id: 'to',
            render: function () {
                this.$body.append(util.input('to', gt('Forward all incoming emails to this address'), this.model));
            }
        },
        //
        // Keep
        //
        {
            index: INDEX += 100,
            id: 'copy',
            render: function () {
                this.$body.append(util.checkbox('copy', gt('Keep a copy of the message'), this.model));
            }
        },
        //
        // Stop
        //
        {
            index: INDEX += 100,
            id: 'stop',
            render: function () {
                this.$body.append(util.checkbox('processSub', gt('Process subsequent rules'), this.model));
            }
        }
    );

    //
    // Get required data
    //
    function getData() {
        var model = new Model();
        return model.fetch().then(function () {
            return { model: model };
        });
    }

    return { open: open };
});
