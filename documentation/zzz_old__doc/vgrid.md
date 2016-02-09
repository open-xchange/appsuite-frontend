---
---


<h1>VGrid</h1>

<p>Create new instance:</p>

<script type="text/example">
// pass jQuery node where VGrid should be drawn
var grid = new ox.ui.tk.VGrid(node);
</script>

<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
    nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
    erat, sed diam voluptua. At vero eos et accusam et justo duo dolores
    et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est
    Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur
    sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore
    et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
    accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
    no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
    
<p>Add basic template:</p>

<script type="text/example">
grid.addTemplate({
    build: function () {
        var name, email;
        this
            .addClass("contact")
            .append(name = $("<div/>").addClass("fullname"))
            .append(email = $("<div/>"))
            .append(job = $("<div/>").addClass("bright-text"));
        return { name: name, job: job, email: email };
    },
    set: function (data, fields, index) {
        fields.name.text(data.display_name);
        fields.email.text(data.email);
        fields.job.text(data.job);
    }
});
</script>

<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
    nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
    erat, sed diam voluptua. At vero eos et accusam et justo duo dolores
    et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est
    Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur
    sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore
    et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
    accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
    no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>

<p>Add label template:</p>
<script type="text/example">
grid.addLabelTemplate({
    build: function () { },
    set: function (data, fields, index) {
        var name = data.last_name || data.display_name || "#";
        this.text(name.substr(0, 1).toUpperCase());
    }
});
</script>

<p>Add a function to determine if a new label is needed:</p>
<script type="text/example">
grid.requiresLabel = function (i, data, current) {
    var name = data.last_name || data.display_name || "#",
        prefix = name.substr(0, 1).toUpperCase();
    return (i === 0 || prefix !== current) ? prefix : false;
};
</script>

<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
    nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
    erat, sed diam voluptua. At vero eos et accusam et justo duo dolores
    et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est
    Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur
    sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore
    et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
    accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,
    no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
    
<p>Define functions to get data:</p>

<script type="text/example">
// get all IDs of all objects
grid.setAllRequest(function (cont) {
    api.getAll().done(cont);
});

// define a named "search" request
grid.setAllRequest("search", function (cont) {
    api.search(win.search.query).done(cont);
});

// define a request that loads detailled data on demand
grid.setListRequest(function (ids, cont) {
    api.getList(ids).done(cont);
});
</script>
