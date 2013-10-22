// Load some libraries
var NappUI = require("dk.napp.ui");
var Animator = require("/Animator");
var animation = require("alloy/animation");
var instagram = require("/instagram");
var gridHelper = require("/gridHelper");

// Init some variables we are going to use in this controller
// For some reason the line below wasn't working with get/setList
var grids = JSON.parse(Titanium.App.Properties.getString("openedGridsInNavigation", '[]')); 
var isMoving = false; // Serves as a lock for the panning
var isRemoving = false; // Serves as a lock for the removal of grids
var lastGridPosition = 0; // Servers as a reference to that last coordinate of the grid
var isShaking = false; // Serves as a lock for the shaking of grids (pinned ones)

// Hold this reference here for when the scrollableView resets his children
var transform = Titanium.UI.create2DMatrix({ scale: Alloy.Globals.triggerNavigationScale });
// Hold a reference to the "view" of the navigation menu
var navigationMenuView = $.navigationMenu.getView();

// When this method is executed, all the current grids shrink down
// and the main navigation appears
function onShowNavigation(e){
	_.each($.gridsContainer.views, function (grid, index) {
		
		grid.sleep(); // this method is exposed by the view
		
		new Animator().scale({
			view: grid,
			value: Alloy.Globals.triggerNavigationScale,
			duration: 200,
			onComplete: function(){
				grid.transform = transform;
			}
		});
		
		// This will set our grid to recieve all the settings
		// require to play nice with the container of grids	
		initGridForContainer(grid);
	});
	
	$.gridsContainer.scrollingEnabled = true;
	// Show the user know he can scroll to more views
	$.gridsContainer.showPagingControl = true;
	
	// Reveal the navigation
	animation.fadeIn(navigationMenuView);
	animation.fadeIn($.currentGridContainer);
	
	$.gridsContainer.panGesture = true;
};

// When this method is executed, all the current grids scale up
// and the main navigation disappears
function onHideNavigation(e){
	// Disable panning
	$.gridsContainer.panGesture = false;
	// Disable scrolling
	$.gridsContainer.scrollingEnabled = false;
	// Show the user know he can scroll to more views
	$.gridsContainer.showPagingControl = false;
	
	// Dismiss the navigation
	animation.fadeOut(navigationMenuView);
	animation.fadeOut($.currentGridContainer);
	
	_.each($.gridsContainer.views, function (grid, index) {
				
		new Animator().scale({
			view: grid,
			value: 1,
			duration: 100
		});
		
		grid.wakeup(); // this method is exposed by the view
		// Do some house maintance
		grid.removeEventListener("click", onHideNavigation);
	});
	
};

// Everytime we are about to create a new grid, run this method
// we should check for memory leaks in here since this is tied
// to a controller via an event
function onCreateNewGrid(e){
	pushGridToContainer(e.type, e.data, true);
};

// When we create a new grid, we should first run it by this 
// method to prepare it for our "big" container
function initGridForContainer(grid) {
	grid.transform = transform;
	grid.sleep();
	// If we click on a view, zoom into that one
	grid.addEventListener("click", onHideNavigation);
};

// This method controls what to display on top of each grid
// to tell them apart from the rest
function updateCurrentGridTitle() {
	$.currentGrid.text = gridHelper.getTitle(grids[$.gridsContainer.currentPage]);
}

// Everytime the main (big) grid container finishes scrolling
// run this method
function onNavigationScrolledEnd(e){
	// FIXME Update our "grid memory", maybe this should be elsewhere
	// because there will be a lot of cases where we are "storing this"
	// without needing to do so
	Titanium.App.Properties.setString("openedGridsInNavigation", JSON.stringify(grids));
		
	// Update the name of the view here
	updateCurrentGridTitle();
		
	// Show the name
	animation.fadeIn($.currentGridContainer);
};

// When we start touching (but not actually doing anaything) the
// main grid container, run this
function onNavigationTouchStart(e){
	// Fade out the title of the current grid in view
	animation.fadeOut($.currentGridContainer);
};

function createGridPage(type, data) {
	var data = data || null;
	
	// FIXME Let's prepare our actual gridView and the info we store to
	// display the title and stuff. We should do something better here
	// that is more "easy to debug"
	var view = Alloy.createController("gridView", { 
		"type": type, 
		"data": gridHelper.getDataByType(data, type),
		"onMinimize": onShowNavigation,
		"onMaximize": onHideNavigation
	}).getView();
	
	return view;
};

// Add a new grid to our main grid container
function pushGridToContainer(type, data, scrollToView, appendToGrids){
	if (scrollToView == null) { scrollToView = true; }
	if (appendToGrids == null) { appendToGrids = true; }
	
	var view = createGridPage(type, data);
	
	// FIXME Same as before
	if (appendToGrids) {
		grids.push({
			"type": type,
			"data": type != "location" ? data : data.title 
		});
	}
		
	// Append it to the container
	$.gridsContainer.addView(view);
	
	// Should be scroll to it?
	if (scrollToView) {
		// Apply the properties to start with
		initGridForContainer(view);
		
		// Navigate to that page
		$.gridsContainer.scrollToView(view);
	}
};

// Remove a grid from our main grid container
function popGridFromContainer(index){
	$.gridsContainer.removeView(index);
	grids.splice(index, 1);
};

