---
title: VGrid
description: The VGrid is a grid used to structure contents in the main viewport.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:VGrid
---

The VGrid is a grid used to structure contents in the main viewport. 
For example, if you see mails stacked in the v-split of the mail module, this is the VGrid at work

# Create new instance

```javascript
// pass jQuery node where VGrid should be drawn
var grid = new ox.ui.tk.VGrid(node);
```

# Add basic template

```javascript
grid.addTemplate({
    build: function() {
        var name, email;
        this
            .addClass("contact")
            .append(name = $("<div/>").addClass("fullname"))
            .append(email = $("<div/>"))
            .append(job = $("<div/>").addClass("bright-text"));
        return {
            name: name,
            job: job,
            email: email
        };
    },
    set: function(data, fields, index) {
        fields.name.text(data.display_name);
        fields.email.text(data.email);
        fields.job.text(data.job);
    }
});
```

# Add label template

```javascript
grid.addLabelTemplate({
    build: function() {},
    set: function(data, fields, index) {
        var name = data.last_name || data.display_name || "#";
        this.text(name.substr(0, 1).toUpperCase());
    }
});
```

# Add a function to determine if a new label is needed

```javascript
grid.requiresLabel = function(i, data, current) {
    var name = data.last_name || data.display_name || "#",
        prefix = name.substr(0, 1).toUpperCase();
    return (i === 0 || prefix !== current) ? prefix : false;
};
```

# Define functions to get data

```javascript
 // get all IDs of all objects
 grid.setAllRequest(function(cont) {
     // must return deferred object
     return api.getAll().done(cont);
 });

 // define a named "search" request
 grid.setAllRequest("search", function(cont) {
     // must return deferred object
     return api.search(win.search.query).done(cont);
 });

 // define a request that loads detailled data on demand
 grid.setListRequest(function(ids, cont) {
     // must return deferred object
     return api.getList(ids).done(cont);
 });
```
