define("io.ox/preview/officePreview", ["io.ox/core/tk/modals"], function (modals) {
    
    "use strict";
    
    /**
    * Do yourself a favor. Don't read this code
    */
    
    // TODO: Cache preview
    
    function moveAllNodes($node, top, left) {
        var offsetTop, offsetLeft;
        offsetTop = top - $node.offset().top;
        offsetLeft = left - $node.offset().left;
        
        $node.css({
            top: top,
            left: left
        });
        
        // Visit every node in the tree and, if it is absolutely positioned, move it by the offset
        $node.find("*").each(function (index, $childNode) {
            $childNode = $($childNode);
            var position, childLeft, childTop;
            
            position = $childNode.css("position");
            if (position && position.toLowerCase() === 'fixed') {
                if ($childNode.css("top")) {
                    $childNode.css({
                        top: $childNode.offset().top + offsetTop + "px"
                    });
                }
                
                if ($childNode.css("left")) {
                    
                    $childNode.css({
                        left: $childNode.offset().left + offsetLeft + "px"
                    });
                }
            }
        });
    }
    
    function draw(fileURL) {
        $.ajax({
            url: fileURL + "&format=preview_filtered&pages=3&previewForceDiv=true",
            dataType: 'json'
        }).done(function (response) {
            var $previewNode = $(response.data.document[0]).css({
                backgroundColor: "white"
            });
                        
            var underlay = new modals.Underlay();
            underlay.elevate($previewNode).hide().elevation.include().wire();
            underlay.include();
            underlay.on("hide", function () {
                underlay.destroy();
            });
            
            
           
            var windowWidth = $(window).width();
            var windowHeight = $(window).height();
            
            $previewNode.show();

            var targetLeft = 0;
            if (windowWidth > $previewNode.width()) {
                targetLeft = Math.floor((windowWidth / 2) - ($previewNode.width() / 2));
            }
            
            var targetTop = 0;
            if (windowHeight > $previewNode.height()) {
                targetTop = Math.floor((windowHeight / 2) - ($previewNode.height() / 2));
            }
            moveAllNodes($previewNode, targetTop, targetLeft);
            $previewNode.hide();
            
            underlay.show();
        });
    }
    
    
    return {
        draw: draw
    };
});