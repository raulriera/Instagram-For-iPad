var args = arguments[0] || {};
var rows = [];

_.each(args.tags, function(tag){
	rows.push(Alloy.createController("tableViewRows/hashtag", { title: tag }).getView());
});

// Update the data
$.hashtags.data = rows;

function onTableViewTouched(e){
	// Somehow I need to get this info all the way into the "index.js"
	//$.hashtags.fireEvent("hashtagTouched", { "tag": e.rowData.data });
};

$.hashtags.addEventListener("click", onTableViewTouched);