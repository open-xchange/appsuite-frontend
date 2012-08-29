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
define('io.ox/contacts/widgets/pictureUpload', function () {
    
    "use strict";
    
    // For now specific to contacts
    // Might be generalized, who knows?
    
    function PictureUpload(options) {
        _.extend(this, {
            
            tagName: 'div',
            className: 'picture',
            events: {
                'click': 'openFileChooser'
            },
            
            openFileChooser: function () {
                this.$el.find('input').trigger('click');
            },
            
            render: function () {
                
                
                var target = 'picture-upload-' + new Date().getTime();
                $('<form>', {
                    'accept-charset': 'UTF-8',
                    enctype: 'multipart/form-data',
                    method: 'POST',
                    target: target
                })
                .append(
                    fileField = $('<input type="file" name="picture" accept="image/*">')
                )
                .append(
                    $('<iframe>', {
                        name: target,
                        src: 'blank.html'
                    }).hide()
                ).appendTo(this.$el);
            
                model.$el.css({
                    backgroundImage: 'url(' + ox.base + '/apps/themes/default/dummypicture.png)',
                    marginRight: '15px'
                };
                
            }
            
            
        }, options);
    }
    
    
    return PictureUpload;
});