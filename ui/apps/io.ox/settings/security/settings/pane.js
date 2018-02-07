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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/settings/security/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/capabilities',
    'io.ox/core/settings/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, ExtensibleView, capabilities, util, settings, gt) {

    'use strict';

    var INDEX = 0;

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    ext.point('io.ox/settings/security/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/settings/security/settings/detail/view', model: settings })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell();
                    });
                })
                .render().$el
            );
        }
    });

    ext.point('io.ox/settings/security/settings/detail/view').extend(
        {
            id: 'title',
            index: 100,
            render: function () {
                this.$el.append(
                    util.header(gt('Security'))
                );
            }
        },
        {
            id: 'mail',
            index: INDEX += 100,
            render: function () {
                if (!(capabilities.has('webmail'))) return;

                this.$el.append(
                    util.fieldset(
                        gt.pgettext('app', 'Mail'),

                        // authenticity
                        !settings.get('features/authenticity', false) ? $() :
                            util.compactSelect('features/authenticity-level', gt('Show message authenticity'), settings, [
                                { label: gt('None'), value: 0 },
                                { label: gt('Dangerous only'), value: 1 },
                                { label: gt('Dangerous and trusted'), value: 2, se: true },
                                { label: gt('All'), value: 3 }
                            ])
                            .prop('disabled', !isConfigurable('features/authenticity-level'))

                    )
                );

            }
        }
    );

});
