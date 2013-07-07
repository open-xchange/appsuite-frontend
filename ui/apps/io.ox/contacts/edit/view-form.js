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
    'io.ox/contacts/util',
    'gettext!io.ox/contacts',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/core/date',
    'less!io.ox/contacts/edit/style.less'
], function (model, views, forms, actions, links, PictureUpload, attachments, api, util, gt, capabilities, ext, date) {

    "use strict";

    var dateField, city;

    var meta = {
        sections: {
            personal: ['title', 'first_name', 'last_name', /*'display_name',*/ // yep, end-users don't understand it
                         'second_name', 'suffix', 'nickname', 'birthday',
                         'marital_status', 'number_of_children', 'spouse_name',
                         'anniversary', 'url'],
            job: ['profession', 'position', 'department', 'company', 'room_number',
                    'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                    'commercial_register', 'branches', 'business_category', 'info',
                    'manager_name', 'assistant_name'],
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

            comment: ['note'],
            private_flag: ['private_flag'],

            userfields: ['userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05',
                        'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
                        'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
                        'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'],
            attachments: ['attachments_list', 'attachments_buttons']
        },

        rare: ['nickname', 'marital_status', 'number_of_children', 'spouse_name', 'anniversary',
               // phones
               'telephone_company', 'fax_other',
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

        alwaysVisible: [
            'title', 'first_name', 'last_name', 'birthday',
            'position', 'department', 'company',
            'email1', 'email2', 'instant_messenger1',
            'cellular_telephone1', 'telephone_home1',
            'street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home',
            'private_flag', 'note'
        ],

        input_type: {
            'email1': 'email',
            'email2': 'email',
            'email3': 'email'
        },

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
            private_flag: gt('Private'),
            attachments: gt('Attachments')
        },

        special: {
            note: function (options) {
                options.point.extend(new forms.ControlGroup({
                    id: options.field,
                    index: options.index,
                    label: model.fields[options.field],
                    control: '<textarea rows="12" name="' + options.field + '" tabindex="1" class="input-xlarge">',
                    rare: options.isRare,
                    attribute: options.field
                }), {
                    isRare: function () {
                        return options.isRare;
                    },
                    hidden: options.isAlwaysVisible ? false : function (model) {
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
                    labelClassName: 'private-flag control-label',
                    className: 'form-horizontal control-group',
                    rare: options.isRare,
                    attribute: options.field
                }), {
                    isRare: function () {
                        return options.isRare;
                    },
                    hidden: options.isAlwaysVisible ? false : function (model) {
                        return (model.attributes.private_flag === undefined || model.attributes.private_flag === false);
                    }
                });
            },
            attachments_list: function (options) {
                options.point.extend(new attachments.EditableAttachmentList({
                    id: options.field,
                    registerAs: 'attachmentList',
                    className: 'row-fluid',
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
                    isRare: function () {
                        return options.isRare;
                    },
                    hidden: options.isAlwaysVisible ? false : function (model) {
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
                            $inputWrap = attachments.fileUploadWidget({
                                displayButton: false,
                                multi: true,
                                wrapperClass: 'form-horizontal control-group'
                            }),
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
                    isRare: function () {
                        return options.isRare;
                    },
                    hidden: options.isAlwaysVisible ? false : function (model) {
                        return (model.attributes.number_of_attachments === undefined || model.attributes.number_of_attachments === 0);
                    }
                });
            }
        }
    };

    // Remove attachment handling when infostore is not present
    if (!capabilities.has('infostore')) {
        delete meta.sections.attachments;
        delete meta.i18n.attachments;
    }

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
            rare: options.isRare,
            className: 'form-horizontal date-field',
            inputClassName: 'input-small',
            labelClassName: 'control-label'
        }), {
            isRare: function () {
                return options.isRare;
            },
            hidden: options.isAlwaysVisible ? false : function (model) {
                return !model.isSet(options.field);
            }
        });
    }

    function createContactEdit(ref) {

        if (ref === 'io.ox/core/user') { // Remove attachment handling if view is used with user data instead of contact data
            delete meta.sections.attachments;
            delete meta.i18n.attachments;
        }

        var point = views.point(ref + '/edit/view'),

            ContactEditView = point.createView({
                tagName: 'div',
                className: 'edit-contact compact container-fluid default-content-padding'
            });

        // Save
        point.basicExtend(new links.Button({
            id: "save",
            index: 100,
            label: gt("Save"),
            ref: ref + "/actions/edit/save",
            cssClasses: "btn btn-primary control f6-target",
            tabIndex: 2,
            tagtype: "button"
        }));

        point.basicExtend(new links.Button({
            id: "discard",
            index: 110,
            label: gt("Discard"),
            ref: ref + "/actions/edit/discard",
            cssClasses: "btn control",
            tabIndex: 3,
            tagtype: "button"
        }));

        point.extend(new PictureUpload({
            id: ref + '/edit/view/picture',
            index: 120,
            customizeNode: function () {
                this.$el
                    .css({ display: 'inline-block' })
                    .addClass("contact-picture-upload f6-target");
            }
        }));

        function toggle(e) {

            e.preventDefault();

            var node = $(this).closest('.edit-contact');

            // update "has-content" class
            node.find('.field input').each(function () {
                var input = $(this),
                    field = input.closest('.field'),
                    hasContent = $.trim(input.val()) !== '';
                field.toggleClass('has-content', hasContent);
            });

            node.toggleClass('compact');

            var isCompact = node.hasClass('compact'),
                label = isCompact ? gt('Extended view') : gt('Compact view'),
                icon = isCompact ? 'icon-expand-alt' : 'icon-collapse-alt';

            node.find('.toggle-compact')
                .find('i').attr('class', icon).end()
                .find('a').text(label);
        }

        point.basicExtend({
            id: 'summary',
            index: 150,
            draw: function (baton) {

                var h1 = $('<h1 class="name">'),
                    h2 = $('<h2 class="job">'),
                    data = baton.model.toJSON();

                h1.text(util.getFullName(data));
                h2.text(util.getJob(data));

                this.append(
                    h1,
                    h2,
                    $('<nav class="toggle-compact">').append(
                        $('<a href="#">').click(toggle).text(gt('Extended view')),
                        $.txt(' '),
                        $('<i class="icon-expand-alt">')
                    )
                    //$('<div class="clear">')
                );
            }
        });

        point.basicExtend({
            id: 'final',
            index: 'last',
            draw: function (baton) {
                this.append(
                    $('<nav class="toggle-compact clear">').append(
                        $('<a href="#">').click(toggle).text(gt('Extended view')),
                        $.txt(' '),
                        $('<i class="icon-expand-alt">')
                    )
                );
            }
        });

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
                if (options.attachmentList && (options.attachmentList.attachmentsToDelete.length > 0 || options.attachmentList.attachmentsToAdd.length > 0)) {
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

        function drawDefault(options) {

            this.append(
                $('<label class="input">').append(
                    $.txt(options.label), $('<br>'),
                    $('<input type="text" class="input-xlarge" tabindex="1">')
                        .attr({ name: options.field })
                        .val(options.value)
                )
            );
        }

        function drawTextarea(options) {
            this.append(
                $('<label>').append(
                    $('<textarea class="input-xlarge" tabindex="1">')
                        .attr({ name: options.field })
                        .val(options.value)
                )
            );
        }

        function drawDate(options) {

            this.append(
                $('<label class="input">').append(
                    $.txt(options.label), $('<br>'),
                    forms.buildDateControl()
                )
            );

            // set initial date
            if (options.value) {
                var d = new date.Local(date.Local.utc(options.value));
                this.find('.year').val(d.getYear());
                this.find('.month').val(d.getMonth());
                this.find('.date').val(d.getDate());
            } else {
                this.find('.year').val('');
                this.find('.month').val('');
                this.find('.date').val('');
            }
        }

        function drawCheckbox(options) {
            this.append(
                $('<label class="checkbox">').append(
                    $('<input type="checkbox" tabindex="1">')
                        .attr({ name: options.field })
                        .prop('checked', !!options.value),
                    $.txt(' '),
                    $.txt(options.label)
                )
            );
        }

        var index = 400,
            draw = {
                birthday: drawDate,
                anniversary: drawDate,
                note: drawTextarea,
                private_flag: drawCheckbox
            };

        // loop over all sections (personal, messaging, phone etc.)
        // to get list of relevant fields per section
        _(meta.sections).each(function (fields, id) {

            // create new "block" extension
            ext.point(ref + '/edit/view').extend({
                id: id,
                index: index += 100,
                draw: function (baton) {

                    // a block has a fixed width and floats left
                    var block = $('<div class="block">')
                        .attr('data-id', id)
                        .append(
                            $('<legend>').text(meta.i18n[id])
                        );

                    // draw fields inside block
                    ext.point(ref + '/edit/view/' + id).invoke('draw', block, baton);

                    // only add if block contains at least one paragraph with content
                    if (block.children('p.has-content, p.always').length > 0) {
                        this.append(block);
                    }
                }
            });

            // create extensions for each field
            _(fields).each(function (field, index) {

                ext.point(ref + '/edit/view/' + id).extend({
                    id: field,
                    index: 100 + index * 100,
                    draw: function (baton) {

                        var value = baton.model.get(field),
                            isAlwaysVisible = _(meta.alwaysVisible).indexOf(field) > -1,
                            isRare = _(meta.rare).indexOf(field) > -1,
                            hasContent = !!value,
                            paragraph,
                            options = {
                                index: index,
                                field: field,
                                label: model.fields[field],
                                value: value
                            };

                        paragraph = $('<p>')
                            .attr('data-field', field)
                            .addClass(
                                'field' +
                                (isAlwaysVisible ? ' always' : '') +
                                (hasContent ? ' has-content' : '') +
                                (isRare ? ' rare' : '')
                            );

                        // call requires "draw" method
                        (draw[field] || drawDefault).call(paragraph, options);

                        this.append(paragraph);
                    }
                });
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
