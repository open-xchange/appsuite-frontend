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
    'gettext!io.ox/mail',
    'less!io.ox/mail/mailfilter/settings/style.css'
], function (model, views, forms, actions, links, gt) {

    "use strict";

    function createVacationEdit(ref) {
        var point = views.point(ref + '/edit/view'),
            VacationEditView = point.createView({
                tagName: 'div',
                className: 'edit-vacation'
            });

        point.extend(new forms.Header({
            index: 50,
            id: 'headline',
            label: gt('Vacation Notice')

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

        // Actions
        point.basicExtend(new links.InlineLinks({
            index: 150,
            id: 'inline-actions',
            ref: ref + '/edit/view/inline',
            customizeNode: function ($node) {
                $node.addClass("span9");
                $node.css({marginBottom: '20px'});
            }
        }));

        // Save

        views.ext.point(ref + "/edit/view/inline").extend(new links.Button({
            id: "save",
            index: 100,
            label: gt("Save"),
            ref: ref + "/actions/edit/save",
            cssClasses: "btn btn-primary",
            tabIndex: 10,
            tagtype: "button"
        }));

        // Edit Actions

        new actions.Action(ref + '/actions/edit/save', {
            id: 'save',
            action: function (options, baton) {
                options.parentView.trigger('save:start');
                options.model.save().done(function () {
                    options.parentView.trigger('save:success');
                }).fail(function () {
                    options.parentView.trigger('save:fail');
                });
            }
        });

        point.extend(new forms.CheckBoxField({
            id: ref + '/edit/view/aktiv',
            index: 250,
            label: model.fields.active,
            attribute: 'active',
            customizeNode: function () {
                this.$el.css({
                    clear: 'both'
                });
            }

        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/subject',
            index: 250,
            label: model.fields.subject,
            control: '<input type="text" class="input-xlarge" name="' + 'subject' + '">',
            attribute: 'subject'
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/mailtext',
            index: 250,
            label: model.fields.text,
            control: '<textarea rows="12" class="span6" name="' + 'test' + '">',
            attribute: 'text'
        }));

        point.extend(new forms.SelectBoxField({
            id: ref + '/edit/view/days',
            index: 250,
            label: model.fields.days,
            attribute: 'days',
            selectOptions: {1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8'}
        }));


        var index = 400;

        return VacationEditView;
    }

    return {
        protectedMethods: {
            createVacationEdit: createVacationEdit
        }
    };

});
