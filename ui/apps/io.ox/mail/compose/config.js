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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/mail/compose/config', [
    'settings!io.ox/mail',
    'io.ox/mail/util',
    'io.ox/mail/compose/signatures'
], function (settings, mailUtil, signatureUtil) {

    'use strict';

    return Backbone.Model.extend({

        defaults: function () {
            var mode = _.device('smartphone') ? 'html' : settings.get('messageFormat', 'html');
            return {
                // based on model.type
                type: 'new',
                // Autodismiss confirmation dialog
                autoDismiss: false,
                preferredEditorMode: mode,
                editorMode: mode,
                toolbar: true,
                sendDisplayName: !!settings.get('sendDisplayName', true),
                // store tiny device detection (tinymce hides toolbar on non-desktop devices)
                desktop: true,
                // signatures
                defaultSignatureId: '',
                // identifier for empty signature (dropdown)
                signatureId: '',
                signature: '',
                signatureIsRendered: undefined,
                imageResizeOption: ''
            };
        },

        initialize: function () {
            _.extend(this, signatureUtil.model, this);
        },

        is: function (type) {
            var reType = new RegExp('^(' + type + ')$');
            return reType.test(this.get('type'));
        }

    });

});
