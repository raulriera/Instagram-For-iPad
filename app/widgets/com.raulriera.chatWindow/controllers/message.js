var args = arguments[0] || {};
var moment = require("alloy/moment");

// These values will help us configure how the dates display
moment.lang('en', {
    relativeTime : {
        future: "in %s",
        past:   "%s ago",
        s:  "seconds",
        m:  "a min",
        mm: "%d m",
        h:  "an hour",
        hh: "%d h",
        d:  "a day",
        dd: "%d d",
        M:  "a month",
        MM: "%d m",
        y:  "a year",
        yy: "%d y"
    }
});

// Fill the views
$.avatar.image = args.avatar;
$.username.text = args.username;
$.text.text = args.message;
$.date.text = moment.unix(args.createdAt).fromNow(true);

// Since we call "getView()" on this and we lose the controller, add it like always
// but just add the data we need, we don't need to pass around objects that we are not
// giving any use
$.message.data = args;