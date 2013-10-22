var scrollEndCallback = null;
var thumbnailTouchedCallback = null;
var imagesPerPage = 11; // Starts at zero

/**
 * @method init
 * This will accept the initial configuration of the widget
 * pass the images you wish to display and the default gutter
 * size between them
 * @param {Array} images array of objects.
 * @param {Function} callback when the view as reached the last view
 * @param {Function} callback when an image is touched
 */
exports.init = function(images, onScrollEndCallback, onThumbnailTouchedCallback) {
	// Init the callbacks
	scrollEndCallback = onScrollEndCallback;
	thumbnailTouchedCallback = onThumbnailTouchedCallback;
	
	var currentCount = 0;
	var views = [Widget.createController('container').getView()];
	var currentPage = 0;
	
	// For every image passed
	_.each(images, function (image, index) {
		
		if (currentCount <= imagesPerPage) {
			//Titanium.API.info("Page " + currentPage + " is full");
		} else {
			currentCount = 0;
			currentPage = currentPage + 1;
			views.push(Widget.createController('container').getView());
		}
		
		views[currentPage].add(Widget.createController('image', image).getView("image"));
		currentCount = currentCount + 1;		
	});
	
	$.scrollableView.views = views;
};

// Append images to the scrollview
exports.appendImages = function(images) {
	var currentCount = ($.scrollableView.views[($.scrollableView.views.length)-1].children.length)-1;		
	var currentPage = ($.scrollableView.views.length)-1;
	
	// Sometimes the count is spot on 0, and substracting one creates problems
	// set it back to 0
	if (currentCount < 0) {
		currentCount = 0;
	}
	
	// For every image passed
	_.each(images, function (image, index) {
	
		if (currentCount <= imagesPerPage) {
			//Titanium.API.info("Page " + currentPage + " is full");
		} else {
			currentCount = 0;
			currentPage = currentPage + 1;
			$.scrollableView.addView(Widget.createController('container').getView());
		}

		$.scrollableView.views[currentPage].add(Widget.createController('image', image).getView("image"));
		currentCount = currentCount + 1;

	});
};

function onScrollEnd(e){
	// Prevent event bubbling
	e.cancelBubble = true;
	
	// If we are at the last page, fire an event about it
	if (e.currentPage == (e.source.views.length-1)) {
		// Execute the scrollEnd callback
		scrollEndCallback(e);		
	}
};

function onImageClick(e){
	// If we touched an actual image
	if (e.source.data) {
		thumbnailTouchedCallback(e.source.data);
	}
};

$.scrollableView.addEventListener("scrollend", onScrollEnd);
$.scrollableView.addEventListener("click", onImageClick);