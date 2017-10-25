var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var con = {
  host: "localhost",
  user: "systemla_new",
  password: "Ha_sBmW&GfTM",
  database: "systemla_appointment"
};
var db;
/* GET users listing. */
router.get('/:id', function(req, res, next) {

	var connection;

	function handleDisconnect() {
	  db = mysql.createConnection(con); // Recreate the connection, since
	                                                  // the old one cannot be reused.

	  db.connect(function(err) {              // The server is either down
	    if(err) {                                     // or restarting (takes a while sometimes).
	      console.log('error when connecting to db:', err);
	      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
	    }

	    if(req.params !== undefined)
	    if(req.params.id !== undefined){
	    	db.query("SELECT * FROM branched WHERE branch_id="+ req.params.id, function (err, result, fields) {
		    if (err) throw err;
		    	var f = 'queuing_original';

		    	if(req.params.id ==230)
		    		f = 'queuing';

		    	if(result.length>0)
		    		res.render(f,{branch_name:result[0].name,rooms:result[0].rooms, id:result[0].branch_id});
		    	else
		    		res.send("Branch Not found");
		  	});
	    }

	                                         // to avoid a hot loop, and to allow our node script to
	  });                                     // process asynchronous requests in the meantime.
	                                          // If you're also serving http, display a 503 error.
	  db.on('error', function(err) {
	    console.log('db error', err);
	    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
	      handleDisconnect();                         // lost due to either server restart, or a
	    } else {                                      // connnection idle timeout (the wait_timeout
	      throw err;                                  // server variable configures this)
	    }
	  });
	}

	handleDisconnect();

});

module.exports = router;
