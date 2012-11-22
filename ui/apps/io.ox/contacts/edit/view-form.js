/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/edit/view-form', [
    'io.ox/contacts/model',
    'io.ox/backbone/views',
    'io.ox/backbone/forms',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/contacts/widgets/pictureUpload',
    'io.ox/contacts/widgets/cityControlGroup',
    'gettext!io.ox/contacts'
], function (model, views, forms, actions, links, PictureUpload, CityControlGroup, gt) {

    "use strict";

    // TODO: more compact layout, correct handling of existing images

    var dateField, city;

    var meta = {
        sections: {
            personal: ['title', 'first_name', 'last_name', 'display_name',
                         'second_name', 'suffix', 'nickname', 'birthday',
                         'marital_status', 'number_of_children', 'spouse_name',
                         'anniversary', 'url'],
            messaging: ['email1', 'email2', 'email3', 'instant_messenger1', 'instant_messenger2'],
            phone:  ['cellular_telephone1', 'cellular_telephone2',
                      'telephone_business1', 'telephone_business2',
                      'telephone_home1', 'telephone_home2',
                      'telephone_company', 'telephone_other',
                      'fax_business', 'fax_home', 'fax_other',
                      'telephone_car', 'telephone_isdn', 'telephone_pager',
                      'telephone_primary', 'telephone_radio',
                      'telephone_telex', 'telephone_ttytdd',
                      'telephone_ip', 'telephone_assistant', 'telephone_callback'],
            home_address: ['street_home', 'city_home', 'state_home', 'country_home'],
            business_address: ['street_business', 'city_business',
                               'state_business', 'country_business'],
            other_address: ['street_other', 'city_other', 'state_other', 'country_other'],
            job: ['profession', 'position', 'department', 'company', 'room_number',
                    'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                    'commercial_register', 'branches', 'business_category', 'info',
                    'manager_name', 'assistant_name'],
            userfields: ['userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05',
                        'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
                        'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
                        'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'],
            comment: ['note'],
            misc: ['private_flag']
        },

        rare: ['nickname', 'marital_status', 'number_of_children', 'spouse_name', 'url', 'anniversary',
               // phone
               'telephone_company', 'fax_home', 'fax_other',
               'telephone_car', 'telephone_isdn', 'telephone_pager', 'telephone_primary',
               'telephone_radio', 'telephone_telex', 'telephone_ttytdd', 'telephone_assistant',
               'telephone_callback', 'telephone_ip',
               // job
               'number_of_employees', 'sales_volume', 'tax_id', 'commercial_register', 'branches',
               'business_category', 'info', 'manager_name', 'assistant_name', 'employee_type',
               // optional
               'userfield04', 'userfield05',
               'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
               'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
               'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'
               ],

        alwaysVisible: ['first_name', 'last_name', 'display_name', 'email1', 'cellular_telephone1'],

        i18n: {
            personal: gt('Personal information'),
            messaging: gt('Messaging'),
            phone: gt('Phone & fax numbers'),
            home_address: gt('Home address'),
            business_address: gt('Business address'),
            other_address: gt('Other address'),
            job: gt('Job description'),
            comment: gt('Comment'),
            userfields: gt('User fields'),
            misc: //#. section name for contact inputfields that does not fit somewhere else
                  gt('Miscellaneous')
        },

        special: {
            note: function (options) {
                options.point.extend(new forms.ControlGroup({
                    id: options.field,
                    index: options.index,
                    label: model.fields[options.field],
                    control: '<textarea rows="12" class="span6" name="' + options.field + '">',
                    rare: options.isRare,
                    attribute: options.field
                }), {
                    hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                        return !model.isSet(options.field);
                    }
                });
            },

            birthday: dateField,
            anniversary: dateField,
            private_flag: function (options) {
                options.point.extend(new forms.CheckBoxField({
                    id: options.field,
                    index: options.index,
                    label: model.fields[options.field],
                    labelClassName: 'private-flag',
                    rare: options.isRare,
                    attribute: options.field
                }), {
                    hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                        return (model.attributes.private_flag === undefined || model.attributes.private_flag === false);
                    }
                });
            },
            city_home: city('city_home', 'postal_code_home'),
            city_business: city('city_business', 'postal_code_business'),
            city_other: city('city_other', 'postal_code_other')
        }
    };


    function dateField(options) {
        options.point.extend(new forms.DateControlGroup({
            id: options.field,
            index: options.index,
            label: model.fields[options.field],
            control: '<input type="text" class="input-xlarge" name="' + options.field + '">',
            attribute: options.field,
            rare: options.isRare,
            setValueInElement: forms.utils.controlGroup.date.setValueInElement,
            setValueInModel: forms.utils.controlGroup.date.setValueInModel
        }), {
            hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                return !model.isSet(options.field);
            }
        });
    }

    function city(cityAttribute, postalCodeAttribute) {
        return function (options) {
            options.point.extend(new CityControlGroup({
                id: cityAttribute,
                index: options.index,
                label: _.noI18n(model.fields[postalCodeAttribute] + '/' + model.fields[cityAttribute]),
                zipControl: '<input type="text" class="span1" name="' + postalCodeAttribute + '">',
                control: '<input type="text" class="span3" name="' + cityAttribute + '">',
                zipAttribute: postalCodeAttribute,
                attribute: cityAttribute,
                rare: options.isRare
            }), {
                hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                    return !model.isAnySet(cityAttribute, postalCodeAttribute);
                }
            });
        };
    }

    var point = views.point('io.ox/contacts/edit/view'),
        ContactEditView = point.createView({
            tagName: 'div',
            className: 'edit-contact'
        });

    point.extend(new PictureUpload({
        id: 'io.ox/contacts/edit/view/picture',
        index: 100,
        customizeNode: function () {
            this.$el.css({
                display: 'inline-block',
                height: "100px"
            }).addClass("span2 header-pic");
        }
    }));


    point.extend(new views.AttributeView({
        id: 'io.ox/contacts/edit/view/display_name_header',
        index: 150,
        tagName: 'span',
        className: 'clear-title',
        attribute: 'display_name'
    }));

    point.extend(new views.AttributeView({
        id: 'io.ox/contacts/edit/view/profession_header',
        index: 170,
        tagName: 'div',
        className: 'clear-title job',
        attribute: ['company', 'position', 'profession']
    }));

    point.basicExtend({
        id: 'io.ox/contacts/edit/view/headerBreak',
        index: 200,
        draw: function () {
            this.append($('<div>').css({clear: 'both'}));
        }
    });

    // Show backend errors
    point.extend(new forms.ErrorAlert({
        id: 'io.ox/contacts/edit/view/backendErrors',
        className: 'span7',
        index: 250,
        customizeNode: function () {
            this.$el.css({
                marginTop: '15px'
            });
        }
    }));

    // Actions
    point.basicExtend(new links.InlineLinks({
        index: 300,
        id: 'inline-actions',
        ref: 'io.ox/contacts/edit/view/inline',
        customizeNode: function ($node) {
            $node.addClass("span9");
            $node.css({marginBottom: '20px'});
        }
    }));

    //cancel

    views.ext.point("io.ox/contacts/edit/view/inline").extend(new links.Button({
        id: "imagereset",
        index: 100,
        label: gt("Reset image"),
        ref: "io.ox/contacts/actions/edit/reset-image",
        cssClasses: "btn",
        tabIndex: 10,
        tagtype: "button"
    }));


    views.ext.point("io.ox/contacts/edit/view/inline").extend(new links.Button({
        id: "discard",
        index: 100,
        label: gt("Discard"),
        ref: "io.ox/contacts/actions/edit/discard",
        cssClasses: "btn",
        tabIndex: 11,
        tagtype: "button"
    }));

    // Save

    views.ext.point("io.ox/contacts/edit/view/inline").extend(new links.Button({
        id: "save",
        index: 100,
        label: gt("Save"),
        ref: "io.ox/contacts/actions/edit/save",
        cssClasses: "btn btn-primary",
        tabIndex: 10,
        tagtype: "button"
    }));

    // Edit Actions

    new actions.Action('io.ox/contacts/actions/edit/save', {
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

    new actions.Action('io.ox/contacts/actions/edit/discard', {
        id: 'discard',
        action: function (options, baton) {
            options.parentView.$el.find('[data-action="discard"]').trigger('controller:quit');
        }
    });

    new actions.Action('io.ox/contacts/actions/edit/reset-image', {
        id: 'imagereset',
        action: function (baton) {
            baton.model.set("image1", '');
            var imageUrl =  ox.base + '/apps/themes/default/dummypicture.png';
            baton.parentView.$el.find('.picture-uploader').css('background-image', 'url(' + imageUrl + ')');
        }
    });

    var index = 400;

    _(meta.sections).each(function (fields, id) {
        var uid = 'io.ox/contacts/edit/' + id,
            section = {};
        point.extend(new forms.Section({
            id: id,
            index: index,
            title: meta.i18n[id],
            ref: uid
        }));

        section.point = views.point(uid);
        index += 100;

        var fieldIndex = 100;
        _(fields).each(function (field) {

            var isAlwaysVisible = _(meta.alwaysVisible).indexOf(field) > -1,
                isRare = _(meta.rare).indexOf(field) > -1;


            if (meta.special[field]) {
                meta.special[field]({
                    point: section.point,
                    uid: id,
                    field: field,
                    index: fieldIndex,
                    isAlwaysVisible: isAlwaysVisible,
                    isRare: isRare
                });
            } else {
                section.point.extend(new forms.ControlGroup({
                    id: field,
                    index: fieldIndex,
                    label: model.fields[field],
                    control: '<input type="text" class="input-xlarge" name="' + field + '">',
                    rare: isRare,
                    attribute: field
                }), {
                    hidden: isAlwaysVisible ? false : isRare ? true : function (model) {
                        return !model.isSet(field);
                    }
                });
            }

            fieldIndex += 100;
        });

    });


    return {
        ContactEditView: ContactEditView
    };

});
