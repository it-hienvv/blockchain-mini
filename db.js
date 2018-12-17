var sqlite3 = require('sqlite3').verbose();
var defaultMode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

var db = new sqlite3.Database('sqlite3.db', defaultMode, function(err) {
  if (err) {
    console.log('Error opening database:', err, err.stack);
    callback(err);
    return;
  }
  console.log('Database was opened successfully');
});


exports.db = db;

function closeDB() { db.close(); }
exports.closeDB = closeDB;

var exec = require('child_process').exec;

exec("sqlite3 sqlite3.db < byteball.sql ", (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
  
    console.log(`Number of files ${stdout}`);
});
