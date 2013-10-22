var args = arguments[0] || {};
var rows = [];
var instagram = require("/instagram");

_.each(args.users, function(user){
	rows.push(Alloy.createController("tableViewRows/user", { 
		"userId": user.id, 
		"name": user.full_name,
		"username": user.username,
		"avatar": user.profile_picture
	}).getView());
});

// Update the likers list
$.users.data = rows;

// Do we need to fetch more users?
if (args.users.length != args.count && args.mediaId) {
	// Add a "loading" tableview row
	rows.push(Alloy.createWidget("com.raulriera.loadingTableViewRow").getView());
	
	// Update the likers list
	$.users.data = rows;
	
	// Fetch the rest of the likers from instagram
	instagram.getLikers(args.mediaId, onLikersRequestSuccess, onLikersRequestError);
}

function onLikerTouched(e){		
	// If we touched the face of the user
	if (e.source.id === "avatar") {
		var data = e.rowData.data;
		
		// Display the mini user profile, pass down the 
		// id of the user
		var userProfile = Alloy.createController("user/profile", { 
			"user": {
				"id": data.userId,
				"profile_picture": data.avatar,
				"username": data.username
			}
		});
		
		// Show the popover on top of the user
		userProfile.getView().show({
			"view": e.source
		});
	}
};

function onLikersRequestSuccess(e){
	var data = JSON.parse(e.data).data;
	rows = [];
	
	_.each(data, function(user){
		rows.push(Alloy.createController("tableViewRows/user", { 
			"userId": user.id, 
			"name": user.full_name,
			"username": user.username,
			"avatar": user.profile_picture
		}).getView());
	});
	
	// Update the likers list
	$.users.data = rows;
};

function onLikersRequestError(e){
	// I should add here a "reload button" at the bottom of the tableview
	Titanium.API.info("LIKERS REQUEST FAILED");
	Titanium.API.info(e);
};