// Init the callbacks we are going to overwrite with the init()
var onSubmitButtonCallBack = function(){};
var onTableViewTouchedCallback = function(){};

exports.init = function(onFocus, onBlur, onSubmit, onMessageTouched) {
	$.textBox.addEventListener("focus", onFocus);
	$.textBox.addEventListener("blur", onBlur);
	// Overwrite this function
	onTableViewTouchedCallback = onMessageTouched;
	onSubmitButtonCallBack = onSubmit;
};

exports.scrollToBottom = function() {
	if ($.conversation.data[0] && $.conversation.data[0].rows){
		$.conversation.scrollToIndex($.conversation.data[0].rows.length-1);
	}
};

exports.showLoading = function(){
	// Add a "loading" tableview row
	$.conversation.appendRow(Alloy.createWidget("com.raulriera.loadingTableViewRow").getView());
	// Scroll to the bottom
	exports.scrollToBottom();
};

exports.addMessages = function(messages) {
	var rows = [];
	
	_.each(messages, function(message, index){
		rows.push(createMessage(
			message.id, // the comment id
			message.from.id, // the author id
			message.from.profile_picture, // author profile
			message.from.username,  // author username
			message.text, // actual message
			message.created_time // created timestamp
		));
	});
	
	// Add the messages to the conversation
	$.conversation.data = rows;
	// Scroll to the bottom
	exports.scrollToBottom();
};

exports.clearTextField = function(){
	$.textBox.value = "";
	$.textBox.blur();
};

exports.disableSubmitButton = function(){
	$.submitButton.enabled = false;
};

exports.enableSubmitButton = function(){
	$.submitButton.enabled = true;
};

// Create a message row and return it
function createMessage(commentId, userId, avatar, username, text, createdAt) {
	var row = Widget.createController("message", {
		"commentId": commentId,
		"userId": userId,
		"avatar": avatar,
		"username": username,
		"message": text,
		"createdAt": createdAt
	}).getView();
	
	// Append it to the rows
	return row;
};

// When the conversation is touched
function onTableViewTouched(e) {
	onTableViewTouchedCallback({
		"source": e.source,
		"data": e.rowData.data
	});
};

// Everytime the submit button is touched
// send out callback out
function onSubmitButtonTouched(e) {
	// Only if there is ana actual value in the textfield
	if ($.textBox.value.length) {		
		onSubmitButtonCallBack({
			"text": $.textBox.value
		});
	}
};

// When the value of the textfield changes
function onTextFieldChanged(e){
	if ($.textBox.value.length > 0) {
		exports.enableSubmitButton();
	} else {
		exports.disableSubmitButton();
	}	
};