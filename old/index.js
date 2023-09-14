const keys = require("./keys");
const alg = require("./algorithms");

// Express Application setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres client setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: '5432'
});

pgClient.on("connect", client => {
  client
    .query("CREATE TABLE IF NOT EXISTS users (first_name TEXT, last_name TEXT)")
    .catch(err => console.log("PG ERROR. CONNECT :(", err));
});

//Express route definitions
app.get("/", (req, res) => {
  res.send("Hello there. This is your back end. Please go to /users to view the users table.");
});

// get the values
app.get("/users", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM users");
  res.send(values.rows);
});

app.get('/checkUniqueEmail', async(req, res) => {
  try {
    const values = await pgClient.query('SELECT email FROM users WHERE email = $1', [req.query.email]);
    if (values['rowCount'] == 0) {
      return res.json({status: 0});
    } else {
      return res.json({status: -1});
    }
  } catch {

  }
})

//query for login checking
app.get("/getUser", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM users WHERE email = $1", [req.query.email]);
  res.send(values.rows);
});

app.post("/addUser", async (req, res) => {
  if (!req.body.value) res.send({ working: false });
  const encodedPass = bcrypt.hashSync(req.body.password, 10);
  pgClient.query("INSERT INTO users VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)", [req.body.first, req.body.last, req.body.email, encodedPass, req.body.now, req.body.is_enabled, req.body.now, req.body.is_admin, req.body.username]);
});

app.get("/submissions", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM submissions");
  res.send(values.rows);
});

const multer = require('multer');
const logger = require('morgan');
const serveIndex = require('serve-index');
const path = require('path');
const { max } = require("@tensorflow/tfjs");
const debug = require('debug')('myapp:server');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage });

app.post('/addSubmission', upload.single('file'), function(req,res) {
  debug(req.file);
  console.log('storage location is', req.hostname +'/' + req.file.path);
  return res.send(req.file);
});

var challengeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './challenges')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const challengeUpload = multer({ storage :challengeStorage});

app.post('/addChallengeKey', challengeUpload.single('file'), async function(req,res) {
  debug(req.file);
  console.log('storage location is', req.hostname +'/' + req.file.path);  
  return res.send(req.file);
});


app.post("/addSubmissionInfo", async (req, res) => {
  if (!req.body.value) res.send({ working: false });
  pgClient.query("INSERT INTO submissions VALUES($1, DEFAULT, $2, $3, $4, $5, $6)", [req.body.fileName, req.body.now, req.body.challenge_id, req.body.is_public, req.body.user_id, req.body.score]);
});

app.get("/getTargetUserInfo", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM users WHERE email = $1", [req.query.email]);
  res.send(values.rows);
});

app.post("/updateTargetUser", async (req, res) => {
  if (!req.body.value) res.send({ working: false });
  pgClient.query("UPDATE users SET is_enabled = $1, is_admin = $2, status_date = $4 WHERE email = $3", [req.body.is_enabled, req.body.is_admin, req.body.email, req.body.now]);
});

app.post("/changePassword", async (req, res) => {
  if (!req.body.value) res.send({ working: false });
  const encodedPass = bcrypt.hashSync(req.body.password, 10);
  pgClient.query("UPDATE users SET password = $2, password_date = $3 WHERE email = $1", [req.body.email, encodedPass, req.body.now]);
});

app.get("/getLeaderboardInfo", async (req, res) => {
  const testFlag = req.query.testFlag;
  if(testFlag == "rsq" || testFlag == "fscore" || testFlag == "recall"){
    const values = await pgClient.query("SELECT username, MAX(score) FROM users JOIN submissions ON users.user_id = submissions.user_id WHERE challenge_id = $1 AND is_public = true OR submissions.user_id = $2 AND challenge_id = $1 GROUP BY username ORDER BY MAX(score) ASC", [req.query.CID, req.query.UID])
    res.send(values.rows);
  }
  else if(testFlag == "MAE" || testFlag == "rmse_c" || testFlag == "mse_c"){
    const values = await pgClient.query("SELECT username, MIN(score) FROM users JOIN submissions ON users.user_id = submissions.user_id WHERE challenge_id = $1 AND is_public = true OR submissions.user_id = $2 AND challenge_id = $1 GROUP BY username ORDER BY MIN(score) ASC", [req.query.CID, req.query.UID])
    res.send(values.rows);
  }
});

app.get("/createChallengeEntry", async (req, res) => {

  await pgClient.query("INSERT INTO challenges VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)", [req.query.author, req.query.desc, req.query.pubStartDate, req.query.pubEndDate, req.query.priStartDate, req.query.priEndDate, req.query.algoType, req.query.challengeName, req.query.challengeTimeLimit]);
  
  // return 
  const values = await pgClient.query("SELECT challenge_id FROM challenges ORDER BY challenge_id DESC LIMIT 1")
  res.send(values.rows);
});

