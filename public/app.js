/**********************************************************************
This is the MovieApp that will allow you to search for movie titles and
bookmark your favorites.

!!! This app will only work in modern web browsers.!!!
!!! A rewrite of some of the functions is required for older ones. !!!

Below we create a JavaScript object, this will keep the global
variables from getting crowded. This also has other benifits that will
be discussed in more detail later.
 
Think of this as a class in other languages, but you can't subclass.
The spec of ECMAScript 6 has classes that can be subclassed, but
support is just now being added to web browsers.
**********************************************************************/
var MovieApp = {
	// Wrap all functions for the app in this object, the reasons are outlined above.
	init: function() {		
		// Do a search when the "Find" button is clicked.
		$("#find").addEventListener("click", function(event) {
			// Search OMDBapi for the movie.
			MovieApp.search($("#title").value);
		}, false);
		
		// Add a message to the search list, since it has not been used yet.
		MovieApp.setItems("movieList", MovieApp.createEmptyMessage("Please search for a movie."));
		// Call the loadFavorites function.
		MovieApp.loadFavorites();
	},
	
	search: function(term) {
		// Do a search on OMDBapi for the movie title.
		
		// Get the "Find" button.
		var find = $("#find");
		
		if (find !== null) {
			// We set the button to busy to show that it is searching.
			find.className = "busy";
		}
		
		// !!! This is hardcoded for the demo, but we should define them as constants at the top of the app. !!!
		// !!! Need to add support for pages in the current OMDBapi spec for searches. !!!
		MovieApp.get("https://www.omdbapi.com", {"s": term}, function(results) {
			// We should now have data on the movies that we searched for and pass the parsed version to the list builder.
			var listItems = MovieApp.createListItems(JSON.parse(results));
			
			MovieApp.setItems("movieList", listItems);
			
			if (find !== null) {
				// We remove the busy state when we are done.
				find.className = "";
			}
		});
	},
	
	showOverlay: function(dialog) {
		// Display a dark overlay.
		if ($("#overlay") === null) {
			// We only create the overlay if it is not present.
			var overlay = $("!div");
			overlay.id = "overlay";
			overlay.addEventListener("click", function(event) {
				// Consume the click event so the overlay does not reopen if we are over the list items when we click.
				event.stopPropagation();
				MovieApp.removeOverlay();
			}, false);
			document.body.appendChild(overlay);
			
			// Delay changing the class to animate the fade to the darker background.
			// !!! This can be replaced in CSS with animation, but to show one of the many ways to do it in JavaScript it is here. !!!
			window.setTimeout(function() {
				overlay.className = "active";
			}, 10);
		}
		
		if (dialog !== null) {
			// If we have a dialog then attach it to the overlay at the top, this will allow multiple dialogs on the same overlay.
			$("#overlay").insertBefore(dialog, $("#overlay").firstChild);
		}
	},
	
	removeOverlay: function() {
		// Remove the overlay.
		if ($("#overlay") !== null) {
			// Now that we are sure that we have an overlay we will remove it.
			document.body.removeChild($("#overlay"));
		}
	},
	
	createDialog: function(title, contents) {
		// This will create a dialog that has a title.
		// !!! This dialog can't be move using the mouse, that is something that can be added later. !!!

		// Create the dialog pieces.
		var dialog = $("!div.dialog");
		// Create the titlebar, add text and add class name.
		var dialogTitle = $("!div.title", title);
		// Add contents and class name to the contents container.
		var dialogContents = $("!div.contents", contents);
		var closeButton = $("!span.close", "&#10006;");
		
		// Make sure that the dialog has a unique id.
		dialog.id = MovieApp.createUniqueID("dialog");
		dialog.addEventListener("click", function(event) {
			// consume the click event so the dialog does not close
			event.stopPropagation();
		}, false);
						
		// Make the click close this dialog.
		closeButton.addEventListener("click", function() {
			// Get the overlay.
			var overlay = $("#overlay");
			
			// remove this dialog.
			overlay.removeChild(dialog);
			
			if (overlay.childNodes.length < 1) {
				// We don't have anymore dialogs, so remove the overlay.
				MovieApp.removeOverlay();
			}
		}, false);
		
		// Attach the dialog components to the dialog.
		dialog.appendChild(dialogTitle);
		dialog.appendChild(closeButton);
		dialog.appendChild(dialogContents);
		
		return dialog;
	},
	
	createUniqueID: function(id) {
		// Create an id that is not found in the DOM.
		 
		var i = 0;
		
		// This is an internal function just for creating the id.
		function buildId(id, i) {
			// We create a new id using the base "id" and an integer "i" then convert the integer to a hex value.
			return id + "_" + i.toString(16);
		}
		
		new_id = buildId(id, i);
		
		while ($("#" + new_id) !== null) {
			// The id exists so we increase the integer until we no longer find the id.
			i++;
			new_id = buildId(id, i);
		}
		
		return new_id;
	},
	
	createDetails: function(detailsResults) {
		// We build the document for the details, see the $ function below for more details on how it is done.
		var contents = $("!div", [
			$("!h3", detailsResults.Title),
			$("!h5",  "Released: " + detailsResults.Year + ", Runtime: " + detailsResults.Runtime),
			$("!p",  "Plot: " + detailsResults.Plot),
			$("!p", "Actors: " + detailsResults.Actors),
			$("!p", "Language: " + detailsResults.Language),
			$("!p", "IMDb Rating: " + detailsResults.imdbRating + " Votes: " + detailsResults.imdbVotes)
		]);
		
		// We want the HTML string since that is what the dialog uses.
		return contents.innerHTML;
	},
	
	createListItems: function(searchResults) {
		// Create the search list from server results.
		var items = [];
		
		for (let item of searchResults.Search) {
			// Loop through the results of the search.
			
			// Create a div the contains the title and an attribute to store the IMDb id.
			var listItem = $("!div.listItem", {"data-id": item.imdbID}, item.Title);
			
			listItem.addEventListener("click", function(event) {
				// This listItem was clicked so now we need to get the movie details.
				
				// We set this to busy when it is searching.
				this.className = "listItem busy";
				// The list item was clicked, so now we query the details.
				MovieApp.get("https://www.omdbapi.com", {"i": this.getAttribute("data-id")}, function(results) {
					// We parse the JSON data.
					var data = JSON.parse(results);
					
					// Check that it is valid.
					if (data === null || data.Response === "False") {
						return;
					}
					
					// Create the details from the data.
					var details = MovieApp.createDetails(data);
					// Create a dialog to display the data.
					var dialog = MovieApp.createDialog(data.Title, details);
					
					// Create the "Favorite" button.
					var favoriteButton = $("!input", {type: "button", value: "Favorite"});
					
					favoriteButton.addEventListener("click", function() {
						// Button was clicked, so now we store the data on the server.
						MovieApp.post("/favorites", data, function(results) {
							// Now that we have the data let's build the favorites list.
							MovieApp.buildFavoritesList(results);
						});
					});
					
					// Add the "Favorites" button to the dialog.
					dialog.querySelector(".contents").appendChild(favoriteButton);
					
					// Show the overlay with the dialog on it.
					MovieApp.showOverlay(dialog);
					
					// We are done being busy.
					this.className = "listItem";
				});
			});
			
			// Add listItem to the array.
			items.push(listItem);
		}
		
		// Return the array.
		return items;
	},
	
	createFavoriteItems: function(results) {
		// Create the favorites list from the server results.
		
		// We set this to null since we are not sure if we have any item to list.
		var items = null;
		
		for (let item of results) {
			// We loop through the results.
			
			// Create the div with title and encoded data, if it is not encoded the data will cause the tag attribute to end prematurely and create random attributes.
			var listItem = $("!div.listItem", {"data-details": encodeURIComponent(JSON.stringify(item))}, item.Title);
			// Now we know we have items, so we will create an array.
			items = [];
			
			listItem.addEventListener("click", function(event) {
				// The list item was clicked, we will decode and parse the JSON data.
				var data = JSON.parse(decodeURIComponent(this.getAttribute("data-details")));
				
				// For some reason we have no data.
				if (data === null) {
					return null;
				}
				
				// Create the movie details.
				var details = MovieApp.createDetails(data);
				// Create the dialog.
				var dialog = MovieApp.createDialog(data.Title, details);
				
				// Display the dialog on the overlay.
				MovieApp.showOverlay(dialog);
			});
			
			// Add the listItem.
			items.push(listItem);
		}
		
		// Return the array of listItems.
		return items;
	},
	
	loadFavorites: function() {
		// Ask the server for the favorites list.
		MovieApp.get("/favorites", {}, function(results) {
			MovieApp.buildFavoritesList(results);
		});
	},
	
	buildFavoritesList: function(data) {
		if (data === "Error") {
			// We had an error from the server, can't build list.
			// !!! We should do more about this error, but this is just a demo. !!!
			return;
		}
		
		// Pass the parsed version of the JSON string to our function for creating a list. 
		var items = MovieApp.createFavoriteItems(JSON.parse(data));
		
		if (items === null) {
			// If we don't have any favorites then set a message.
			MovieApp.setItems("favoritesList", MovieApp.createEmptyMessage("Add a movie to your favorites."));
			return;
		}
		
		MovieApp.setItems("favoritesList", items);		
	},
	
	createEmptyMessage: function(message) {
		// This is the message when the list is empty.
		
		// Create the div for the message.
		var messageItem = $("!div.emptyMessage", message);
		
		// We wrap the messageItem in an array since the setItems function uses an array of items.
		return [messageItem];
	},
	
	setItems: function(listName, items) {
		if (listName.indexOf("#") !== 0) {
			// We don't have the proper format for searching for an id, so we will correct it here.
			listName = "#" + listName;
		}
		
		// Query for the id and return the element that matches.
		var list = $(listName);
		
		// Make sure list exists.
		if (list === null) {
			return;
		}
		
		// Remove all items from list, we don't want the old items since that would give duplicates.
		while (list.hasChildNodes()) {
			list.removeChild(list.lastChild);
		}

		// Add new items.
		for (let item of items) {
			list.appendChild(item);
		}
	},
	
	ajax: function(func) {
		// Create the HTTP object to use for AJAX requests.
		// !!! The AJAX function is incomplete, just for this demo. !!!
		var xhttp = new XMLHttpRequest();
		
		// Setup the callback for when the request is complete.
		xhttp.onreadystatechange = function() {
			// When the state changes this function will be called.
			// !!! This is an incomplete function as it will not deal with many errors. !!!
			var results;
			
			if (xhttp.readyState === 4) {
				// We have the finished state.
				if (xhttp.status === 200) {
					// We have a status of OK.
					results = xhttp.responseText;
				} else {
					// This is a catch all error, and should be improved on.
					results = "{\"Error\": \"Server response: " + xhttp.status + "\"}";
				}
				
				// We call the function that we passed in with the results.
				// !!! This could be more useful if we created an object to hold all of the response and status details of the xhttp object and not just response text. !!!
				func(results);
			}
		};
		
		return xhttp;
	},
	
	encodeParameters: function(data) {
		// Format the parameters for use in requests.
		// !!! This might not fix everything, but it should work for this demo. !!!
		
		// Use an array for a string buffer, this will make it faster and easier to create the final formatted string.
		var dataBuffer = [];
		
		for (let n in data) {
			// We are looping through all the data and creating encoded string.
			dataBuffer.push(n + "=" + encodeURIComponent(data[n]));
		}
		
		// We join the pieces of the array with the "&" 
		return dataBuffer.join("&");
	},
	
	get: function(url, data, func) {
		// Do an AJAX GET request.
		var xhttp = MovieApp.ajax(func);
				
		xhttp.open("GET", url + "?" + MovieApp.encodeParameters(data), true);
		xhttp.send(null);
	},
	
	post: function(url, data, func) {
		// Do an AJAX POST request.
		var xhttp = MovieApp.ajax(func);
		
		xhttp.open("POST", url, true);
		
		// Setup the POST request to allow data to be passed.
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send(MovieApp.encodeParameters(data));
	}
}

