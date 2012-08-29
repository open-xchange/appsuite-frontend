/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/backbone/forms', function () {
    
    "use strict";
        
    // Control Group
    function ControlGroup(options) {
        
        this.tagName = 'div';
        this.className = 'control-group';
        
        this.nodes = {};
        
        this.buildControlGroup = function () {
            this.buildControls();
            
            this.$el.append(
                this.buildLabel(),
                this.buildControls()
            );
        };

        this.buildControls = function () {
            this.buildElement();
            return this.nodes.controls || (this.nodes.controls = $('<div class="controls">').append(this.nodes.element));
        };
        
        this.buildLabel = function () {
            return this.nodes.label || (this.nodes.label = $('<label class="control-label">').text(this.label));
        };
        
        this.buildElement = function () {
            var self = this;
            if (this.nodes.element) {
                return this.nodes.element;
            }
            this.nodes.element = $(this.control).addClass('control');
            this.nodes.element.on('change', function () {
                self.updateModel();
            });
        };
        
        this.setValueInElement = function (valueFromModel) {
            this.nodes.element.val(valueFromModel);
        };
                
        this.setValueInModel = function (valueFromElement) {
            if (this.model.set(this.attribute, valueFromElement)) {
                this.$el.removeClass('error');
                this.nodes.controls.find('.help-block.error').remove();
            }
        };
        
        this.updateElement = function () {
            this.setValueInElement(this.model.get(this.attribute));
        };
        
        this.updateModel = function () {
            this.setValueInModel(this.nodes.element.val());
        };
        
        this.render = function () {
            this.buildControlGroup();
            this.updateElement();
        };
        
        this.onValidationError = function (messages) {
            var helpBlock =  $('<div class="help-block error">');
            _(messages).each(function (msg) {
                helpBlock.append($.txt(msg));
            });
            this.$el.addClass('error');
            this.nodes.controls.append(helpBlock);
            this.nodes.element.select();
        };
        
        this.modelEvents = {};
        
        this.modelEvents['change:' + options.attribute] = 'updateElement';
        this.modelEvents['invalid:' + options.attribute] = 'onValidationError';
        
        

        _.extend(this, options); // May override any of the above aspects
    }
    
    // Form Actions
    
    // Save Action
    
    return {
        ControlGroup: ControlGroup
    };
    
});