// Everytime we are moving up or down the grids
function onGridPanning(e){
	// If we are not already moving the view,
	// let's move it a bit.
	// FIXME: It appears sometimes the lock is never released
	if (!isMoving) {
		// Show the user know he can scroll to more views
		$.gridsContainer.showPagingControl = false;
		isMoving = true;
		
		lastGridPosition = e.translation.y;
		
		new Animator().moveTo({ 
			"view": $.gridsContainer, 
			"value": {
				"x": 0, 
				"y": lastGridPosition
			},
			"duration": e.velocity.y / lastGridPosition,
			"onComplete": function(){
				isMoving = false;
			}
		});
		
		// Check if the window will go out of bounds (vertically)
		if (lastGridPosition < -200) {
			gridOutOfBounds("up");
		}
	}

};

// Everytime we stop moving up or down the grids
function onGridPanningEnded(e){
	
	// If the user let go on this last grid position then
	// a grid update should take place
	if (lastGridPosition > 200) {
		// Re create the same grid we have at the current page
		var currentPage = $.gridsContainer.currentPage;
		var currentPages = $.gridsContainer.views;
		var oldView = currentPages[currentPage];
		var newView = createGridPage(grids[currentPage].type, grids[currentPage].data);
		
		// Apply the properties to start with
		initGridForContainer(newView);
		
		// Replace the current view with the view "clean view"
		currentPages[currentPage] = newView;
		$.gridsContainer.views = currentPages;
		oldView = null;
	}
	
	// We still need to animate the grid back to it's position
	new Animator().moveTo({ 
		"view": $.gridsContainer, 
		"value": {
			x: 0, 
			y: 0
		},
		"duration": 100,
		"onComplete": function(){
			// Show the name
			animation.fadeIn($.currentGridContainer);
			// Show the user know he can scroll to more views
			$.gridsContainer.showPagingControl = true;
			// Reset the last position value
			lastGridPosition = 0;
		}
	});
	
};

// When the grid reaches our threshold, we know we want to remove it and 
// call this meethod 
function gridOutOfBounds(direction){
	// Remove the panning gesture (to prevent flickering)
	$.gridsContainer.panGesture = false;
	
	// Fade out the whole window
	if (!isRemoving && $.gridsContainer.currentPage != 0 && $.gridsContainer.currentPage != 1) {
		// Lock the view
		isMoving = true;
		isRemoving = true;
		
		var currentPage = $.gridsContainer.currentPage;
		var view = $.gridsContainer.views[currentPage];

		new Animator().fade({ 
			"view": view, 
			"value": 0,
			"duration": 250,
			"onComplete": function(){
				// Reset the position of the container
				new Animator().moveTo({ 
					"view": $.gridsContainer, 
					"value": {
						x: 0, 
						y: 0
					},
					"duration": 0
				});
				
				// Scroll to the previous view
				$.gridsContainer.scrollToView(currentPage-1);
				
				setTimeout(function(){
					// Tell that we finished panning
					onGridPanningEnded();
					
					// Remove the view and scroll to the previous one
					popGridFromContainer(currentPage);
					// Update the grid title
					updateCurrentGridTitle();
					// Release the lock
					isRemoving = false;
					// Re enable the pan gesture
					$.gridsContainer.panGesture = true;					
				}, 300);
			}
		});
	} else {
		if (!isShaking){
			isShaking = true;
			// Shake (with a delay) to indicate you can't remove this view
			animation.shake($.gridsContainer, 150, function(){
				isShaking = false;
				// Re enable the pan gesture
				$.gridsContainer.panGesture = true;
				
				// Tell that we finished panning
				onGridPanningEnded();
			});
		}
	}
};

// Sets up everything we need to display the app to the user
function appInit(){	
	// Create the initial grids (as default there always should be "my feed" and "my likes")
	// if none have been created before
	if (!grids.length) {
		pushGridToContainer("feed", null, false);
		pushGridToContainer("likes", null, false);
	} else {
		// Go throughå all the grids we currently have and open them
		_.each(grids, function(grid){
			pushGridToContainer(grid.type, grid.data, false, false);
		});
	}

	// Show the navigation
	onShowNavigation();

	// Add the event listeners that will update the name of the gridView
	$.gridsContainer.addEventListener("touchstart", onNavigationTouchStart);
	$.gridsContainer.addEventListener("scrollend", onNavigationScrolledEnd);
	// Add the event when we are panning the view
	$.gridsContainer.addEventListener('pan', onGridPanning);
	$.gridsContainer.addEventListener('panend', onGridPanningEnded);

	// Listen for everytime an user wnats to create a new grid
	// FIXME this needs to be a callback
	$.navigationMenu.on("shouldCreateNewGrid", onCreateNewGrid);
}

// Open the main window
$.index.open();

// Check if we are authenticated
if (instagram.isAuthorized()) {
	// Start the app
	appInit();
} else {
	instagram.init({
		"clientId": Alloy.Globals.instagram.clientId,
		"clientSecret": Alloy.Globals.instagram.clientSecret,
		"urlCallback": Alloy.Globals.instagram.urlCallback
	});
	
	// When the user logs in
	instagram.authenticate(function(e){
		// Fetch the current user information
		// we are only going to do this once
		instagram.getUserInfo("self", function(e){
			var user = JSON.parse(e.data).data;
			// Store the current user information
			instagram.setCurrentUser(user);
			// Start the app
			appInit();
		}, function(e){
			// FIXME CATCH THIS ERROR, DONT START THE APP
		});
		
	});
}

// Clean all expired cached images
var XHR = require("/xhr");
new XHR().clean();