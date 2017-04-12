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
    'io.ox/mail/autoforward/settings/model',
    'io.ox/backbone/views',
    'io.ox/core/settings/util',
    'io.ox/core/extensions',
    'less!io.ox/mail/autoforward/settings/style'
], function (model, views, util, ext) {

    'use strict';

    function createAutoForwardEdit(ref) {
        var point = views.point(ref + '/edit/view'),
            AutoforwardEditView = point.createView({
                tagName: 'div',
                className: 'edit-autoforward'
            });

        ext.point(ref + '/edit/view').extend({
            index: 50,
            id: 'headline',
            draw: function () {
                this.append(util.header(model.fields.headline));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 100,
            id: ref + '/edit/view/active',
            draw: function (baton) {
                this.append(util.checkbox('active', model.fields.active, baton.model));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 150,
            id: ref + '/edit/view/forwardmail',
            draw: function (baton) {
                this.append(util.input('forwardmail', model.fields.forwardmail, baton.model));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 250,
            id: ref + '/edit/view/keep',
            draw: function (baton) {
                this.append(util.checkbox('keep', model.fields.keep, baton.model));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 350,
            id: ref + '/edit/view/stop',
            draw: function (baton) {
                this.append(util.checkbox('processSub', model.fields.processSub, baton.model));
            }
        });

        return AutoforwardEditView;
    }

    return {
        protectedMethods: {
            createAutoForwardEdit: createAutoForwardEdit
        }
    };

});
