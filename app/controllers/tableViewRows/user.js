var args = arguments[0] || {};

// Fill the views
$.avatar.image = args.avatar;
$.name.text = args.name;
$.username.text = args.username;

// Since we call "getView()" on this and we lose the controller, add it like always
// but just add the data we need, we don't need to pass around objects that we are not
// giving any use
$.user.data = args;