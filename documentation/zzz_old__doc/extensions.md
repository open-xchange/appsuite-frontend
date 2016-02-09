---
---


<h1>Extension Points</h1>

<p>Examples:</p>

<script type="text/example">
var ext = require("io.ox/core/extensions");
ext.point('io.ox/mail/detail').extend({
    index: 180,
    id: 'ad',
    draw: function (data) {
        this.append(
            $("<div>")
            .css({
                backgroundImage: "url(http://upload.wikimedia.org/wikipedia/commons/b/b0/Qxz-ad39.png)",
                width: '468px',
                height: "60px",
                margin: "0px auto 20px auto"
            })
        );
    }
});
</script>

<script type="text/example">
    var ext = require("io.ox/core/extensions");
    ext.point("io.ox/calendar/detail").extend({
        index: 10,
        id: "dreiChinesen",
        draw: function (appointment) {
            var psuedoChineseTitle = appointment.title.replace(/[aeiou]/g, "o");
            var $titleNode = $("<h2>").text(psuedoChineseTitle);
            return this.append($titleNode);
        }
    });
</script>

<script type="text/example">
// Disable participants
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").disable("participants");
</script>

<script type="text/example">
// Re-enable participants
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").enable("participants");
</script>

<script type="text/example">
// customize existing node
ext.point("io.ox/calendar/detail/date").extend({
    id: "highlight",
    index: 'last',
    draw: function () {
        this.css({
            backgroundColor: "yellow",
            padding: "3px",
            border: "1px solid #fc0"
        });
    }
});
</script>

<script type="text/example">
// Replace existing extension
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").replace({
    id: "title",
    draw: function (data) {
        this.append(
            $("<div>").addClass("title").text("Hello World! " + data.title)
        );
    }
});
</script>

<script type="text/example">
// Shuffle extension order
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").each(function (e) {
    e.index = Math.random() * 1000 >> 0;
}).sort();
</script>
