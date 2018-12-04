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
    'settings!io.ox/mail'
], function (settings) {

    'use strict';

    console.log(settings);

    return Backbone.Model.extend({

        defaults: {
            preferredEditorMode: _.device('smartphone') ? 'html' : settings.get('messageFormat', 'html'),
            editorMode: _.device('smartphone') ? 'html' : settings.get('messageFormat', 'html'),
            sendDisplayName: !!settings.get('sendDisplayName', true)
        },

        initialize: function () {
            // map 'alternative' to editor
            if (this.get('preferredEditorMode') === 'alternative') {
                this.set('editorMode', 'html', { silent: true });
                if (this.get('content_type') === 'text/plain') {
                    this.set('editorMode', 'text', { silent: true });
                }
            }
        }
    });

});
