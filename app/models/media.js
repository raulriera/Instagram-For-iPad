exports.definition = {

    config : {
        "columns" : {
			"id": "INTEGER PRIMARY KEY AUTOINCREMENT",
			"collection_id": "INTEGER",
            "username" : "TEXT",
            "media_id" : "TEXT",
            "media" : "TEXT"
        },
        "adapter" : {
            "type" : "sql",
            "collection_name" : "media",
			"idAttribute": "id",
        }
    },
	
    extendCollection : function(Collection) {
         _.extend(Collection.prototype, {
			
  			// Return all collections where this media is included
  			index: function(_options) { debugger;
  				 var self = this;
				 
  				 // Construct the SQL we are going to need here
  				 var query = {
                       "statement" : 'SELECT media FROM media WHERE collection_id = ? AND username = ? ORDER BY id DESC',
                       "params" : [_options.collectionId, _options.username]
                   };
				 				 
  				 self.fetch({
  					 "query": query
  				 });
  			},
			deleteAll : function(_options) {
                var collection = this;

                var sql = "DELETE FROM " + collection.config.adapter.collection_name + " WHERE username = '" + _options.username + "' AND collection_id = " + _options.collectionId;
								
                db = Ti.Database.open(collection.config.adapter.db_name);
                db.execute(sql);
                db.close();

                collection.trigger('sync');
            },
 			// Check if a media is already in a collection
 			isAlreadyInCollection: function(_options) { debugger;
 				 var self = this;
				 
 				 // Construct the SQL we are going to need here
 				 var query = {
                      "statement" : 'SELECT id, collection_id, media_id FROM media WHERE media_id = ? AND collection_id = ? AND username = ?',
                      "params" : [_options.mediaId, _options.collectionId, _options.username]
                  };
				 				 
 				 self.fetch({
 					 "query": query
 				 });
 			},
 			// Return all collections where this media is included
 			includedCollections: function(_options) { debugger;
 				 var self = this;
				 
 				 // Construct the SQL we are going to need here
 				 var query = {
                      "statement" : 'SELECT id, collection_id, media_id FROM media WHERE media_id = ? AND username = ?',
                      "params" : [_options.mediaId, _options.username]
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