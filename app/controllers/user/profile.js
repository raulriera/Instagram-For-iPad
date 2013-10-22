var args = arguments[0] || {};
var instagram = require("/instagram");
var humanize = require("/humanize");

// When this method is executed we need to exit the grid and add a new one 
// with the user's media
// FIXME: currently we don't have this functionality up and running
function onViewPostsButtonTouched(e){
	alert("Go back to the main controller and open an 'user posts grid'");
}

// Simple helper function to update the personal information of the user
// this is here because we need to re use this from time to time
function updatePersonalInformation(user) {
	$.profile.title = user.username;
	$.avatar.image = user.profile_picture;
	$.fullname.text = user.full_name;
	$.bio.text = user.bio;
	$.website.text = user.website;
}

// When the HTTP request for the user information completes
function onUserInformationSuccess(e){	
	var data = JSON.parse(e.data).data;
	// Update the personal information
	updatePersonalInformation(data);
	// Update the "count" information
	$.postsCount.text = humanize.numberFormat(data.counts.media, 0, L("dec_point"), L("thousands_sep"));;
	$.followersCount.text = humanize.numberFormat(data.counts.followed_by, 0, L("dec_point"), L("thousands_sep"));
	$.followingCount.text =humanize.numberFormat(data.counts.follows, 0, L("dec_point"), L("thousands_sep"));
};

// When the HTTP request for the user information errors
function onUserInformationError(e){
	// Apparently Instagram sends out code 400 if the request is not 
	// valid (for private users) so let's take into account that here
	if (e.code === 400) {
		$.bio.text = L("user_is_private");
		$.viewPosts.enabled = false;
	}
};

// When the HTTP request for the user relationship status completes
function onUserRelationshipStatusSuccess(e){
	var data = JSON.parse(e.data).data;
		
	// If we already follow this user
	if (data.outgoing_status === "follows") {
		$.relationshipButton.applyProperties({
			enabled: true,
			title: L("relationship_unfollow")
		});
	} else {
		$.relationshipButton.applyProperties({
			enabled: true,
			title: L("relationship_follow")
		});
	}
	
	// If the user is private, display a message instead of the bio
	// if (data.target_user_is_private && data.incoming_status === "none") {
// 		$.bio.text = L("user_is_private");
// 	}
};

// When the HTTP request for the user relationship status errors
function onUserRelationshipStatusError(e){
	Titanium.API.info(e);
};

// When the HTTP request for setting the user relationship status completes
function onUserRelationshipSuccess(e){
	var data = JSON.parse(e.data).data;
	
	if (data.target_user_is_private) {
		$.relationshipButton.title = L("relationship_pending");
	} else if (data.outgoing_status === "none") {
		$.relationshipButton.title = L("relationship_follow");
	} else {
		$.relationshipButton.title = L("relationship_unfollow");
	}
	
	// Enable the button again
	$.relationshipButton.enabled = true;
};

// When the HTTP request for setting the user relationship status errors
function onUserRelationshipError(e){
	Titanium.API.info(e);
	
	// Enable the button again
	$.relationshipButton.enabled = true;
};

// When the follow/unfollow, etc button is touched
function onRelationshipButtonTouched(e){
	// Disable the button so that the user can't spam this
	e.source.enabled = false;
	
	var action = "follow";
	
	if (e.source.title === L("relationship_unfollow")) {
		action = "unfollow"
	}
	
	// Modify our relationship with this user
	instagram.setRelationship(args.user.id, { 
		"action": action 
	}, onUserRelationshipSuccess, onUserRelationshipError);
};

function onWebsiteTouched(e){
	if ($.website.text.length) {
		Titanium.Platform.openURL($.website.text);
	}
};

// Update the user's personal information
updatePersonalInformation(args.user);

// Fetch the real information of the user
instagram.getUserInfo(args.user.id, onUserInformationSuccess, onUserInformationError);
instagram.getRelationship(args.user.id, onUserRelationshipStatusSuccess, onUserRelationshipStatusSuccess);
