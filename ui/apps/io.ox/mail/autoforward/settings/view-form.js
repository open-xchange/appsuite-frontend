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

define('io.ox/mail/autoforward/settings/view-form', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views',
    'io.ox/mail/autoforward/settings/model',
    'io.ox/core/settings/util',
    'io.ox/core/extensions',
    'io.ox/core/yell',
    'gettext!io.ox/mail',
    // yep, also use vacationnotice here
    'less!io.ox/mail/vacationnotice/settings/style'
], function (ModalView, mini, model, util, ext, yell, gt) {

    'use strict';

    var POINT = 'io.ox/mail/auto-forward/edit',
        INDEX = 0;

    function open() {
        return getData().then(openModalDialog, yell);
    }

    function openModalDialog(data) {

        return new ModalView({
            async: true,
            focus: 'input[name="active"]',
            model: new Backbone.Model({ active: false }),
            point: POINT,
            title: gt('Auto Forward'),
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
        .addButton({ label: gt('Apply changes'), action: 'apply' })
        .on('open', function () {
            this.updateActive();
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
            id: 'address',
            render: function () {
                this.$body.append(util.input('forwardmail', model.fields.forwardmail, this.model));
            }
        },
        //
        // Keep
        //
        {
            index: INDEX += 100,
            id: 'keep',
            render: function () {
                this.$body.append(util.checkbox('keep', model.fields.keep, this.model));
            }
        },
        //
        // Stop
        //
        {
            index: INDEX += 100,
            id: 'stop',
            render: function () {
                this.$body.append(util.checkbox('processSub', model.fields.processSub, this.model));
            }
        }
    );

    //
    // Get required data
    //
    var getData = (function () {

        return function () {
            return $.when();
        };

    }());

    return { open: open };
});
