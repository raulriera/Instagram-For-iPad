exports.definition = {

    config : {
        "columns" : {
			"id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "username" : "TEXT",
            "title": "TEXT",
			"count": "INTEGER"
        },
		"defaults": {
			"count": 0
		},
        "adapter" : {
            "type" : "sql",
            "collection_name" : "collections",
			"idAttribute": "id"
        }
    },

   extendCollection : function(Collection) {
        _.extend(Collection.prototype, {
			
			// Return all my collections
			index: function(_options) { debugger;
				 var self = this;
				 
				 // Construct the SQL we are going to need here
				 var query = {
                     "statement" : 'SELECT * FROM collections WHERE username = ?',
                     "params" : [_options.username]
                 };
				 				 
				 self.fetch({
					 "query": query
				 });
			},
			// Return a collection
			show: function(_options) { debugger;
				 var self = this;
				 
				 // Construct the SQL we are going to need here
				 var query = {
                     "statement" : 'SELECT * FROM collections WHERE username = ? AND id = ?',
                     "params" : [_options.username, _options.collectionId]
                 };
				 				 
				 self.fetch({
					 "query": query
				 });
			}		
        });
        // end extend

        return Collection;
    }
}