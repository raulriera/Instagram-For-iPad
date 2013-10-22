var args = arguments[0] || {};

// Display the activity indicator
$.indicator.show();

// Init the 3rd party modules
var XHR = require("/xhr");
var animation = require('alloy/animation');

// If the media is a video
if (args.payload.type == "video") {
	$.videoPlayerIcon.visible = true;
} else {
	// Remove this from the view (we want the memory)
	$.imageView.remove($.videoPlayerIcon);
	$.videoPlayerIcon = null;
}

// Fetch the small image and cache it
new XHR().get(args.small, onImageSuccess, onImageFail, { ttl: 1440, contentType: "image/*" });

function onClick(e){
	animation.popIn($.image);
};

function reveal(){
	// Wait a small random delay
	setTimeout(function(){
		// Hide the indicator
		$.indicator.hide();	
		
		// Do a "pop in" of the image
		animation.popIn($.imageView);
		
		// Set the opacity
		// to 1, otherwise it's going to stay 0 since when
		// animating the values aren't really changing
		$.imageView.opacity = 1;
		// Remove everything we are not going to use anymore
		$.image.remove($.indicator);
		$.indicator = null;
		
	}, _.random(0, 250));
};

// When the image fetching succeeds
function onImageSuccess(e){
	// Assign the blob to the image	
	$.imageView.image = e.data;
	
	// This may not be present if the view is outside the cache
	reveal();
};

function onImageFail(e){
	Titanium.API.info('IMAGE FAILED');
	Titanium.API.info(e);
};

// Since we lose the "controller" when we add this to the grid, append it to the image view
$.imageView.data = args.payload; // the whole instagram object (may be overkill)