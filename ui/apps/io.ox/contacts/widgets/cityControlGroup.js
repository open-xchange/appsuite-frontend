/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/contacts/widgets/cityControlGroup', ['io.ox/backbone/forms', 'less!io.ox/contacts/widgets/widgets.css'], function (forms) {
    "use strict";

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

                return this.nodes.bothElements = $("<span>").append(this.nodes.zipElement, $.txt(" "), this.nodes.element);
            },

            updateZipInModel: function () {
                this.model.set(this.zipAttribute, this.nodes.zipElement.val());
            },

            updateZipInElement: function (valueFromModel) {
                this.nodes.zipElement.val(this.model.get(this.zipAttribute));
            }


        }, options));

    }


    return CityControlGroup;
});