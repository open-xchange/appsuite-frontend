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


    var checkEl = function (c) {
        var parent = $(c).parent(),
        el = parent.find('input').filter(function () {
            return $(this).val() !== "";
        }),
        man = (parent.find('.mandatory')).length,
        filled = el.length + man;
        return filled;
    };

    var fieldCount = function (c) {
        var parent = $(c).parent(),
        el = parent.find('input').filter(function () {
            return $(this).val() === "";
        }),
        empty = el.length;
        return empty;
    };

    var lessSwitch = function (evt) {
        var parent = $(evt.currentTarget).parent(),
            less = 'less';
        parent.find('.hidden').removeClass('hidden').addClass('visible');
        parent.find('.sectiontitle').removeClass('hidden');
        parent.addClass('expanded');
        $(evt.currentTarget).text('- ' + gt(less));
    };

    var namedSwitch = function (txt, evt) {
        var parent = $(evt.currentTarget).parent();
        parent.removeClass('expanded');
        parent.find('.sectiontitle').addClass('hidden');
        parent.find('input').filter(
            function () {
                return $(this).val() !== "";
            }
        ).parent().parent().removeClass('visible');
        parent.find('input').filter(
            function () {
                return $(this).val() === "";
            }
        ).parent().parent().parent().removeClass('visible').addClass('hidden');
        parent.find('.visible').removeClass('visible').addClass('hidden');
        $(evt.currentTarget).text(gt(txt));
    };


    var moreSwitch = function (txt, evt) {
        var parent = $(evt.currentTarget).parent();
        parent.removeClass('expanded');
        parent.find('.sectiontitle').addClass('visible');
        parent.find('input').filter(
            function () {
                return $(this).val() !== "";
            }
        ).parent().parent().removeClass('visible');
        parent.find('input').filter(
            function () {
                return $(this).val() === "";
            }
        ).parent().parent().parent().removeClass('visible').addClass('hidden');
        $(evt.currentTarget).text(gt(txt));
    };

    var toggleFields = function (evt) {
        var target,
            switchName = evt.data.pointName,
            more = 'more';
        target = evt.currentTarget;

        var filled = checkEl(target),
            empty = fieldCount(target),
            parent = $(target).parent(),
            status;


        if (filled === 0) {
            status = parent.hasClass('expanded') ? '1' :  '2';
        } else {
            status = !parent.hasClass('expanded') ? '3' : '4';
        }

        switch (status) {
        case "1":
            namedSwitch('+ ' + gt(switchName), evt);
            break;
        case "2":
            lessSwitch(evt);
            break;
        case "3":
            lessSwitch(evt);
            break;
        case "4":
            moreSwitch('+ ' + gt(more), evt);
            break;
        }
    };

    var pointRecalc = function (pointName) {
        var recalc = (pointName.toLowerCase()).replace(/ /g, "_");
        return recalc;
    };

    var drawSection = function (pointName) {
        return function (options) {
            var section = options.view.createSection(),
                sectionTitle = options.view.createSectionTitle({text: gt(pointName)}),
                sectionContent = options.view.createSectionContent(),
                pointNameRecalc = pointRecalc(pointName),
                more = 'more';

            section.append(sectionTitle);
            section.append(sectionContent);
            this.append(section);


            if (/^(.*_address)$/.test(pointNameRecalc)) {
                options.pointName = 'contact_' + pointNameRecalc;
                ext.point('io.ox/contacts/edit/form/address').invoke('draw', sectionContent, options);

            } else {
                ext.point('io.ox/contacts/edit/form/' + pointNameRecalc).invoke('draw', sectionContent, options);
            }
            if (checkEl(sectionContent) !== 0) {
                if (fieldCount(sectionContent) !== 0) {
                    section.append($('<a>').addClass('switcher').text('+ ' + gt(more)).on('click', {pointName: pointName}, toggleFields));
                }

            } else {
                section.append($('<a>').addClass('switcher').text('+ ' + gt(pointName)).on('click', {pointName: pointName}, toggleFields));
                sectionTitle.addClass('hidden');
            }

        };
    };

    var drawField = function (subPointName) {
        return function (options) {

            var myId = _.uniqueId('c'),

                view = options.view,
                model = view.getModel(),
                sectionGroup = view.createSectionGroup(),
                fieldtype = model.schema.getFieldType(subPointName),
                label = model.schema.getFieldLabel(subPointName),
                createFunction;

            switch (fieldtype) {
            case "string":
                createFunction = view.createTextField({ id: myId, property: subPointName, classes: 'input-large' });
                break;
            case "pastDate":
                createFunction = view.createDateField({ id: myId, property: subPointName, classes: 'input-large' });
                break;
            default:
                createFunction = view.createTextField({ id: myId, property: subPointName, classes: 'input-large' });
                break;
            }

            sectionGroup.append(
                 view.createLabel({ id: myId, text: gt(label) }),
                 createFunction
            );

            if (!model.get(subPointName) && !model.schema.isMandatory(subPointName)) {
                sectionGroup.addClass('hidden');
            }
            if (model.schema.isMandatory(subPointName)) {
                sectionGroup.addClass('mandatory');
            }

            this.append(sectionGroup);
        };
    };

    var drawFields = function (pointName, subPointName) {
//        console.log(pointName + ' ' + subPointName);
        return function (options) {
            ext.point('io.ox/contacts/edit/form/' + pointName + '/' + subPointName).invoke('draw', this, options);
        };
    };

    var drawAddress = function (options) {
        var addressFormat = 'street,postal_code/city,state,country'.split(','),
            addressGroop = '_' + (options.pointName.split('_'))[1],
            self = this,
            view = options.view,
            model = view.getModel();
//            label = model.schema.getFieldLabel(subPointName);

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
//                    console.log(multiline + ' ' + addressGroop);
                    var myId = _.uniqueId('c'),
                        labelText = options.view.getModel().schema.getFieldLabel(multiline + addressGroop);

                    labels.push(options.view.createLabel({ id: myId, text: gt(labelText)}));
                    fields.push(options.view.createTextField({ id: myId, property: multiline + addressGroop, classes: 'input-large' }));
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

    var createSaveButton = function (options) {
        var saveButton = $('<a>'),
            buttonText = 'Save';

        window.ursel = saveButton;
        saveButton.attr('data-action', 'save');
        saveButton.attr('id', 'testid');
        saveButton.addClass('btn btn-primary').text(gt(buttonText));
        saveButton.on('click', function () {
            options.view.saveForm();

        });
        return saveButton;
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
          saveButton,
          displayNameText,
          jobDescriptionText;

        section = options.view.createSection({}).addClass('formheader');

        title = $('<span>').addClass('text name clear-title')
        .attr('data-property', 'display_name');
        displayNameText = util.getDisplayName(options.view.getModel().get());

     // fix for empty display_name
        if (!displayNameText) {
            $(title).html('&nbsp;');
        }
        title.text(displayNameText);

        jobDescriptionText = util.getJob(options.view.getModel().get());

        jobDescription = $('<span>').addClass('text job clear-title')
        .attr('data-property', 'jobdescription_calculated')
        .text(jobDescriptionText);

        // fix for empty Job Description
        if (!jobDescriptionText) {
            $(jobDescription).html('&nbsp;');
        }

        saveButton = createSaveButton(options);

        picture = (api.getPicture(options.view.getModel().get())).addClass('picture');
        picture.on('click', picTrigger);
        function handleFileSelect(evt) {
            var file = evt.target.files,
                reader = new FileReader();
            console.log(reader);
            reader.onload = (function (theFile) {
                return function (e) {
                    $('.picture').css('background-image', 'url(' + e.target.result + ')');
                };
            }(file[0]));
            reader.readAsDataURL(file[0]);
            options.view.getModel().dirty = true;
        }
        picForm = options.view.createPicUpload({
            wrap: false,
            label: false,
            charset: 'UTF-8',
            enctype: 'multipart/form-data',
            id: 'contactUploadImage',
            method: 'POST',
            formname: 'contactUploadImage',
            name: 'file',
            target: 'hiddenframePicture'
        });
        picForm.find('input').on('change', handleFileSelect);

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
        var pointNameRecalc = pointRecalc(pointName);

        ext.point('io.ox/contacts/edit/form').extend({id: pointNameRecalc, draw: drawSection(pointName), index: 120});
        _.each(section, handleField(pointNameRecalc));
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


    var ContactEditView = View.extend({

        draw: function (app) {
            var self = this,
                meta;
//            console.log(this);
            if (this.getModel()) {
                meta = {
                    'Personal information': ['title', 'first_name', 'last_name', 'display_name', 'second_name', 'suffix', 'nickname', 'birthday'],
                    'Email addresses': ['email1', 'email2', 'email3'],
                    'Phone numbers': ['telephone_business1', 'telephone_business2', 'fax_business', 'telephone_car', 'telephone_company', 'telephone_home1', 'telephone_home2', 'fax_home', 'cellular_telephone1', 'cellular_telephone2', 'telephone_other', 'fax_other', 'telephone_isdn', 'telephone_pager', 'telephone_primary', 'telephone_radio', 'telephone_telex', 'telephone_ttytdd', 'instant_messenger1', 'instant_messenger2', 'telephone_ip', 'telephone_assistant', 'telephone_callback'],
                    'Home address': ['street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home'],
                    'Business address': ['street_business', 'postal_code_business', 'city_business', 'state_business', 'country_business'],
                    'Other address': ['street_other', 'postal_code_other', 'city_other', 'state_other', 'country_other'],
                    'Job descriptions': ['room_number', 'profession', 'position', 'company', 'department', 'employee_type', 'number_of_employees', 'sales_volume', 'tax_id', 'commercial_register', 'branches', 'business_category', 'info', 'manager_name', 'assistant_name'],
                    'Special information': ['marital_status', 'number_of_children', 'spouse_name', 'note', 'url', 'anniversary'],
                    'Optional fields': ['userfield01', 'userfield02', 'userfield03', 'userfield04', 'userfield05', 'userfield06', 'userfield07', 'userfield08', 'userfield09', 'userfield10', 'userfield11', 'userfield12', 'userfield13', 'userfield14', 'userfield15', 'userfield16', 'userfield17', 'userfield18', 'userfield19', 'userfield20']
                };


                var updateDisplayNameByFields = function () {
                    var text = util.getDisplayName(self.getModel().get());
                    // fix for empty display_name
                    if (text === '') {
                        text = '&nbsp;';
                    }
                    $('span[data-property="display_name"]').html(text);
                    $('input[data-property="display_name"]').val(text).trigger('change');
                };


                var updateJobDescription = function () {
                    var jobText = util.getJob(self.getModel().get());
                 // fix for empty Job Description
                    if (jobText === '') {
                        jobText = '&nbsp;';
                    }
                    $('span[data-property="jobdescription_calculated"]').html(jobText);
                };

                this.getModel().on('change:title change:first_name change:last_name', updateDisplayNameByFields);
//                this.getModel().on('change:display_name', updateDisplayName);
                this.getModel().on('change:company change:position', updateJobDescription); //change:profession

                initExtensionPoints(meta);
                this.node.addClass('contact-detail edit').attr('data-property', self.getModel().get('folder_id') + '.' + self.getModel().get('id'));



                ext.point('io.ox/contacts/edit/form').invoke('draw', self.node, {view: self});
                self.node.append($('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '-275px', top: '-10px'}));

                this.getModel().on('error:invalid', function (evt, err) {
                    console.log('error validation');
                    console.log(arguments);
                    $('#myGrowl').jGrowl(err.message, {header: 'Make an educated guess!', sticky: true});
                });
            }
            return self;
        },
        saveForm: function () {
            console.log('saveForm -> save', this);
            this.getModel().save();
            //$(this).trigger('save');
        }

    });

    // my happy place
    return ContactEditView;
});
