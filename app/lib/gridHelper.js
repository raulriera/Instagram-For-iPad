/*
 * Checks the type of grid and shows an appropiate title
 */
exports.getTitle = function(grid){
	
	var title = "";
	
	switch(grid.type) {
		case "feed": {
			title = L("my_feed");
			break;
		}
		case "user": {
			title = "@" + grid.data.username;
			break;
		}
		case "hashtag": {
			title = "#" + grid.data;
			break;
		}
		case "likes": {
			title = L("my_likes");
			break;
		}
		case "collection": {
			title = grid.data.title;
			break;
		}
		default: {
			title = grid.data;
			break;
		}
	}
	
	return title;
};

exports.getDataByType = function(data, type){
	if (type == "location" || type == "user") {
		data = data.id
	} 
	
	return data;
};