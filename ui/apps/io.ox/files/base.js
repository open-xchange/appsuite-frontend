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
        file.url = ox.ajaxRoot+"/infostore?action=document&id="+file.id+"&folder="+file.folder_id+"&session="+ox.session; // TODO: Put this somewhere in the model
        var element = $("<div />").addClass("fileDetails");
        element.append($("<h1/>").text(file.title));
        // Basic Info
        (function () {
            var container = $("<div/>").addClass("basicInfo");
            var line = $("<div/>");
            container.append(line);
            element.append(container);
            
            registry.point("io.ox.files.details.basicInfo").each(function (index, extension) {
                var customFields = extension.fields || [];
                var count = 0;
                $.each(customFields, function (index, field) {
                    var content = null;
                    line.append($("<em/>").text(extension.displayName(field)+":")).append(content = $("<span/>"));
                    extension.draw(field, file, content);
                    count++;
                    if (count == 5) {
                        count = 0;
                        line = $("<div/>");
                        container.append(line);
                    }
                });
            });
        }());
        
        // Buttons
        
        (function () {
            var container = $("<div/>").addClass("buttons");
            var line = $("<div/>");
            
            container.append(line);
            element.append(container);
            
            var count = 0;
            registry.point("io.ox.files.details.actions").each(function (index, extension) {
                var clicked = function () {
                    extension.clicked(file);
                }
                line.append($("<a/>").text(extension.displayName).attr("href", "#").click(clicked));
                count++;
                if (count == 5) {
                    count = 0;
                    line = $("<div/>");
                    container.append(line);
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
                dataURL: file.url
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
            element.append($("<div/>").text(file.description));            
        }
        
        // Render Additional
        
        registry.point("io.ox.files.details.additional").each(function (index, extension) {
            extension(file, element);
        });
        
        
        
        return element;
    }
    
    
    // Basic Info Fields
    
    var bytesToSize = function (bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return 'n/a';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    };
    
    registry.point("io.ox.files.details.basicInfo").register({
        index: 10,
        fields: ["file_size"],
        displayName: function () {
            return "Size";
        },
        draw: function (field, file, element) {
            element.text(bytesToSize(file["file_size"]));
        }
    });
    
    registry.point("io.ox.files.details.basicInfo").register({
       index: 20,
       fields: ["version"],
       displayName : function(field) {
           return "Version";
       },
       draw: function (field, file, element) {
           element.text(file["version"]);
       }
       
    });
    
    var formatDate = function (timestamp) {
        var d = new Date(timestamp);
        return d.toLocaleString();
    }
    
    registry.point("io.ox.files.details.basicInfo").register({
        index: 30,
        fields: ["last_modified"],
        displayName: function () {
            return "Last Modified";
        },
        draw: function (field, file, element) {
            element.text(formatDate(file["last_modified"]));
        }
    });
    
    // Basic Actions
    
    registry.point("io.ox.files.details.actions").register({
        index: 10,
        displayName: "Download",
        clicked: function (file) {
            window.open(file.url+"&content_type=application/octet-stream&content_disposition=attachment", file.title);
        }
    });

    registry.point("io.ox.files.details.actions").register({
        index: 20,
        displayName: "Open",
        clicked: function (file) {
            window.open(file.url, file.title);
        }
    });

    registry.point("io.ox.files.details.actions").register({
        index: 30,
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
           var textDisplay = $("<textarea/>").attr("rows", "30").attr("cols", "80").attr("readonly", "readonly");
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
              div.append($("<img/>").attr("src", fileDescription.dataURL+"&width=600&height=400").attr("width", "600").attr("height", "400").css("border", "1px solid black"));
          }
       });
    
    
    return {
        draw: draw
    };
});