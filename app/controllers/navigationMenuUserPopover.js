var instagram = require("/instagram");

var isSearching = false; // lock so that we don't spam the server
var searchHistory = Titanium.App.Properties.getList("userSearchHistory", []).sort();

function onTableViewTouched(e){
	var user = e.rowData.data;
	$.trigger("selectedUser", { "id": user.id, "username": user.username });
		
	// Check if the userId has already been searched for
	var searchHistoryFiltered = _.filter(searchHistory, function(item){
		return item.id.indexOf(user.id) !== -1;
	});
	
	// If we didnt find anything, then append this user to our history
	if (!searchHistoryFiltered.length) {
		searchHistory.push(user);
		// Update our search history
		Titanium.App.Properties.setList("userSearchHistory", searchHistory);
	}
};

function onSeachBarChange(e){	
	// If we trped more than 3 chars, then do an internet fetch
	if (e.value.length > 3 && !isSearching) {
		// Lock the search
		isSearching = true;
		// Search instagram for a tag with this name
		instagram.searchUser(e.value, onSearchSuccess, onSearchError);
		
		// Wait a bit
		setTimeout(function(){
			// Release the search lock
			isSearching = false;
		}, 150);
		
	// Do a "local" search on our previous results
	} else if (e.value.length > 0 && e.value.length <= 3) {
		var searchHistoryFiltered = _.filter(searchHistory, function(user){
			return user.username.toLowerCase().indexOf(e.value.toLowerCase()) !== -1;
		});
		
		populateSearchHistory(searchHistoryFiltered);
	// Display our entire history again
	} else {
		populateSearchHistory(searchHistory);
	}
	
};

function onSearchSuccess(e){	
	var data = JSON.parse(e.data).data;
	var rows = [];
		
	_.each(data, function (user, index) {
		rows.push(Alloy.createController("tableViewRows/user", { 
			"id": user.id,
			"avatar": user.profile_picture,
			"username": user.username,
			"name": user.full_name
		}).getView());
	});
		
	// Update the tableview
	$.results.data = rows;
};

function onSearchError(e){
	// Release the search lock
	isSearching = false;
	
	Titanium.API.info(e);
};

function reveal(view){
	$.navigationMenuUserPopover.show({
		"view": view
	});
};

function dismiss(){
	$.navigationMenuUserPopover.hide();
};

function populateSearchHistory(array){	
	var rows = [];
	
	// Populate the results with the previous searches (if any)
	_.each(array, function (user, index) {
		rows.push(Alloy.createController("tableViewRows/user", { 
			"id": user.id,
			"avatar": user.avatar,
			"username": user.username,
			"name": user.name
		}).getView());
	});
	
	// Update the tableview
	$.results.data = rows;
	
	// If there was data, enable the button (maybe it was disabled)
	if (rows.length) {
		$.clearButton.enabled = true;
	}
	
};

function onClearButtonTouched(e){
	// Reset the variable
	searchHistory = [];
	
	// Clear the content of the property
	Titanium.App.Properties.setList("userSearchHistory", searchHistory);
	
	// Reset the tableView
	populateSearchHistory(searchHistory);
	
	// Disable the clear button
	$.clearButton.enabled = false;
}

function onSearchBarFocused(e){
	$.navigationMenuUserPopover.rightNavButton = null;
};

function onSearchBarBlurred(e){
	$.navigationMenuUserPopover.rightNavButton = $.clearButton;
};

// Initially populate the search history
populateSearchHistory(searchHistory);

// Focus on the textfield if there is no search history
if (!searchHistory.length) {
	// Focus on the searchBar
	$.searchBar.focus();
	// Disable the clear button
	$.clearButton.enabled = false;
}

$.results.addEventListener("click", onTableViewTouched);
$.searchBar.addEventListener("change", onSeachBarChange);
$.searchBar.addEventListener("focus", onSearchBarFocused);
$.searchBar.addEventListener("blur", onSearchBarBlurred);

// Expose these methods
exports.reveal = reveal;
exports.dismiss = dismiss;