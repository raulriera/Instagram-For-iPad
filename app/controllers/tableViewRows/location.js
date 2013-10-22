var args = arguments[0] || {};

$.name.text = args.title;

// Since we call "getView()" on this and we lose the controller, add it like always
$.hashtag.data = args.title;