/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/contacts/widgets/cityControlGroup',
    ['io.ox/backbone/forms',
     'less!io.ox/contacts/widgets/widgets.less'
    ], function (forms) {

    'use strict';

    function CityControlGroup(options) {
        return new forms.ControlGroup(_.extend({}, {

            attribute: options.cityAttribute,

            buildElement: function () {
                var self = this;
                if (this.nodes.bothElements) {
                    return this.nodes.bothElements;
                }

                this.nodes.zipElement = $(this.zipControl).addClass('control');
                this.nodes.zipElement.on('change', function () {
                    self.updateZipInModel();
                });

                this.nodes.element = $(this.control).addClass('control');
                this.nodes.element.on('change', function () {
                    self.updateModel();
                });

                function updateZip() {
                    self.updateZipInElement();
                }

                this.observeModel('change:' + options.zipAttribute, updateZip);


                updateZip();

                return this.nodes.bothElements = $('<span>').append(this.nodes.zipElement, $.txt(' '), this.nodes.element);
            },

            updateZipInModel: function () {
                this.model.set(this.zipAttribute, this.nodes.zipElement.val(), {validate: true});
            },

            updateZipInElement: function () {
                this.nodes.zipElement.val(this.model.get(this.zipAttribute));
            }


        }, options));

    }


    return CityControlGroup;
});
