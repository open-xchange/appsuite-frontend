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

define('io.ox/contacts/edit/view-form',
    ['io.ox/core/extensions',
     'gettext!io.ox/contacts/contacts',
     'io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/view',
     'io.ox/core/tk/model'
    ], function (ext, gt, util, api, View, Model) {

    'use strict';

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
                home_address: ['street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home'],
                business_address: ['street_business', 'postal_code_business', 'city_business',
                                   'state_business', 'country_business'],
                other_address: ['street_other', 'postal_code_other', 'city_other', 'state_other', 'country_other'],
                job: ['profession', 'position', 'department', 'company', 'room_number',
                        'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                        'commercial_register', 'branches', 'business_category', 'info',
                        'manager_name', 'assistant_name'],
                userfields: ['userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05',
                            'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10',
                            'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15',
                            'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20'],
                comment: ['note']
            },

            rare: ['nickname', 'marital_status', 'number_of_children', 'spouse_name',
                   'marital_status', 'number_of_children', 'spouse_name', 'url', 'anniversary',
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
                userfields: gt('User fields')
            }
        },

        SELECTOR = 'input, textarea',

        SHOW_MORE = gt('Show more'),
        SHOW_LESS = gt('Show less'),

        isNotEmpty = function () {
            return $(this).val() !== "";
        },

        isEmpty = function () {
            return $(this).val() === "";
        },

        hasVisibleFields = function (section) {
            return section.find('.always-visible').length || section.find(SELECTOR).filter(isNotEmpty).length;
        },

        hasEmptyFields = function (section) {
            return section.find(SELECTOR).filter(isEmpty).length > 0;
        };

    var toggleFields = function (e) {

        e.preventDefault();

        var s = $(this).closest('.section');

        if (!hasVisibleFields(s)) {
            // show/hide section
            if (s.hasClass('show-section')) {
                // show
                s.addClass('show-less').removeClass('show-section')
                    .find('.section-group').removeClass('hidden');
            } else {
                // hide
                s.addClass('show-section').removeClass('show-less')
                    .find('.section-group').addClass('hidden');
            }
        } else {
            // show more/less
            s.removeClass('show-section');
            if (s.hasClass('show-less')) {
                // show less
                s.addClass('show-more').removeClass('show-less')
                    // hide empty fields
                    .find(SELECTOR).filter(isEmpty)
                        .parents('.section-group').not('.always-visible').addClass('hidden');
            } else {
                // show more!
                s.addClass('show-less').removeClass('show-more')
                    .find('.hidden').removeClass('hidden').end()
                    .find(SELECTOR).first().focus();
            }
        }
    };

    var drawSection = function (id) {

        return function (options) {

            var section = options.view.createSection(),
                sectionTitle = options.view.createSectionTitle({ text: meta.i18n[id] }),
                sectionContent = options.view.createSectionContent();

            this.append(
                section.append(
                    sectionTitle,
                    sectionContent
                )
            );

            // link to add new section
            section.prepend(
                $('<div>').addClass('add-section')
                .append(
                    $('<i>').addClass('icon-plus-sign'),
                    $.txt(' '),
                    $('<a>', { href: '#' }).addClass('toggle').text(meta.i18n[id])
                )
            );

            // link to show more fields
            section.prepend(
                $('<a>', { href: '#' }).addClass('toggle show-more').text(SHOW_MORE),
                $('<a>', { href: '#' }).addClass('toggle show-less').text(SHOW_LESS)
            );

            // add toggle via delegate
            section.on('click', '.sectiontitle, .toggle', { pointName: id }, toggleFields);

            // run extensions
            if (/^(.*_address)$/.test(id)) {
                options.pointName = 'contact_' + id;
                ext.point('io.ox/contacts/edit/form/address').invoke('draw', sectionContent, options);
            } else {
                ext.point('io.ox/contacts/edit/form/' + id).invoke('draw', sectionContent, options);
            }

            // set proper CSS class on section
            if (hasVisibleFields(section)) {
                if (hasEmptyFields(section)) {
                    section.addClass('show-more');
                } else {
                    section.addClass('show-less');
                }
            } else {
                section.addClass('show-section');
            }
        };
    };

    var drawField = function (key) {

        return function (options) {

            var id = _.uniqueId('c'),
                view = options.view,
                model = view.getModel(),
                type = model.schema.getFieldType(key),
                label = model.schema.getFieldLabel(key),
                field, method,
                isAlwaysVisible = _(meta.alwaysVisible).indexOf(key) > -1,
                isEmpty = model.isEmpty(key),
                isRare = _(meta.rare).indexOf(key) > -1;

            switch (type) {
            case 'text':
                method = 'createTextAreaClean';
                break;
            case 'pastDate':
                method = 'createDateFieldClean';
                break;
            default:
                method = 'createTextFieldClean';
                break;
            }

            // get proper field
            field = view[method]({ id: id, property: key, classes: 'input-large' });

            this.append(
                view.createSectionGroup()
                .append(
                    view.createLabel({ id: id, text: label }),
                    field
                )
                // is always visible?
                .addClass(isAlwaysVisible ? 'always-visible' : undefined)
                // is empty?
                .addClass(!isAlwaysVisible && isEmpty ? 'hidden' : undefined)
                // is rare?
                .addClass(isRare ? 'rare-field' : undefined)
            );
        };
    };

    var drawAddress = function (options) {
        var addressFormat = 'street,postal_code/city,state,country'.split(','),
            addressGroop = '_' + (options.pointName.split('_'))[1],
            self = this,
            view = options.view,
            model = view.getModel();

        _.each(addressFormat, function (line, index) {
            var lineFormat = line.split(/\//);
            if (lineFormat.length === 1) {
                line = line + addressGroop;
                //normal mode
                //ext.point('io.ox/contacts/edit/form/' + options.pointName + '/' + line).invoke('draw', self, options);
                var dr = drawField(line);
                dr.apply(self, [options]);
            } else {
                var sectionGroup = options.view.createSectionGroup(),
                    labels = [],
                    fields = [],
                    hide = true;

                self.append(sectionGroup);

                _.each(lineFormat, function (multiline, index) {
                    var myId = _.uniqueId('c'),
                        labelText = options.view.getModel().schema.getFieldLabel(multiline + addressGroop);

                    labels.push(options.view.createLabel({ id: myId, text: labelText}));
                    fields.push(options.view.createTextFieldClean({ id: myId, property: multiline + addressGroop, classes: 'input-large' }));
                    hide = (options.view.getModel().get(multiline + addressGroop)) ? false : true;
                });

                var outterLabel = $('<div>').addClass('inlinelabel');
                _.each(labels, function (label) {
                    outterLabel.append(label);
                });
                sectionGroup.append(outterLabel);
                _.each(fields, function (field, index) {
                    sectionGroup.append(field.addClass('inline ' + 'nr' + index));
                });
                if (hide) {
                    sectionGroup.addClass('hidden');
                }
            }
        });
    };

    var picTrigger = function () {
        // relative lookup
        $(this).closest('.window-body').find('input[type="file"]').trigger('click');
    };

    var handleFileSelect = function (e) {
        var file = e.target.files,
            reader = new FileReader(),
            view = e.data.view;
        reader.onload = function (e) {
            view.node.find('.picture').css('background-image', 'url(' + e.target.result + ')');
        };
        reader.readAsDataURL(file[0]);
        view.getModel().dirty = true;
    };

    var drawHeader = function (options) {

        var view = options.view, data = view.getModel().get();

        view.createSection({})
        .addClass('formheader')
        .append(
            // picture
            (api.getPicture(data))
                .addClass('picture')
                .on('click', picTrigger),
            // full name
            $('<span>')
                .addClass('text name clear-title')
                .attr('data-property', 'display_name')
                .text(util.getDisplayName(data) || '\u00A0'),
            // job description
            $('<span>')
                .addClass('text job clear-title')
                .attr('data-property', 'jobdescription_calculated')
                .text(util.getJob(data) || '\u00A0'),
            // save button
            $('<a>')
                .attr('data-action', 'save')
                .addClass('btn btn-primary')
                .text(gt('Save'))
                .on('click', { model: view.getModel() }, function (e) {
                    e.data.model.save();
                }),
            // picture form
            view.createPicUpload()
                .find('input').on('change', { view: view }, handleFileSelect).end(),
            // delimiter
            view.createSectionDelimiter({})
        )
        .appendTo(this);
    };

    var handleField = function (section) {
        return function (id, index) {
            ext.point('io.ox/contacts/edit/form/' + section).extend({
                id: id,
                index: 100 + 100 * index,
                draw: drawField(id)
            });
        };
    };

    var handleSection = (function () {
        var i = 0;
        return function (section, id) {
            ext.point('io.ox/contacts/edit/form').extend({
                id: id,
                draw: drawSection(id),
                index: 200 + 100 * (i++)
            });
            _.each(section, handleField(id));
        };
    }());

    var initExtensionPoints = function () {
        ext.point('io.ox/contacts/edit/form').extend({
            index: 100,
            id: 'header',
            draw: drawHeader
        });
        _.each(meta.sections, handleSection);
        ext.point('io.ox/contacts/edit/form/address').extend({
            id: 'address',
            draw: drawAddress
        });
    };

    var updateDisplayNameByFields = function (e) {
        // need to build display name manually. util's getDisplayName will not change the display_name
        // when first or last name is empty
        var data = this.get(), displayName = '', node = e.data.node;
        if (data.first_name && data.last_name) {
            displayName = data.last_name + ', ' + data.first_name;
        } else {
            displayName = data.last_name || data.first_name;
        }
        // update field - only if we have at least one char
        if (displayName) {
            node.find('input[data-property="display_name"]').val(displayName).trigger('change');
        }
        // update header
        node.find('span[data-property="display_name"]').text(util.getFullName(data) || '\u00A0');
    };

    var updateJobDescription = function (e) {
        var job = util.getJob(this.get()), node = e.data.node;
        node.find('span[data-property="jobdescription_calculated"]').text(job || '\u00A0');
    };

    var ContactEditView = View.extend({

        draw: function () {

            var model = this.getModel();

            if (model) {

                model.on('change:title change:first_name change:last_name', { node: this.node }, updateDisplayNameByFields)
                    .on('change:company change:position', { node: this.node }, updateJobDescription);

                this.node.addClass('contact-detail edit')
                    .attr('data-property', model.get('folder_id') + '.' + model.get('id'));

                ext.point('io.ox/contacts/edit/form').invoke('draw', this.node, { view: this });

                this.node.append($('<div>', { id: 'myGrowl' })
                    .addClass('jGrowl').css({position: 'absolute', right: '-275px', top: '-10px'}));

                model.on('error:invalid', function (e, err) {
                    $('#myGrowl').jGrowl(e.message, {header: 'Make an educated guess!', sticky: true});
                });
            }
            return this;
        }
    });

    initExtensionPoints();

    return ContactEditView;
});
