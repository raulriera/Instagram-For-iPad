var args = arguments[0] || {};
var rows = [];
var instagram = require("/instagram");

// Populate the chat with the initial info
$.chatWindow.addMessages(args.comments);

// Init the chatwindow widget
$.chatWindow.init(
	args.onTextFieldFocus, // When the textfield is focused
	args.onTextFieldBlurred, // When the textfield loses focus
	onTextSubmit, // When the submit button is touched
	onMessageTouched // When a row is touched
);

// Do we need to fetch more comments?
if (args.comments.length != args.count && args.mediaId) {
	// Add a "loading" tableview row
	$.chatWindow.showLoading();
	
	// Fetch the rest of the comments from instagram
	instagram.getComments(args.mediaId, onCommentsRequestSuccess, onCommentsRequestError);
}

// When the tableview row of a message is touched, execute
// this method
function onMessageTouched(e){
	// If we touched the face of the user
	if (e.source.id === "avatar") {
		// Display the mini user profile, pass down the 
		// id of the user
		var userProfile = Alloy.createController("user/profile", { 
			"user": {
				"id": e.data.userId,
				"profile_picture": e.data.avatar,
				"username": e.data.username
			}
		});
		
		// Show the popover on top of the user
		userProfile.getView().show({
			"view": e.source
		});
	}
};

// When the submit button of the form is pressed and 
// there is data to send to the server
function onTextSubmit(e){
	// Disable the chat box
	$.chatWindow.disableSubmitButton();
	// Make our request
	instagram.addComment(args.mediaId, { 
		"text": e.text 
	}, onCommentSuccess, onCommentError);
};

// When the comment publishing request completes
function onCommentSuccess(e){
	//var data = JSON.parse(e.data).data;
	
	alert(e);
	// Clear the chat box
	$.chatWindow.clearTextField();
	// Scroll to the bottom
	$.chatWindow.scrollToBottom();
	// Enable the chat box
	$.chatWindow.enableSubmitButton();
};

// When the comment publishing request fails
function onCommentError(e){	
	Titanium.API.info(JSON.stringify(e));
	
	// Enable the chat box
	$.chatWindow.enableSubmitButton();
};

// When the comments request completes
function onCommentsRequestSuccess(e){
	var data = JSON.parse(e.data).data;
	
	// Overwrite the messages with the complete list
	$.chatWindow.addMessages(data);
};

// When the comments request fails
function onCommentsRequestError(e){
	// I should add here a "reload button" at the bottom of the tableview
	Titanium.API.info("COMMENTS REQUEST FAILED");
	Titanium.API.info(e);
};