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

    /*
    * urgh, if you want to improve it, do it without that many dom operations
    */
    var toggleFields = function (evt) {
        var parent = $(evt.currentTarget).parent();
        if (!parent.hasClass('expanded')) {
            parent.find('.hidden').removeClass('hidden').addClass('visible');
            parent.addClass('expanded');
            $(evt.currentTarget).text('- less');
        } else {
            parent.removeClass('expanded');
            parent.find('input:text').filter(
                function () {
                    return $(this).val() !== "";
                }
            ).parent().parent().removeClass('visible');
            parent.find('input:text').filter(
                function () {
                    return $(this).val() === "";
                }
            ).parent().parent().removeClass('visible').addClass('hidden');
            parent.find('.visible').removeClass('visible').addClass('hidden');
            $(evt.currentTarget).text('+ more');
        }

    };
    var toggleSection = function (evt) {
        var section = $(evt.currentTarget).parent().prev();
        if (!section.hasClass('hidden')) {
            section.addClass('hidden');
        } else {
            section.removeClass('hidden');
            section.find('.hidden').removeClass('hidden').addClass('visible');
        }

    };
    var drawSection = function (pointName) {
        return function (options) {
            var section = options.view.createSection(),
                sectionTitle = options.view.createSectionTitle({text: gt(pointName)}),
                sectionContent = options.view.createSectionContent();

            section.append(sectionTitle);
            section.append(sectionContent);
            this.append(section);

            if (/^(.*-address)$/.test(pointName)) {
                options.pointName = pointName;
                ext.point('io.ox/contacts/edit/form/address').invoke('draw', sectionContent, options);

            } else {
                ext.point('io.ox/contacts/edit/form/' + pointName).invoke('draw', sectionContent, options);
            }

            section.append($('<a>').addClass('switcher').text('+ more').on('click', toggleFields));
            section.parent().append($('<div>').append($('<a>').addClass('switcher').text(pointName).on('click', toggleSection)));
        };
    };

    var drawField = function (subPointName) {
        return function (options) {
            var myId = _.uniqueId('c'),
                sectionGroup = options.view.createSectionGroup();

            this.append(sectionGroup);
            sectionGroup.append(options.view.createLabel({id: myId, text: gt(subPointName)}));
            sectionGroup.append(options.view.createTextField({id: myId, property: subPointName}));

            if (!options.view.getModel().get(subPointName)) {
                sectionGroup.addClass('hidden');
            }
        };
    };

    var drawFields = function (pointName, subPointName) {
        return function (options) {
            ext.point('io.ox/contacts/edit/form/' + pointName + '/' + subPointName).invoke('draw', this, options);
        };
    };

    var drawAddress = function (options) {
        var addressFormat = 'street,postal_code/city,country,state'.split(','),
            self = this;

        _.each(addressFormat, function (line, index) {
            var lineFormat = line.split(/\//);
            if (lineFormat.length === 1) {
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
                    var myId = _.uniqueId('c');
                    labels.push(options.view.createLabel({id: myId, text: gt(multiline)}));
                    fields.push(options.view.createTextField({id: myId, property: multiline}));
                    hide = (options.view.getModel().get(multiline)) ? false : true;
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

    var createSaveButton = function (options) {
        var saveButton = $('<a>');

        saveButton.addClass('button default-action saveButton').text('Save');
        saveButton.on('click', function () {
            options.view.save();

        });
        return saveButton;
    };


    var createPictureForm = function () {
        var form = $('<form>', {
            'accept-charset': 'UTF-8',
            'enctype': 'multipart/form-data',
            'id': 'contactUploadImage',
            'method': 'POST',
            'name': 'contactUploadImage',
            'target': 'blank.html'
        })
        .append(
            $('<input>', {
                name: 'file',
                type: 'file',
                accept: 'image/*'
            })
        ).append(
            $('<iframe/>', {
                'name': 'hiddenframePicture',
                'src': 'blank.html'
            }).css('display', 'none')
        );
        return form;
    };

    var picTrigger = function () {
        $('input[type="file"]').trigger('click');
    };

    var drawFormHead = function (options) {
        var section,
          picture,
          picForm,
          title,
          jobDescription,
          calculatedModel,
          saveButton;

        section = options.view.createSection({}).addClass('formheader');

        picture = (api.getPicture(options.view.getModel().getData())).addClass('picture');
        picture.on('click', picTrigger);
        title = options.view.createText({property: 'display_name', classes: 'name clear-title'});


        calculatedModel = new Model({});
        _.extend(calculatedModel, {
            get: function () {
                return util.getJob(options.view.getModel().getData());
            },
            update: function () {
                $(this).trigger('jobdescription.calculated.changed', util.getJob(options.view.getModel().getData()));
            },
            set: function () {}
        });

        // just bridge the event
        $(options.view.getModel()).on('jobdescription.calculated.changed', function () {
            calculatedModel.update();
        });

        jobDescription = options.view.createText({property: 'jobdescription.calculated', classes: 'job clear-title', model: calculatedModel});


        saveButton = createSaveButton(options);

        picForm = createPictureForm();

        section.append(picture);
        section.append(title);
        section.append(jobDescription);
        section.append(saveButton);
        section.append(picForm);
        section.append(options.view.createSectionDelimiter({}));

        this.append(section);
    };

    var handleField = function (pointName) {
        return function (subPointName, index) {
            ext.point('io.ox/contacts/edit/form/' + pointName + '/' + subPointName).extend({
                id: subPointName,
                draw: drawField(subPointName)
            });
            ext.point('io.ox/contacts/edit/form/' + pointName).extend({
                id: subPointName,
                draw: drawFields(pointName, subPointName)
            });
        };
    };
    var handleSection = function (section, pointName) {
        ext.point('io.ox/contacts/edit/form').extend({id: pointName, draw: drawSection(pointName), index: 120});
        _.each(section, handleField(pointName));
    };

    var initExtensionPoints = function (meta) {
        ext.point('io.ox/contacts/edit/form').extend({
            index: 1,  //should be the first one
            id: 'formhead',
            draw: drawFormHead
        });


        _.each(meta, handleSection);
        ext.point('io.ox/contacts/edit/form/address').extend({
            id: 'address',
            draw: drawAddress
        });
    };


    var ContactEditView = function (options) {
        this.__super.apply(this, arguments);
    };
    View.extend(ContactEditView, {

        draw: function (app) {
            var self = this,
                meta;
            if (this.getModel()) {
                meta = {
                    'contact-personal': ['title', 'first_name', 'last_name', 'display_name', 'second_name', 'suffix', 'nickname', 'birthday'],
                    'contact-email': ['email1', 'email2', 'email3'],
                    'contact-phone': ['telephone_business1', 'telephone_business2', 'fax_business', 'telephone_car', 'telephone_company', 'telephone_home1', 'telephone_home2', 'fax_home', 'cellular_telephone1', 'cellular_telephone2', 'telephone_other', 'fax_other', 'telephone_isdn', 'telephone_pager', 'telephone_primary', 'telephone_radio', 'telephone_telex', 'telephone_ttytdd', 'instant_messenger1', 'instant_messenger2', 'telephone_ip', 'telephone_assistant'],
                    'contact-home-address': ['street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home'],
                    'contact-work-address': ['street_business', 'postal_code_business', 'city_business', 'state_business', 'country_business'],
                    'contact-other-address': ['street_other', 'postal_code_other', 'city_other', 'state_other', 'country_other'],
                    'contact-job-descriptions': ['room_number', 'profession', 'position', 'company', 'department', 'employee_type', 'number_of_employees', 'sales_value', 'tax_id', 'commercial_register', 'branches', 'business_category', 'info', 'manager_name', 'assistant_name'],
                    'special-information': ['marital_status', 'number_of_children', 'spouse_name', 'note', 'url', 'anniversary'],
                    'userfields': ['userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05', 'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10', 'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15', 'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20']
                };

                var updateDisplayName = function () {
                    self.getModel().set('display_name', util.getFullName(self.getModel().getData()));
                };

                var updateJobDescription = function () {
                    $(self.getModel()).trigger('jobdescription.calculated.changed', util.getJob(self.getModel().getData()));
                };

                $(this.getModel()).on('title.changed', updateDisplayName);
                $(this.getModel()).on('first_name.changed', updateDisplayName);
                $(this.getModel()).on('last_name.changed', updateDisplayName);

                $(this.getModel()).on('company.changed', updateJobDescription);
                $(this.getModel()).on('position.changed', updateJobDescription);
                $(this.getModel()).on('profession.changed', updateJobDescription);



                $(this.getModel()).on('validation.error', function (evt, error, fieldDesc) {
                    console.error(error);
                });

                initExtensionPoints(meta);
                this.node.addClass('contact-detail edit').attr('data-property', self.getModel().get('folder_id') + '.' + self.getModel().get('id'));
                ext.point('io.ox/contacts/edit/form').invoke('draw', self.node, {view: self});
            }
            return self;
        },
        save: function () {
            $(this).trigger('save');
        }

    });

    // my happy place
    return ContactEditView;
});
