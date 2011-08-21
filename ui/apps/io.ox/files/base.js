/**
 * 
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com 
 * 
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * 
 */
 
// TODO: Render Versions

define("io.ox/files/base", function () {
    var registry = ox.api.extensions.registry;
    
    var draw = function (file) {
        var element = $("<div />").addClass("fileDetails");
        element.append($("<h1/>").text(file.title));
        // Basic Info
        (function () {
            var table = $("<table/>").addClass("basicInfo").attr("width", "100%");
            var tr = $("<tr/>");
            
            table.append(tr);
            element.append(table);
            
            registry.point("io.ox.files.details.basicInfo").each(function (index, extension) {
                var customFields = extension.fields || [];
                var count = 0;
                $.each(customFields, function (index, field) {
                    var content = null;
                    tr.append($("<th/>").text(extension.displayName(field))).append(content = $("<td/>"));
                    extension.draw(field, file, content);
                    count++;
                    if (count == 3) {
                        count = 0;
                        tr = $("<tr/>");
                        table.append(tr);
                    }
                });
            });
        }());
        
        // Buttons
        
        (function () {
            var table = $("<table/>").addClass("buttons").attr("width", "100%");;
            var tr = $("<tr/>");
            
            table.append(tr);
            element.append(table);
            
            var count = 0;
            registry.point("io.ox.files.details.actions").each(function (index, extension) {
                var clicked = function () {
                    extension.clicked(file);
                }
                tr.append($("<td/>").append("<a/>").text(extension.displayName).attr("href", "#").click(clicked));
                count++;
                if (count == 3) {
                    count = 0;
                    tr = $("<tr/>");
                    table.append(tr);
                }
            });
        }());
        
        
        // Content Preview, if available
        
        (function () {
            if (!file.filename) {
                return;
            }
            var div = $("<div/>").addClass("preview");
            var fileDescription = {
                name: file.filename,
                type: file.file_mimetype,
                size: file.file_size,
                dataURL: ox.ajaxRoot+"/infostore?action=document&id="+file.id+"&folder="+file.folder_id+"&session="+ox.session
            };
            var rendered = false;
            registry.point("io.ox.files.renderer").each(function (index, renderer) {
                if (!rendered && renderer.canRender(fileDescription)) {
                    renderer.draw(fileDescription, div);
                    rendered = true;
                } 
            });
           
            if (rendered) {
                element.append(div);
            }
        }());
        
        // Render Description
        
        if (file.description) {
            element.append("<div/>").text(file.description);            
        }
        
        // Render Additional
        
        registry.point("io.ox.files.details.additional").each(function (index, extension) {
            extension(file, element);
        });
        
        
        
        return element;
    }
    
    
    // Basic Info Fields
    
    registry.point("io.ox.files.details.basicInfo").register({
       fields: ["file_size", "version"],
       displayNames : {
           "file_size": "Size",
           "version": "Version"
       },
       displayName : function(field) {
           return this.displayNames[field];
       },
       draw: function(field, file, element) {
           element.text(file[field]);
       }
       
    });
    
    // Basic Actions
    
    registry.point("io.ox.files.details.actions").register({
        displayName: "Send by E-Mail",
        clicked: function (file) {
            alert("Zzzzzush: "+file.title);
        }
    });
    
        
    // Simple Previews
    
    // .txt
    registry.point("io.ox.files.renderer").register({
       canRender: function (fileDescription) {
           return /\.txt$/.test(fileDescription.name);
       },
       draw: function (fileDescription, div) {
           var textDisplay = $("<pre />");
           $.get(fileDescription.dataURL).done(function (text) {
               textDisplay.text(text);
               div.append(textDisplay);
           });
       }
    });
    
    // .png, .jpg, .jpeg, .gif
    registry.point("io.ox.files.renderer").register({
          endings: ["png", "jpg", "jpeg", "gif"],
          canRender: function (fileDescription) {
              for(var i = 0, l = this.endings.length; i < l; i++) {
                  if (new RegExp("\."+this.endings[i]+"$").test(fileDescription.name)) {
                      return true;
                  }
              }
              return false;
          },
          draw: function (fileDescription, div) {
              div.append($("<img/>").attr("src", fileDescription.dataURL));
          }
       });
    
    
    return {
        draw: draw
    };
});