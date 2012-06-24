
/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes');

var app = module.exports = express.createServer()
	, io = require('socket.io').listen(app).set('log level', 1)
	, fs = require('fs')
	, exec = require('child_process').exec
	, util = require('util')
	, files = {};

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

io.sockets.on('connection', function(socket){

	socket.on('start', function(data){
		socket.emit('message', createMessage(data, 'start'));
		if(!files[data.name])
			files[data.name] = {
				name : data.name,
				size: data.size,
				chunk: 0,
				chunkCount: data.size/524288,
				content: '',
				latestChunk : ''
			};
		socket.emit('reqChunk', {
			offset: files[data.name].chunk
		});
	});

	socket.on('upload', function(data){
		socket.emit('message', createMessage(files[data.name], 'upload'));
		files[data.name].chunk++;
		files[data.name].content += data.data;
		files[data.name].latestChunk = data.data;
		if(files[data.name].chunk < files[data.name].chunkCount) {
				socket.emit('reqChunk', {
					offset: files[data.name].chunk
				});
		}
	});

});

function createMessage(data, evnt) {
	return {
			message: evnt + ' started',
			name: data.name || 0,
			size: data.size || 0,
			data: data.content || 0,
			chunk: data.chunk || 0,
			chunkCount: data.chunkCount,
			latestChunk: data.latestChunk || 0
	};
}

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
