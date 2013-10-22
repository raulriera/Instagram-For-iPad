var args = arguments[0] || {};

// Make some defaults
args.type = args.type || "hashtag";
args.data = args.data || "badassnatureshots";

// Load any libraries or helpers we need here
var Animator = require("/Animator");
var animation = require('alloy/animation');
var instagram = require("/instagram");

// Init all the variables that will make this view work properly
var isMediaOpened = false; // This lock prevents opening more than 1 media at a time
var isPinching = false; // This lock helps us animate more smoothly
var pagination; // Keep track of the current pagination
var paginations = []; // Keep track of all the pages fetched by XHR
var imageScrollableView = $.imageGrid.getView(); // This is the view of our widget

// This method checks if we need to keep loading images sort of acts
// like a smart "infinite view" where it keeps loading stuff if we
// are at the end or until the view is filled
function shouldContinueLoadingImages(){
	var result = true;
	
	// If after adding images we are still on the same "first page"
	// then add the next page of pagination
	// The number 11 comes from the com.raulriera.imageGrid/controllers/widget.js file
	if (!_.contains(paginations, pagination.next_url) && (imageScrollableView.views.length-1) == imageScrollableView.currentPage && pagination.next_url) {
		// Append the page to our pagination history
		paginations.push(pagination.next_url);
		// Fetch the next page in our pagination
		instagram.getNextPageInPagination(pagination.next_url, onUpdateRequestSuccess, onRequestFailed);
	} else {
		result = false;
	}
	
	return result;
};

// When the request for images is complete
function onRequestSuccess(e){
	// If this is a normal "request success"
	if (e.data) {
		pagination = JSON.parse(e.data).pagination;
		var data = JSON.parse(e.data).data;
		// Otherwise we played with hte data in order to make this
		// feel like it came from XHR + Instagram
	} else {
		pagination = {
			"next_url": null
		};
		var data = e;
	}
		
	var images = [];
	
	for (key in data) {
		var image = data[key];
		images.push( { "id": key, "small": image.images.low_resolution.url, "large": image.images.standard_resolution.url, payload: image });
	}
	
	// Pass the images array, onScrollEnd and onThumbnailTouched callbacks to the widget
	$.imageGrid.init(images, onGridScrolledToLastPage, onThumbnailTouched);
	
	// Check if we need to keep populating the imageGrid
	shouldContinueLoadingImages();
};

// When the request for images fails
function onRequestFailed(e){
	Titanium.API.info(e);
};

// Special function to first handle the data of the collection 
// before pushing it to the `onRequestSuccess` method
function onCollectionRequestSuccess(e){
	var collection = [];
	
	_.each(e, function (media) {
		collection.push(JSON.parse(media.media));
	});
	
	// Execute the "normal" on RequestSuccess
	onRequestSuccess(collection)	
};

// Everytime we scroll to the last page of the image container
function onGridScrolledToLastPage(e) {
	// Am I at the end?
	if (!shouldContinueLoadingImages()){
		Titanium.API.info("End of pagination reached");
	}
};

// When the request to update the contnet of the image container completes
function onUpdateRequestSuccess(e){
	pagination = JSON.parse(e.data).pagination;
	var data = JSON.parse(e.data).data;
	
	var images = [];
		
	for (key in data) {
		var image = data[key];
		images.push( { "id": key, "small": image.images.low_resolution.url, "large": image.images.standard_resolution.url, payload: image });
	}

	$.imageGrid.appendImages(images);
	
	// Check if we need to keep populating the imageGrid
	shouldContinueLoadingImages();
};

// Everytime we touch one of the images in the container
function onThumbnailTouched(e){
	if (!isMediaOpened) {
		isMediaOpened = true; // Lock this method
		
		// Create the media detail controller, passing the media data
		// close callback and opening it :)
		Alloy.createController("mediaDetail", {
			"media": e, 
			"closeCallback": onMediaDetailClosing
		}).getView().open();
	}
};

// When the 'image detail' window is about to close,
// it will 'call back' to this method
function onMediaDetailClosing(){
	isMediaOpened = false; // release the lock
};

// When the image container is getting pinched, here we do all
// the logic that will control if the view is at the right scale
// so we can "close it" and show the main app navigation
function onPinched(e){	
	if (e.scale < 1 && !isPinching) {
		isPinching = true;
		
		new Animator().scale({
			"view": $.gridView,
			"value": e.scale,
			"duration": 0,
			"onComplete": function(){
				isPinching = false;
			}
		});
	}
	
	// If we reached our desired min scale
	if (e.scale <= Alloy.Globals.triggerNavigationScale) {
		// Execute our callback that we reached our minimized state 
		args.onMinimize();

		// Make it stick to Alloy.Globals.triggerNavigationScale
		new Animator().scale({
			"view": $.gridView,
			"value": Alloy.Globals.triggerNavigationScale,
			"duration": 0
		});
	}	
};

// When the image container is no longer getting pinched
function onPinchedEnded(e){
	// Reset it to the original size
	new Animator().scale({
		view: $.gridView,
		value: 1,
		duration: 250
	});
	
	// Execute our callback that we reached our maximized state 
	args.onMaximize();
};

// This method makes the image container stop interacting with gesture
// pretty useful so the main navigation can take the bigger role
function sleep(){
	$.gridView.pinchingGesture = false;
	imageScrollableView.touchEnabled = false;
};

// This method undos everthing from the 'sleep' method
function wakeup(){
	$.gridView.pinchingGesture = true;
	imageScrollableView.touchEnabled = true;
};

// This method controls what type of "image grid" to use for this 
// image container. All of this information is passed down by the 
// main navigation
function init() {
	// What type of grid to create?
	switch (args.type) {
		case "feed":
			// Search all the recent images in my timeline
			instagram.getFeed(onRequestSuccess, onRequestFailed);
			break;
		case "user":
			// Search all the recent images for this given user
			instagram.getUserMedia(args.data, onRequestSuccess, onRequestFailed);
			break;
		case "hashtag":
			// Search all the recent images for this given hashtag
			instagram.searchByHashtag(args.data, onRequestSuccess, onRequestFailed);
			break;
		case "likes":
			// Search all the images I have liked
			instagram.getLiked(onRequestSuccess, onRequestFailed);
			break;
		case "location":
			// Search all the recent images for this given location
			instagram.searchByLocation(args.data, onRequestSuccess, onRequestFailed);
			break;
		case "collection":
			// Search all the recent images for this given location
			instagram.searchByCollection(args.data, onCollectionRequestSuccess);
			break;
	}
};

// Init the grid
init();

// Enable the gestures on this view
$.gridView.applyProperties({
	"pinchingGesture": true,
	"sleep": sleep, // Expose this method
	"wakeup": wakeup // Expose this method
});

$.gridView.addEventListener("pinching", onPinched);
$.gridView.addEventListener("pinchingend", onPinchedEnded);
