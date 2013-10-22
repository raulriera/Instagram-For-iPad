var args = arguments[0] || {};
var humanize = require("/humanize");

$.name.text = "#" + args.title;

if (args.count) {
	$.count.text = humanize.numberFormat(args.count, 0, L("dec_point"), L("thousands_sep"));
}

// Since we call "getView()" on this and we lose the controller, add it like always
$.hashtag.data = args.title;