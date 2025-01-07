var fs = require('fs');
var request = require("request");

var user = YOUR_USER_ID;
var pass = YOUR_PASSWORD;

var message, box;
var reg = /((\d{1,3}\.){3}\d{1,3})/;

var log = function log(text) {
	fs.appendFileSync('DavidG.log', (new Date).toLocaleString() + ' : <' + text + '>\r\n');
};

var errorLog = function errorLog(func, error) {
	log('error : <func :<' + func + '> error : <' + error + '>>');
};

var getSettings = function getSettings() {
	log('function <getSettings> start');
	try {
		var settings = JSON.parse(fs.readFileSync('settings.json'));
		message = settings.message;
		box = settings.box;
	} catch (e) {
		errorLog('getSettings', e);
	}
	log('settings successfully got, settings : <message : <' + message + '>, box : <' + box + '>>');
}

var getSaved = function getSaved() {
	log('function <getSaved> start');
	var IP;
	try {
		IP = fs.readFileSync('IP.dat');
	} catch (e) {
		errorLog('getSaved', e.code);
		return null;
	}
	log('savedIP successfully got <' + IP + '>');
	return IP;
};

var save = function save(IP) {
	log('function <save> start, IP : <' + IP + '>');
	fs.writeFileSync('IP.dat', IP);
	log('IP successfully saved');
};

var getIP = function getIP(cb) {
	log('function <getIP> start');
	request.get(
		box,
		function(err, res, body) {
			var match, IP, logFile;
			if (err)
				return errorLog('getIP', 'cannot get IP, error : <' + err + '>');
			match = reg.exec(body);
			if (!match || !(IP = match[1])) {
				logFile = 'body.' + Date.now() + '.html';
				fs.writeFileSync(logFile, body);
				errorLog('getIP', 'cannot find IP, body saved in : <' + logFile + '>');
				return null;
			}
			log('IP successfully got, IP : <' + IP + '>');
			cb(IP);
		}
	);
};

var sendSMS = function sendSMS(text) {
	log('function <sendSMS> start');
	request.get(`https://smsapi.free-mobile.fr/sendmsg?user=${user}&pass=${pass}&msg=` + encodeURIComponent(text),
		function(err, res, body) {
			if (res.statusCode !== 200)
				return errorLog('sendSMS', res.statusCode);
			log('SMS successfully sent : <' + text + '>');
		}
	);
};

var surveille = function surveille() {
	log('function <surveille> start');
	getIP(function(IP) {
		if (IP == lastIP) return log('no new IP detected');
		log('new IP detected : <last : <' + lastIP + '> ;current : <' + IP + '>>');
		save(IP);
		lastIP = IP;
		sendSMS(message + IP);
		log('function <surveille> end');
	});
};

log('---------------------------------------------------------------------------------');
log('DavidG start now');
log('---------------------------------------------------------------------------------');
getSettings();
var lastIP = getSaved();
setInterval(surveille, 10 * 60 * 1000);
surveille();
