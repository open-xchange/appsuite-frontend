DATA=<<END
@import "reset.less";
@import "variables.less"; // Modify this for custom colors, font-sizes, etc
@import "mixins.less";
@import "scaffolding.less";
@import "grid.less";
@import "layouts.less";
@import "type.less";
@import "code.less";
@import "forms.less";
@import "tables.less";
@import "sprites.less";
@import "dropdowns.less";
@import "wells.less";
@import "component-animations.less";
@import "close.less";
@import "buttons.less";
@import "button-groups.less";
@import "alerts.less"; // Note: alerts share common CSS with buttons and thus have styles in buttons.less
@import "navs.less";
@import "navbar.less";
@import "breadcrumbs.less";
@import "pagination.less";
@import "pager.less";
@import "modals.less";
@import "tooltip.less";
@import "popovers.less";
@import "thumbnails.less";
@import "labels-badges.less";
@import "progress-bars.less";
@import "accordion.less";
@import "carousel.less";
@import "hero-unit.less";
@import "utilities.less"; // Has to be last to override when necessary
END

includes = [];
DATA.split("\n").each do
  |line|
  if (line =~ /@import "(.*?)"/)
    includes.push($1)
  end
end

File.open('bootstrap-all.less', 'w') do
  |f|
  
  includes.each {|name| f.puts File.read(name) }

end