function $(query) {
	// This function allows the creation and selection of DOM elements using "$([query/element name])".
	if (query.indexOf("!") === 0) {
		// If the element starts with "!" then we create it.
		
		// We need to see if class names and an id are provided.
		var selectorParts = $$$.cssSelector(query.slice(1, query.length));
		
		// Create a new element.
		var elm = document.createElement(selectorParts[0]);
		
		if (selectorParts[1].length > 0) {
			// We have classes, lets set them.
			elm.className = selectorParts[1].join(" ");
		}
		
		if (selectorParts[2] !== null) {
			// We have an id, so set the as well.
			elm.id = selectorParts[2];
		}
		
		if (arguments.length > 1) {
			// Additional arguments have been provided, we should process them.
			$$$.build(elm, Array.prototype.slice.call(arguments, 1));
		}
		
		return elm;
	} else {
		// We search the DOM for all elements the match are query, uses CSS syntax.
		// !!! Older browsers might have issues with this function. !!!
		var elms = document.querySelectorAll(query);
		
		if (elms.length === 1) {
			// If we only have 1 then remove from list and return that single element.
			elms = elms[0];
		} else if (elms.length === 0) {
			// If there are no elements found to match then return null.
			elms = null;
		}
		
		return elms;
	}
}

var $$$ = {
	// Provides helper functions for the DOM and CSS selectors.
	build: function(elm, args) {
		// Modifies the element "elm" with the arguments "args" passed.
		for (let item of args) {
			switch (typeof item) {
				case "string":
					// We should have a DOM string.
					elm.innerHTML = item;
					break;
				case "object":
					// We know that we have an object, now we have to figure out what type of object.
					if (Array.isArray(item)) {
						// We have an array, so these should be DOM elements.
						for (let n of item) {
							// Add them in the order provided.
							elm.appendChild(n);
						}
					} else if (item !== null && item === Object(item)) {
						// This should be a plain object.
						for (let n in item) {
							// We will use the key "n" as the name of the attribute and the value "item[n]" as the value.
							if (typeof n === "string" && typeof item[n] === "string") {
								elm.setAttribute(n, item[n]);
							}
						}
					}
			}
		}
	},
	
	cssSelector: function(cssSelector) {
		// This processes out the classes and id from the tag name.
		var classNames = [];
		var id = null;
		var tagName = null;
		
		function stripId(item) {
			// We need to remove the id if it is present.
			var secondPass = item.split("#");
			
			if (secondPass.length > 1) {
				// We have an id lets split the tag name from the id.
				
				// We set the id.
				id = secondPass[1];
				
				// Give the tag name back.
				return secondPass[0];
			} else {
				// No id, so just pass back the tag name.
				return item;
			}
		}
		
		// We create an array that the first item is the tag name and the rest are classes, but we could have an id in any part at this point.
		var firstPass = cssSelector.split(".");
		
		// Let's strip off the first item and set that as the tag name, after we strip the id off.
		tagName = stripId(firstPass.shift());
		
		for (let item of firstPass) {
			// Now add each item, after we strip the id off.
			classNames.push(stripId(item));
		}
		
		return [tagName, classNames, id];
	}
}

window.onload = function() {
	// Initialize app after page load.
	MovieApp.init();
}