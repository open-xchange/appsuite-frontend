/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/autoforward/settings/view-form',
    ['io.ox/mail/autoforward/settings/model',
     'io.ox/backbone/views',
     'io.ox/backbone/forms',
     'less!io.ox/mail/autoforward/settings/style.less'
    ], function (model, views, forms) {

    'use strict';

    function createAutoForwardEdit(ref) {
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
            className: 'col-md-7',
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
            control: '<input type="text" class="form-control" name="forwardmail" tabindex="1">',
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
