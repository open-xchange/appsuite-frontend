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
define('io.ox/backbone/forms', ['io.ox/core/extensions', 'io.ox/core/event', 'io.ox/core/date', 'gettext!io.ox/backbone/forms', 'less!io.ox/backbone/forms.less'], function (ext, Events, date, gt) {
    
    "use strict";
    
    // Error Alert
    
    function ErrorAlert(options) {
        _.extend(this, {
            
            tagName: 'div',
            className: 'error-alerts',
            
            init: function () {
                var self = this;
                
                function showBackendError(error) {
                    var alert = $.alert(self.errorTitle, self.formatError(error));
                    self.$el.append(alert);
                    
                    alert.find('.close').on('click', function () {
                        alert.remove();
                    });
                }
                
                this.observeModel('backendError', showBackendError);
            },
            
            errorTitle: gt('An error occurred'),
            
            formatError: function (error) {
                return gt("An error occurred. Please try again later");
            }
        }, options || {});
    }
        
    // Control Group
    function ControlGroup(options) {
        
        this.tagName = 'div';
        
        this.init = function () {
            this.nodes = {};
        };
        
        this.buildControlGroup = function () {
            if (this.nodes.controlGroup) {
                return this.nodes.controlGroup;
            }
            this.buildControls();
            
            this.nodes.controlGroup = $('<div class="control-group">').appendTo(this.$el);
            
            this.nodes.controlGroup.append(
                this.buildLabel(),
                this.buildControls()
            );
        };

        this.buildControls = function () {
            return this.nodes.controls || (this.nodes.controls = $('<div class="controls">').append(this.buildElement()));
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
            
            return this.nodes.element;
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
        
        this.handleRareModelChange = function () {
            if (this.model.isSet(this.attribute)) {
                this.nodes.controlGroup.show();
            }
        };
        
        this.render = function () {
            this.buildControlGroup();
            this.updateElement();
            if (this.rare && !this.model.isSet(this.attribute)) {
                this.nodes.controlGroup.hide();
            }
        };
        
        this.onValidationError = function (messages) {
            var helpBlock =  $('<div class="help-block error">');
            _(messages).each(function (msg) {
                helpBlock.append($.txt(msg));
            });
            this.nodes.controlGroup.addClass('error');
            this.nodes.controls.append(helpBlock);
            this.nodes.element.select();
        };
        
        this.modelEvents = {};
        

        if (options.rare) {
            this.modelEvents['change:' + options.attribute] = 'handleRareModelChange updateElement';
        } else {
            this.modelEvents['change:' + options.attribute] = 'updateElement';
        }
        
        this.modelEvents['invalid:' + options.attribute] = 'onValidationError';
        
        

        _.extend(this, options); // May override any of the above aspects
    }
    
    // Form Sections made up of horizontal forms
    
    function Section(options) {
        _.extend(this, {
            
            tagName: 'div',
            className: 'section',
            
            init: function () {
                Events.extend(this);
                this.nodes = {};
            },
            
            point: function () {
                return ext.point(this.extensionNamespace);
            },
            
            render: function () {
                var self = this;
                var anyHidden = false;
                var anyVisible = false;
                
                this.point().each(function (extension) {
                    if (extension.metadata('hidden', [self.model])) {
                        anyHidden = anyHidden || true;
                    } else {
                        anyVisible = anyVisible || true;
                    }
                });
                
                // If no extension is visible collapse completely unless overridden
                if (anyVisible && anyHidden) {
                    // Show more / less links
                    this.state = 'mixed';
                } else if (!anyVisible) {
                    // All extensions are hidden -> completely collapse section
                    this.state = 'collapsed';
                } else if (!anyHidden) {
                    // Everything is visible -> leave out more / less links
                    this.state = 'allVisible';
                }
                
                this.initialState = this.state;

                this.drawHeader();
                this.drawExtensions();
                
                if (this.state === 'mixed' || this.state === 'collapsed') {
                    this.less();
                }
                
            },
            
            more: function () {
                var self = this;
                this.state = 'allVisible';
                this.nodes.toggleLink.text(gt('Show less'));
                if (this.initialState === 'mixed') {
                    // show all
                    this.point().each(function (extension) {
                        if (!extension.metadata('hidden', [self.model])) {
                            return;
                        }
                        if (extension.show) {
                            extension.show();
                        } else {
                            self.nodes.extensionNodes[extension.id].show();
                        }
                    });
                } else if (this.initialState === 'collapsed') {
                    // Show regular header
                    this.nodes.collapsedHeader.hide();
                    this.nodes.header.show();
                    
                    // show extensions
                    this.nodes.extensions.show();
                }
            },
            
            less: function () {
                var self = this;
                if (this.initialState === 'mixed') {
                    // hide initially hidden
                    this.point().each(function (extension) {
                        if (!extension.metadata('hidden', [self.model])) {
                            return;
                        }
                        if (extension.hide) {
                            extension.hide();
                        } else {
                            self.nodes.extensionNodes[extension.id].hide();
                        }
                    });
                } else if (this.initialState === 'collapsed') {
                    // hide all
                    this.nodes.extensions.hide();
                    
                    // show collapsedHeader
                    this.nodes.collapsedHeader.show();
                    this.nodes.header.hide();
                }

                this.state = this.initialState;
                this.nodes.toggleLink.text(gt('Show more'));
            },
            
            drawHeader: function () {
                var self = this;
                
                this.nodes.header = $('<div class="row sectionheader">').appendTo(this.$el);
                    
                $('<span class="sectiontitle offset2 span4">').text(this.title).appendTo(this.nodes.header);
                if (this.state === 'allVisible') {
                    return;
                }
                
                this.nodes.toggleLink = $('<a href="#" class="span6">').on('click', function () {
                    if (self.state === 'mixed') {
                        self.more();
                    } else if (self.state === 'allVisible') {
                        self.less();
                    }
                }).appendTo(this.nodes.header);
                
                if (this.state === 'collapsed') {
                    this.nodes.collapsedHeader = $('<div class="row sectionheader collapsed">').appendTo(this.$el);
                    $('<span class="offset2 span4">').append(
                        $('<i class="icon-plus-sign">'),
                        $('<a href="#">').text(this.title).on('click', function () {
                            self.more();
                        })
                    ).appendTo(this.nodes.collapsedHeader);
                }
                
            },
            
            drawExtensions: function () {
                var self = this;
                this.nodes.extensions = this.buildExtensionContainer().appendTo(this.$el);
                this.nodes.extensionNodes = {};
                
                this.point().each(function (extension) {
                    self.nodes.extensionNodes[extension.id] = $('<div>').appendTo(self.nodes.extensions);
                    extension.invoke('draw', self.nodes.extensionNodes[extension.id], self.options);
                });
                
            },
            
            buildExtensionContainer: function () {
                return $(this.container || '<form class="form-horizontal">');
            }
        }, options);
        
        
    }
        
    var forms = {
        ErrorAlert: ErrorAlert,
        ControlGroup: ControlGroup,
        Section: Section,
        
        utils: {
            string2date: function (string) {
                var reg = /((\d{2})|(\d))\.((\d{2})|(\d))\.((\d{4})|(\d{2}))/;
                
                if (string !== '' && reg.test(string)) {
                    var dateArray = string.split('.');
                    return Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                } else {
                    return string;
                }
            },
            date2string: function (value) {
                if (_.isNumber(value)) {
                    return new date.Local(date.Local.utc(value)).format(date.DATE);
                }
                return value;
            },
            
            
            controlGroup: {
                date: {
                    setValueInElement: function (valueFromModel) {
                        this.nodes.element.val(forms.utils.date2string(valueFromModel));
                    },

                    setValueInModel: function (valueFromElement) {
                        if (this.model.set(this.attribute, forms.utils.string2date(valueFromElement))) {
                            this.$el.removeClass('error');
                            this.nodes.controls.find('.help-block.error').remove();
                        }
                    }
                }
            }
        }
    };
    
    return forms;
});
















































