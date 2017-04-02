var express = require('express');
var router = express.Router();
var config = require('../config/config.js')
var mysql = require('mysql')

// set variable to use over and over
var connection = mysql.createConnection({
	host     : config.host,
	user     : config.username,
	password : config.password,
	database : config.database
});

// After this line runs, we will have a valid connection to MySQL
connection.connect();

// include Multer module
var multer = require('multer');
// upload is the multer module with a dest object passed to it
var upload = multer({dest: './public/images'})
// Specify the type for use later
var type = upload.single('imageToUpload');
// we will need fs to read the file. It is part of core
var fs = require('fs');

/* GET home page. */
router.get('/', (req, res, next)=>{
    var getImagesQuery = "SELECT * FROM images";

    getImagesQuery = "SELECT * FROM images WHERE id NOT IN" +
   "(SELECT imageID FROM votes WHERE ip = '"+req.ip+"');"

    connection.query(getImagesQuery, (error, results, fields)=>{
        // res.json(results);
        // Grab a random image from the results
        var randomIndex = (Math.floor(Math.random() * results.length));
        // res.json(results[randomIndex]);
        if(results.length == 0){
            res.render('index', { msg: "noImages" });
        }
        else{
            res.render('index', {
                imageToRender: results[randomIndex].imageUrl,
                imageID: results[randomIndex].id,
                msg: "testest"
            });
        }
    })

});

router.get('/vote/:voteDirection/:imageID', (req, res, next)=>{
    // res.json(req.params.voteDirection);
    var imageID = req.params.imageID;
    var voteD = req.params.voteDirection;
    if(voteD === 'up'){
        voteD = 1;
    }
    else{
        voteD = -1;
    }
    var insertVoteQuery = "INSERT INTO votes (ip, imageID, voteDirection) VALUES ('"+req.ip+"', "+imageID+", '"+voteD+"')"
    // res.send(insertVoteQuery);
    connection.query(insertVoteQuery, (error, results, fields)=>{
        if (error) throw error;
        res.redirect('/?vote=success');
    })
});

// router.get('/standings/', (req, res, next)=>{
//     // var id1 = 1;
//     // var id2 = 3
//     var imageIdVoted = 3;
//     var voteDirection = 1;
//     var insertQuery = "INSERT INTO votes (ip, imageId, voteDirection) VALUES ('?','?','?')"
//     connection.query(insertQuery, [req.ip, imageIdVoted], (error, results, fields)=>{
//         var query = "SELECT * FROM votes";
//         connection.query(query, (error, results, fields)=>{
//             res.json(results);
//         })
//     })
// });

router.get('/uploadImage', (req, res, next)=>{
    res.render('uploadImage', {});
});

// go all the way up to see what we defined type as
router.post('/formSubmit', type, (req, res, next)=>{
	// save the path where the file is at temporarily
	var tmpPath = req.file.path;
	// set up the target path + the original name of file
	var targetPath = 'public/images/' + req.file.originalname
	var targetUrl = '../images/' + req.file.originalname
	// use fs module to read the file then write it to the correct place
	fs.readFile(tmpPath, (error, fileContents)=>{
		fs.writeFile(targetPath, fileContents, (error)=>{
			if (error) throw error;
			var insertQuery = "INSERT INTO images (imageUrl) VALUE (?)"
			connection.query(insertQuery, targetUrl, (dberror, results, fields)=>{
				if (dberror) throw dberror;
				res.redirect('/?file="uploaded"')
			})
		})
	})
	// res.json(req.file)
});

router.get('/standings/', (req, res, next) => {
    var standingsQuery = `SELECT
        images.id,
        images.imageUrl,
        images.playerName,
        SUM(votes.voteDirection) as total_votes from votes
        inner join images on images.id = votes.imageID
        group by votes.imageID`;
    connection.query(standingsQuery, (error, results, fields) => {
      if (error) throw error;
      // res.json(results)
      res.render('standings', { totals: results });
  })
})

module.exports = router
