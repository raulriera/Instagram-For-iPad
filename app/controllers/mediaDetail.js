var media = arguments[0].media; // everything about the media
var closeCallback = arguments[0].closeCallback; // the callback to execute when we are closing this window

var isMoving = false; // This lock helps us animate more smoothly
var XHR = require("/xhr");
var Animator = require("/Animator");
var animation = require('alloy/animation');
var instagram = require("/instagram");
var humanize = require("/humanize");

// When the window is opened, we use this to make the illusion that the
// content has loaded more quickly
function onAfterOpen(e){
	
	// Fetch the thumbnail image (we should have it cached)
	new XHR().get(media.images.low_resolution.url, onLowResImageSuccess, onLowResImageFail, { contentType: "image/*", ttl: 60 });

	// Fetch the actual high res image
	new XHR().get(media.images.standard_resolution.url, onHighResImageSuccess, onHighResImageFail, { contentType: "image/*" });
	
	// Start the activity indicator
	$.activityIndicator.show();
	
	// Assign the author info
	$.avatar.image = media.user.profile_picture;
	
	// If the user entered a caption, use it
	if (media.caption) {
		$.caption.text = media.caption.text.replace(/[#]+[A-Za-z0-9-_]+/g,""); // remove hashtags
		// After removing everything do we have a message at all?
		if ($.caption.text.trim().length == 0) {
			$.caption.text = media.user.full_name; // remove hashtags
		}
	// Other use his actual name
	} else {
		$.caption.text = media.user.full_name; // remove hashtags
	}
	
	// Init all the counter's values
	updateCounters(media);
	
	// If the media is a video, then setup everything to make
	// this type of media work
	if (media.type === "video") {
		$.videoPlayer.applyProperties({
			"url": media.videos.standard_resolution.url,
			"visible": true
		});
	
		$.videoPlayerIcon.visible = true;
	// Otherwise, let's clean up everything we don't need
	} else {
		// Remove the media player
		$.container.remove($.videoPlayer);
		$.videoPlayer = null;
		// Remove the "video" icon
		$.container.remove($.videoPlayerIcon);
		$.videoPlayerIcon = null;
	}
	
	// Do the UI changes depending on the user's orientation
	if ($.mediaDetail.orientation == 1 || $.mediaDetail.orientation == 2) {
		new Animator().moveTo({
			"view": $.author,
			"value": {
				"x": 0,
				"y": '110dp'
			}
		});
	};
	
	// Add the events listeners
	$.container.addEventListener('pan', onViewPanning);
	$.container.addEventListener('panend', onViewPanningEnded);
	$.container.addEventListener('touchend', onViewPanningEnded);
	$.container.addEventListener('touchcancel', onViewPanningEnded);
	
	// Do any UI fixes on orientation changes here (Remember to remove this or it will leak)
	Titanium.Gesture.addEventListener("orientationchange", onOrientationChanged);
	
	// Cleanup this event
	$.mediaDetail.removeEventListener("open", onAfterOpen);
	
	// Get the up to date information about this media
	// FIXME: check if we only need to do this for "collections"
	// because it seems we are wasting a network request here
	instagram.getMedia(media.id, onUpdatedMediaSuccess, onUpdatedMediaError);
};

function onUpdatedMediaSuccess(e){
	var data = JSON.parse(e.data).data;
	
	// Update the counters
	updateCounters(data);
};

function onUpdatedMediaError(e){
	Titanium.API.info(e);
};

// When the window is about to be closed, do everything necesesary to 
// clean after ourselves
function onBeforeClose(){
	// Remove this event listener
	Titanium.Gesture.removeEventListener("orientationchange", onOrientationChanged);
	
	// Execute the closing callback
	closeCallback();
	
	// Emtpy the sections
	_.each($.sections.views, function (page, index) {
		$.sections.removeView(page);
	});
	
	// Close the view
	$.mediaDetail.close();
};

// Update the values of all the counters in the view this is important
// because we initially we just use the object returned from the first fetch
// but we need to do a second request to ensure everything is up to date
// specially when dealing with photo collections
function updateCounters(updatedMedia){
	// Assign the count values to the buttons
	$.likesLabel.text = humanize.numberFormat(updatedMedia.likes.count, 0, L("dec_point"), L("thousands_sep"));
	$.commentsLabel.text = humanize.numberFormat(updatedMedia.comments.count, 0, L("dec_point"), L("thousands_sep"));
	$.hashtagsLabel.text = humanize.numberFormat(updatedMedia.tags.length, 0, L("dec_point"), L("thousands_sep"));
	
	// If I already liked this media
	if (updatedMedia.user_has_liked) {
		// Change the background image for the button
		$.likesButton.backgroundImage = "/icons/mediaDetail/liked.png";
	}
	
	// Update the "global" media object
	media = updatedMedia;
};

// This method is called by the comments textfield inside the
// comments sections. It is used to move the view a bit so the 
// keyboard doesn't overlap with the textfield
function onCommentsFieldFocused(){
	// Remove the panning gesture
	$.container.panGesture = false;
	
	// I just need to move this if the tablet is on landscape
	if ($.mediaDetail.orientation == Titanium.UI.LANDSCAPE_LEFT || $.mediaDetail.orientation == Titanium.UI.LANDSCAPE_RIGHT) {
		new Animator().moveTo({ 
			"view": $.container, 
			"value": {
				"x": 0, 
				"y": '-180dp'
			},
			"duration": 200
		});
	}
};

// This method is called by the comments textfield inside the
// comments sections. It is used to reset the view position
function onCommentsFieldBlurred(){
	// Add the panning gesture
	$.container.panGesture = true;
	
	new Animator().moveTo({ 
		"view": $.container, 
		"value": {
			"x": 0, 
			"y": 0
		},
		"duration": 200
	});
};

// Everytime we are moving the view with our fingers
function onViewPanning(e){	
	// If we are not already moving the view,
	// let's move it a bit.
	// FIXME: It appears sometimes the lock is never released
	if (!isMoving) {
		// Lock the view so we can't drag it any more
		isMoving = true;
		// Calculate how far and fast I am dragging the view
		var duration = (e.velocity.y / e.translation.y);
				
		new Animator().moveTo({ 
			"view": $.container, 
			"value": {
				"x": 0, 
				"y": e.translation.y
			},
			"duration": duration,
			"onComplete": function(){
				isMoving = false;
			}
		});
		
		// Check if the window will go out of bounds
		if (e.translation.y > 190) {
			viewOutOfBounds("down");
		} else if (e.translation.y < -190) {
			viewOutOfBounds("up");
		}
	}

};

// When we stop moving the view with our finger, execute this
function onViewPanningEnded(e){	
	new Animator().moveTo({ 
		"view": e.source, 
		"value": {
			x: 0, 
			y: 0
		},
		"duration": 200
	});
};

// The user is able to drag around the vide in order to close it
// this method gets executed when the threshold is reached and the 
// view is mark for closing
function viewOutOfBounds(direction){
	// Lock the view
	isMoving = true;
	
	// Remove the touch event of the container
	$.container.touchEnabled = false;
	
	// Remove the panning events
	$.container.removeEventListener('pan', onViewPanning);
	$.container.removeEventListener('panend', onViewPanningEnded);
	$.container.removeEventListener('touchend', onViewPanningEnded);
	$.container.removeEventListener('touchcancel', onViewPanningEnded);
	
	// Fade out the whole window
	new Animator().fade({ 
		"view": $.mediaDetail, 
		"value": 0,
		"duration": 550
	});
	
	// "Throw away" the container
	new Animator().moveTo({ 
		"view": $.container, 
		"value": {
			x: 0, 
			y: direction == "up" ? -800 : 800 
		},
		"duration": 500,
		"onComplete": onBeforeClose
	});
	
};

// When the low resolution image is loaded, this is helpful to show
// the user something and add to that "speed illusion" we mentioned 
// earlier
function onLowResImageSuccess(e){
	// Swap the thumbnail image with the low one
	$.media.image = e.data;
};

// When the request for the low resolution image fails. We can skip this
// if the high res one loaded
function onLowResImageFail(e){
	Titanium.API.info(e);
};

// When the "real" high definition image is loaded
function onHighResImageSuccess(e){
	// Swap the low res image with the highres one
	$.media.image = e.data;
	// Hide the activity indicator
	$.activityIndicator.hide();
	
	// Hide the image
	if (media.type == "video") {
		$.media.visible = false;
	}
	
	// Remove the indicator
	$.media.remove($.activityIndicator);
	$.activityIndicator = null;
};

// When the request for the high resolution image fails. This needs
// to be handled nicely for the user
function onHighResImageFail(e){
	Titanium.API.info(e);
};

// Everytime the user double taps on the media itself, perform 
// the action he knows well from instagram
function onMediaDoubleTapped(e){
	// Toggle the "likeness" of this media
	if (media.user_has_liked) {
		instagram.unlikeMedia(media.id, function(e){
			Titanium.API.info(e);
			// Mark that we no longer like this media
			media.user_has_liked = false;
			// Change the background image for the button
			$.likesButton.backgroundImage = "/icons/mediaDetail/likes-up.png";
		}, function(e){
			// I should do something here to let the user know
			Titanium.API.info(e);
		});
	} else {
		instagram.likeMedia(media.id, function(e){
			Titanium.API.info(e);
			// Mark that we now like this media
			media.user_has_liked = true;
			// Change the background image for the button
			$.likesButton.backgroundImage = "/icons/mediaDetail/mediaDetail.png";
		}, function(e){
			// I should do something here to let the user know
			Titanium.API.info(e);
		});
	}
	
	// Animate the like button
	animation.flash($.likesButton);
};

// Play and pause the video
function toggleVideoPlayback(e){
	if (e.source.playing) {
		e.source.pause();
	} else {
		e.source.play();
	}
};

// When the location (right menu) button is touched
function onLocationButtonTouched(e){
	// Only if there is a location
	if (media.location) {
		// Load the tags view
		var view = Alloy.createController("media/location", { 
			"id": media.location.id,
			"name": media.location.name,
			"latitude": media.location.latitude, 
			"longitude": media.location.longitude
		}).getView();
	
		addViewToSections(view);
	} else {
		animation.shake($.locationButton);
	}
};

// When the likes (right menu) button is touched
function onLikesButtonTouched(e){
	// Only if the user count is above 0
	if (media.likes.count) {
		// Load the tags view
		var view = Alloy.createController("media/users", { 
			"users": media.likes.data, 
			"count": media.likes.count,
			"mediaId": media.id
		}).getView();
	
		addViewToSections(view);
	} else {
		animation.shake($.likesButton);
	}
};

// When the comments (right menu) button is touched
function onCommentsButtonTouched(e){
	// Load the tags view
	var view = Alloy.createController("media/comments", {
		"comments": media.comments.data,
		"count": media.comments.count,
		"mediaId": media.id,
		"onTextFieldFocus": onCommentsFieldFocused,
		"onTextFieldBlurred": onCommentsFieldBlurred
	}).getView();

	addViewToSections(view);
};

// When the tags (right menu) button is touched
function onTagsButtonTouched(e){
	// Only if the tag count is above 0
	if (media.tags.length) {
		// Load the tags view
		var view = Alloy.createController("media/hashtags", {
			"tags": media.tags
		}).getView();
	
		addViewToSections(view);
	} else {
		animation.shake($.hashtagsButton);
	}
};

// When the collections button is touched
function onCollectionsButtonTouched(e){
	var view = Alloy.createController("media/collections", {
		"media": media
	}).getView();
	
	// Load the collections view
	addViewToSections(view);
};

// When the share (right menu) button is touched
function onShareButtonTouched(e){
	var Social = require("dk.napp.social");
		
	Social.activityView({
	    text: media.link + " via @getinstagrid",
		view: $.shareButton,
	    removeIcons:"sms,copy"
	});
	
	// The example below, shows how to add "custom ones"
	// Social.activityView({
// 	    text: media.link + " via @getinstagrid",
// 		view: $.shareButton,
// 	    //removeIcons:"print,sms,copy,contact,camera,mail"
// 	},[
// 	    {
// 	        title:"Custom Share",
// 	        type:"hello.world",
// 	        image:"pin.png"
// 	    },
// 	    {
// 	        title:"Open in Safari",
// 	        type:"open.safari",
// 	        image:"safari.png"
// 	    }
// 	]);
	
	Social.addEventListener("complete", function(e){
		Ti.API.info("complete: " + e.success);

		if (e.platform == "activityView" || e.platform == "activityPopover") {
			switch (e.activity) {
				case Social.ACTIVITY_TWITTER:
					Ti.API.info("User is shared on Twitter");
					break;

				case Social.ACTIVITY_CUSTOM:
					Ti.API.info("This is a customActivity: " + JSON.stringify(e));
					break;
			}
		}
	});
};

// When the author's profile picture is touched, show a few options
function onAvatarTouched(e){
	// Display the mini user profile
	var userProfile = Alloy.createController("user/profile", { "user": media.user });
	
	userProfile.getView().show({
		"view": e.source
	});
};

// Everytime the window is touched (the outside region of the popup)
function onWindowTouched(e) {
	// Close the window
	if (e.source.id === "mediaDetail"){
		viewOutOfBounds("down");
	}
};

// Everytime we add a view to the "sections", we need to pop any
// views that are already present, add the new one and scroll to it
function addViewToSections(view){
	if ($.sections.views.length >= 2) {
		$.sections.removeView(1);
	}

	$.sections.addView(view);
	$.sections.scrollToView(1);
};

// Everytime the orientation changes on the device,
// make the necesarry changes in the layout
function onOrientationChanged(e){
	if (e.orientation == 1 || e.orientation == 2) {
		new Animator().moveTo({
			view: $.author,
			value: {
				x: 0,
				y: '130dp'
			}
		});
	} else if (e.orientation == 3 || e.orientation == 4) {
		new Animator().moveTo({
			view: $.author,
			value: {
				x: 0,
				y: '0dp'
			}
		});
	}
};

// Listen for when the window is opened
$.mediaDetail.addEventListener("open", onAfterOpen);