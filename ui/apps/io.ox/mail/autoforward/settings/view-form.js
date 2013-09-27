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

define('io.ox/mail/autoforward/settings/view-form', [
    'io.ox/mail/autoforward/settings/model',
    'io.ox/backbone/views',
    'io.ox/backbone/forms',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/date',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'less!io.ox/mail/autoforward/settings/style.less'
], function (model, views, forms, actions, links, date, notifications, gt) {

    "use strict";

    function createAutoForwardEdit(ref, multiValues) {
        var point = views.point(ref + '/edit/view'),
            VacationEditView = point.createView({
                tagName: 'div',
                className: 'edit-autoforward'
            });

        point.extend(new forms.Header({
            index: 50,
            id: 'headline',
            label: model.fields.headline
        }));

        // Show backend errors
        point.extend(new forms.ErrorAlert({
            id: ref + '/edit/view/backendErrors',
            className: 'span7',
            index: 100,
            customizeNode: function () {
                this.$el.css({
                    marginTop: '15px'
                });
            }
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/forwardmail',
            index: 150,
            label: model.fields.forwardmail,
            control: '<input type="text" class="span6" name="forwardmail" tabindex="1">',
            attribute: 'forwardmail',
            customizeNode: function () {
                this.$el.css({
                    clear: 'both'
                });
            }
        }));

        point.extend(new forms.CheckBoxField({
            id: ref + '/edit/view/active',
            index: 350,
            label: model.fields.active,
            attribute: 'active',
            customizeNode: function () {
                this.$el.css({
                    width: '300px'
                });
            }
        }));


        return VacationEditView;
    }

    return {
        protectedMethods: {
            createAutoForwardEdit: createAutoForwardEdit
        }
    };

});
