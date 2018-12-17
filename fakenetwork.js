var finger_table = [];

var fix_finger_table = (newUrl, cb) => {
    let isValid = false;
    for(let i = 0; i < finger_table.length; i++) {
        if(finger_table[i] === newUrl) {
            isValid = true;
            cb('url is valid');
        }
    }
    if(!isValid) {
        cb(null, newUrl);
    }
}

exports.finger_table = finger_table;
exports.fix_finger_table = fix_finger_table;