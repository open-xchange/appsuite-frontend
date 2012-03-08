/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Stefan Preuss <stefan.preuss@open-xchange.com>
 */

define("io.ox/preview/util",
    [], function () {
    
    "use strict";
    
    var previewMap = ox.serverConfig.previewMimeTypes || {};
    
    var ContentType = function (contentType) {
        
        var primaryType = null,
            subType = null,
            list = {},
            regexp = new RegExp("([^\\s;]+)(?:\\s*;\\s*charset\\s*=\\s*\"?([^\\s;\"]*)\"?\\s*?)?" +
                    "(?:\\s?;\\s*name\\s*=\\s*\"?([^*;\"]*)\"?\\s*;?)?");
        
        // full content type
        if ($.type(contentType) !== "string") {
            contentType = "";
        }
        
        var result = regexp.exec(contentType);
        if (result.length) {
            if (result[1] !== undefined && result[1].match(/\//)) {
                // content type
                var split = result[1].split("/");
                primaryType = split[0];
                subType = split[1];
            }
            if (result[2] !== undefined) {
                // charset
                list.charest = result[2];
            }
            if (result[3] !== undefined) {
                // filename
                list.name = $.trim(result[3]);
            }
        }
        
        this.getPrimaryType = function () {
            return primaryType;
        };
        
        this.getSubType = function () {
            return subType;
        };
        
        this.getBaseType = function () {
            // need both
            if (primaryType === null || subType === null) {
                return null;
            }
            return primaryType + "/" + subType;
        };
        
        this.getParameter = function (name) {
            return list[name] || null;
        };
        
        this.getParameterList = function () {
            return list;
        };
        
        this.previewSupported = function (type) {
            if (type === undefined) {
                // using the base type from the constructor
                type = this.getBaseType();
            }
            // iterating through map and searching in values
            for (var i in previewMap) {
                if (previewMap[i] === type) {
                    return true;
                }
            }
            return false;
        };
    };
    
    var FileTypesMap = {
        
        getFileType : function (filename) {
            if (filename === undefined) {
                return null;
            }
            var fileEnding = filename.match(/\.([a-z0-9]{2,})$/i);
            if (fileEnding.length >= 2) {
                return fileEnding[1];
            }
            return null;
        },
        
        getContentType : function (filename) {
            var fileType = this.getFileType(filename);
            if (filename === undefined || fileType === null) {
                return null;
            }
            return previewMap[fileType];
        },
        
        /**
         * @param type {String} Can be both, either a filename or file type
         */
        previewSupported : function (type) {
            if (previewMap[type]) {
                // we have a matching type
                return true;
            } else {
                // maybe it's a filename?
                return !!previewMap[this.getFileType(type) || ""];
            }
        }
    };

    return {
        ContentType: ContentType,
        FileTypesMap: FileTypesMap
    };
});