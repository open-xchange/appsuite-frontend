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
    'io.ox/core/tk/attachments',
    'io.ox/contacts/api',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/edit/style.less'
], function (model, views, forms, actions, links, PictureUpload, attachments, api, gt) {

    "use strict";

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
            home_address: ['street_home', 'postal_code_home', 'city_home',
                           'state_home', 'country_home'],
            business_address: ['street_business', 'postal_code_business',
                               'city_business', 'state_business',
                               'country_business'],
            other_address: ['street_other', 'postal_code_other', 'city_other',
                            'state_other', 'country_other'],
            job: ['profession', 'position', 'department', 'company', 'room_number',
                    'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                    'commercial_register', 'branches', 'business_category', 'info',
                    'manager_name', 'assistant_name'],
            userfields: ['userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05',
                        'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
                        'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
                        'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'],
            comment: ['note'],
            misc: ['private_flag'],
            attachments: ['attachments_list', 'attachments_buttons']
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
                  gt('Miscellaneous'),
            attachments: gt('Attachments')
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
            attachments_list: function (options) {
                options.point.extend(new attachments.EditableAttachmentList({
                    id: options.field,
                    registerAs: 'attachmentList',
                    className: 'div',
                    index: options.index,
                    module: 7,
                    finishedCallback: function (model, id) {
                        var attr = model.attributes;
                        api.get({ id: id, folder: attr.folder_id }, false)
                            .pipe(function (data) {
                                return $.when(
                                    api.caches.get.add(data),
                                    api.caches.all.grepRemove(attr.folder_id + api.DELIM),
                                    api.caches.list.remove({ id: attr.id, folder: attr.folder_id }),
                                    api.clearFetchCache()
                                )
                                .done(function () {
                                    api.removeFromUploadList(encodeURIComponent(_.cid(data)));//to make the detailview remove the busy animation
                                    api.trigger('refresh.list');
                                });
                            });
                    }
                }), {
                    hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                        return (model.attributes.number_of_attachments === undefined || model.attributes.number_of_attachments === 0);
                    }
                });
            },
            attachments_buttons: function (options) {
                options.point.extend({
                    id: options.field,
                    index: options.index,
                    render: function (baton) {
                        var baton = this.baton,
                            $node = $('<form>').appendTo(this.$el).attr('id', 'attachmentsForm'),
                            $inputWrap = attachments.fileUploadWidget({displayButton: false, multi: true}),
                            $input = $inputWrap.find('input[type="file"]')
                                .on('change', function (e) {
                            e.preventDefault();
                            if (_.browser.IE !== 9) {
                                _($input[0].files).each(function (fileData) {
                                    baton.attachmentList.addFile(fileData);
                                });
                                $input.trigger('reset.fileupload');
                            } else {
                                if ($input.val()) {
                                    var fileData = {
                                        name: $input.val().match(/[^\/\\]+$/),
                                        size: 0,
                                        hiddenField: $input
                                    };
                                    baton.attachmentList.addFile(fileData);
                                    $input.addClass('add-attachment').hide();
                                    $input = $('<input>', { type: 'file' }).appendTo($input.parent());
                                }
                            }
                        }).on('focus', function () {
                            $input.attr('tabindex', '1');
                        });

                        $node.append($('<div>').addClass('contact_attachments_buttons').append($inputWrap));
                    }
                }, {
                    hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                        return (model.attributes.number_of_attachments === undefined || model.attributes.number_of_attachments === 0);
                    }
                });
            }
        }
    };

    _.each(['home', 'business', 'other'], function (type) {
        var fields = meta.sections[type + '_address'];
        meta.sections[type + '_address'] = _.compact(_.aprintf(
            //#. Format of addresses
            //#. %1$s is the street
            //#. %2$s is the postal code
            //#. %3$s is the city
            //#. %4$s is the state
            //#. %5$s is the country
            gt('%1$s\n%2$s %3$s\n%4$s\n%5$s'),
            function (i) { return fields[i]; }, $.noop));
    });

    function dateField(options) {
        options.point.extend(new forms.DateControlGroup({
            id: options.field,
            index: options.index,
            label: model.fields[options.field],
            attribute: options.field,
            rare: options.isRare
        }), {
            hidden: options.isAlwaysVisible ? false : options.isRare ? true : function (model) {
                return !model.isSet(options.field);
            }
        });
    }

    function createContactEdit(ref) {
        var point = views.point(ref + '/edit/view'),
            ContactEditView = point.createView({
                tagName: 'div',
                className: 'edit-contact'
            });

        point.extend(new PictureUpload({
            id: ref + '/edit/view/picture',
            index: 100,
            customizeNode: function () {
                this.$el.css({
                    display: 'inline-block',
                    height: "100px"
                }).addClass("span2 header-pic");
            }
        }));

        point.extend(new views.AttributeView({
            id: ref + '/edit/view/display_name_header',
            index: 150,
            tagName: 'div',
            className: 'clear-title',
            attribute: 'display_name'
        }));

        point.extend(new views.AttributeView({
            id: ref + '/edit/view/profession_header',
            index: 170,
            tagName: 'div',
            className: 'clear-title job',
            attribute: ['company', 'position', 'profession']
        }));

        point.basicExtend({
            id: ref + '/edit/view/headerBreak',
            index: 200,
            draw: function () {
                this.append($('<div>').css({clear: 'both'}));
            }
        });

        // Show backend errors
        point.extend(new forms.ErrorAlert({
            id: ref + '/edit/view/backendErrors',
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
            ref: ref + '/edit/view/inline',
            classes: 'form-horizontal',
            customizeNode: function ($node) {
                $node.addClass("controls");
                $node.css({marginBottom: '20px', clear: 'both'});
            }
        }));

        views.ext.point(ref + "/edit/view/inline").extend(new links.Button({
            id: "discard",
            index: 100,
            label: gt("Discard"),
            ref: ref + "/actions/edit/discard",
            cssClasses: "btn control",
            tabIndex: 11,
            tagtype: "button"
        }));

        // Save
        views.ext.point(ref + "/edit/view/inline").extend(new links.Button({
            id: "save",
            index: 100,
            label: gt("Save"),
            ref: ref + "/actions/edit/save",
            cssClasses: "btn btn-primary control",
            tabIndex: 10,
            tagtype: "button"
        }));

        // attachment Drag & Drop
        views.ext.point('io.ox/contacts/edit/dnd/actions').extend({
            id: 'attachment',
            index: 100,
            label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
            multiple: function (files, view) {
                _(files).each(function (fileData) {
                    view.baton.attachmentList.addFile(fileData);
                });
            }
        });

        // Edit Actions
        new actions.Action(ref + '/actions/edit/save', {
            id: 'save',
            action: function (options, baton) {
                //check if attachments are changed
                if (options.attachmentList.attachmentsToDelete.length > 0 || options.attachmentList.attachmentsToAdd.length > 0) {
                    options.model.attributes.tempAttachmentIndicator = true;//temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                }
                options.parentView.trigger('save:start');
                options.model.save().done(function () {
                    options.parentView.trigger('save:success');
                }).fail(function () {
                    options.parentView.trigger('save:fail');
                });
            }
        });

        new actions.Action(ref + '/actions/edit/discard', {
            id: 'discard',
            action: function (options, baton) {
                if (ref === 'io.ox/core/user') {
                    //invoked by sidepopup (portal); uses event of hidden sidebar-close button
                    $('.io-ox-sidepopup').find('[data-action="close"]').trigger('click');
                }
                else
                    options.parentView.$el.find('[data-action="discard"]').trigger('controller:quit');
            }
        });

        new actions.Action(ref + '/actions/edit/reset-image', {
            id: 'imagereset',
            action: function (baton) {
                baton.model.set("image1", '', {validate: true});
                var imageUrl =  ox.base + '/apps/themes/default/dummypicture.png';
                baton.parentView.$el.find('.picture-uploader').css('background-image', 'url(' + imageUrl + ')');
            }
        });

        var index = 400;

        _(meta.sections).each(function (fields, id) {
            var uid = ref + '/edit/' + id,
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

        return ContactEditView;
    }

    var ContactEditView = createContactEdit('io.ox/contacts');

    return {
        ContactEditView: ContactEditView,
        protectedMethods: {
            createContactEdit: createContactEdit
        }
    };

});
