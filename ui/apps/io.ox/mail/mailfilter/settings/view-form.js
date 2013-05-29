/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/view-form', [
    'io.ox/mail/mailfilter/settings/model',
    'io.ox/backbone/views',
    'io.ox/backbone/forms',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/date',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (model, views, forms, actions, links, date, notifications, gt) {

    "use strict";

    function createMailfilterEdit(ref) {
        var point = views.point(ref + '/edit/view'),
            MailfilterEditView = point.createView({
                tagName: 'div',
                className: 'edit-mailfilter'
            });

        point.extend(new forms.Header({
            index: 50,
            id: 'headline',
            label: 'Mailfilter'
        }));

        return MailfilterEditView;
    }

    return {
        protectedMethods: {
            createMailfilterEdit: createMailfilterEdit
        }
    };

});
