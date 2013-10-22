var args = arguments[0] || {};
var humanize = require("/humanize");

$.name.text = args.title;
$.count.text = humanize.numberFormat(args.count, 0, L("dec_point"), L("thousands_sep"));

// If the media we are watching is included in this collection
// display the native check mark on the row
if (args.hasCheck) {
	$.collection.hasCheck = true;
}

// Since we call "getView()" on this and we lose the controller, add it like always
// I am pretty sure there must be a better way to do this
$.collection.data = args;