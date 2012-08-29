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
        
            openFileChooser: function (e) {
                this.$el.find('input').trigger('click');
            },
            
            render: function () {
                var self = this;
                this.$el.append(
                    $('<div class="picture-uploader">').css({
                        backgroundImage: 'url(' + ox.base + '/apps/themes/default/dummypicture.png)',
                        marginRight: '15px',
                        marginBottom: '15px'
                    }).on('click', function () {
                        self.openFileChooser();
                    })
                );
                
                this.$el.append(
                    $('<input type="file" name="picture" accepts="image/*">').css({visibility: 'hidden'})
                );
                
                this.$el.append($('<div>').css({clear: 'both'}));
            }
        }, options);
    }
    
    
    return PictureUpload;
});