app.get("/getRemainingSubmissions", async (req, res) => {
  // return 
  const numSubmissions = await pgClient.query("SELECT COUNT(*) num_submissions FROM submissions WHERE user_id = $1 AND challenge_id = $2", [req.query.user_id, req.query.challenge_id]);
  const maxSubmissions = await pgClient.query("SELECT max_submissions FROM challenges WHERE challenge_id = $1",[req.query.challenge_id]);

  const subCount = parseInt(numSubmissions.rows[0]['num_submissions']);
  const maxCount = parseInt(maxSubmissions.rows[0]['max_submissions']);
  var submissionsLeft = maxCount - subCount;
  if (subCount < maxCount) {
    return res.json({status: 0, submissions_left: submissionsLeft})
  } else {
    return res.json({status: -1, user_sub: subCount, max_sub: maxCount})
  }
});



app.get("/getSubmissionID", async (req, res) => {
  const values = await pgClient.query("SELECT submission_id FROM submissions WHERE user_id = $1 ORDER BY submission_id DESC LIMIT 1", [req.query.UID])
  res.send(values.rows);
});

app.get("/getTestFlag", async (req, res) => {
  const values = await pgClient.query("SELECT testFlag FROM challenges WHERE challenge_id = $1", [req.query.CID]);
  res.send(values.rows);
});

app.get("/getDates", async (req, res) => {
  const values = await pgClient.query("SELECT public_end_date, private_end_date FROM challenges WHERE challenge_id = $1", [req.query.CID]);
  res.send(values.rows);
});

app.get("/getChallengeInfo", async (req, res) => {
  const values = await pgClient.query("SELECT author, description, challenge_name, public_start_date, public_end_date, private_start_date, private_end_date FROM challenges WHERE challenge_id = $1", [req.query.CID]);
  res.send(values.rows);
});

app.get("/challenges", async (req, res) => {
  const values = await pgClient.query("SELECT challenge_id, challenge_name FROM challenges ");
  res.send(values.rows);
});

app.get("/downloadSampleFile", async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=' + req.query.CID + '_sample.csv');
  res.download('challenges/' + req.query.CID + '_sample.csv');
});


//getting files and reading
app.post("/computeScore", (req, res) => {
  var testFlag = req.body.testFlag;
  var submission_id = req.body.submission_id;
  var CID = req.body.CID;

  const csv = require('csv-parser')
  const fs = require('fs');
  var pResults = [];
  var aResults = [];
  var predicted = [];
  var actual = [];

  // Will most likely put into funciton and pass in a file name parameter to change temp.csv out with
  // install: npm install csv-parser
  fs.createReadStream('./uploads/' + submission_id +'_upload.csv').pipe(csv())
    .on('data', (data) => {
      pResults.push(data);
    }) 
    .on('end', () =>{
      for(let i = 0; i < pResults.length; i++){
        var curString = JSON.stringify(pResults[i]);
        curString = curString.replaceAll("}", "");
        curString = curString.replaceAll("\"", "");
        var curRow = curString.split(/,|:/);

        predicted.push(parseInt(curRow[3]));
      }

  });

  // getting key to compare to
  var keyName = "./challenges/" + CID + "_key.csv"

  setTimeout(() =>
  fs.createReadStream(keyName).pipe(csv())
  .on('data', (data) => {
    aResults.push(data);
  }) 
  .on('end', () =>{

    for(let i = 0; i < aResults.length; i++){
      var curString = JSON.stringify(aResults[i]);
      curString = curString.replaceAll("}", "");
      curString = curString.replaceAll("\"", "");
      var curRow = curString.split(/,|:/);

      actual.push(parseInt(curRow[3]));
    }

    //check for flags on what tests to run
    switch(testFlag){
      case "rmse_c":{
        var score = alg.rmse_c(actual, predicted);
        var tempScore = score.toPrecision(2);
        pgClient.query("UPDATE submissions SET score = $1 WHERE submission_id = $2", [score, submission_id]);
        break;
      }
      case "MAE":{
        var score = alg.calculateMeanAbsoluteError(actual, predicted);
        var tempScore = score.toPrecision(2);
        pgClient.query("UPDATE submissions SET score = $1 WHERE submission_id = $2", [score, submission_id]);
        break;
      }
      case "mse_c":{
        var score = alg.mse_c(actual, predicted);
        var tempScore = score.toPrecision(2);
        pgClient.query("UPDATE submissions SET score = $1 WHERE submission_id = $2", [score, submission_id]);
        break;
      }
      case "rsq":{
        var score = alg.rsq(actual, predicted);
        var tempScore = parseFloat(score.toPrecision(2));
        pgClient.query("UPDATE submissions SET score = $1 WHERE submission_id = $2", [tempScore, submission_id]);
        break;
      }
      case "fscore":{
        var score = alg.fscore(actual, predicted);
        var tempScore = score.toPrecision(2);
        pgClient.query("UPDATE submissions SET score = $1 WHERE submission_id = $2", [score, submission_id]);
        break;
      }
      //not completely functional yet
      case "recall":{
        var score = alg.recallTest(actual, predicted);
        var tempScore = score.toPrecision(2);
        pgClient.query("UPDATE submissions SET score = $1 WHERE submission_id = $2", [score, submission_id]);
        break;
      }
    }

  }), 5000);
});

app.listen(5000, err => {
  console.log("Listening on port 5000");
});
