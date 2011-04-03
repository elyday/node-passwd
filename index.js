var fs = require('fs');
var spawn = require('child_process').spawn;

function generateSalt (n) {
    var salt = [];
    var alphabet = "abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < n; i++) salt.push(alphabet[parseInt(Math.random()*alphabet.length)]);
    return salt.join('');
}

exports.shadowPass = function (pass, cb) {
    var salt = generateSalt(8);
    var openssl = spawn('openssl', ['passwd', '-1', '-salt', salt, pass]);
    openssl.stdout.on('data', function (buf) {
        cb(buf.toString().slice(0,-1));
    });
}

exports.add = function (username, pass, opts) {
    var opts = opts || {};
    exports.shadowPass(pass, function (shadowPass) {
        var useraddOpts = [];
        if (opts.createHome) useraddOpts.push('-m');
        if (opts.group) useraddOpts = useraddOpts.concat(['-g', opts.group]);
        useraddOpts = useraddOpts.concat(['-p', shadowPass]);
        console.log(useraddOpts);
        var useradd = spawn('useradd', useraddOpts);
    });
}

exports.del = function (username) {
    spawn('userdel', [username]);
}

exports.getAll = getUsers;

exports.get = function (username, cb) {
    getUsers(function (users) {
        users.forEach(function (user) {
            if (user.username == username) {
                cb(user);
                return;
            }
        });
    });
}

function getUsers (cb) {
    fs.readFile('/etc/passwd', function (err, users) {
        if (err) throw err;
        cb(users.split('\n').map(function (user) {
            var fields = user.split(':');
            return {
                username : fields[0],
                password : fields[1],
                userId : fields[2],
                groupId : fields[3],
                name : fields[4],
                homedir : fields[5],
                shell : fields[6]
            }
        }));
    });
}

