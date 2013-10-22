migration.up = function(db) {
    db.createTable({
        "columns": {
			"id": "INTEGER PRIMARY KEY AUTOINCREMENT",
			"collection_id": "INTEGER",
            "username" : "TEXT",
            "media_id" : "TEXT",
            "media" : "TEXT"
        }
    });
};

migration.down = function(db) {
	db.dropTable();
};
