var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require('path');
/* GET home page. */
router.get('/getData/:id', function(req, res, next) {
	
	fs.readFile('/home/systemlaybare/public_html/node/apis/public/data/'+req.params.id+'.txt' , (err, data) => {
	      
	    if (err) {
	    	console.log('error in file opening.');
	    	return res.json({result:"failed",data:err});
		}

	    try {
	        JSON.parse(data);
	    } catch (e) {
	    	return console.log('invalid json.');
	    }

		var content = JSON.parse(data);

		res.json({result:"success",data:content});
	});
});


/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

module.exports = router;
