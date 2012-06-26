(function () {
	//"use strict";
	var chunk = 272144;
	var socket = io.connect('http://localhost:3000')
		, file
		, output = document.getElementById('output')
		, fileReader = new FileReader();

	var fileChosen = function(evnt) {
		file = evnt.target.files[0];
	};

	var startUpload = function(e) {
		e.preventDefault();
		fileReader.onload = function(evnt) {
			console.log('uploading');
			socket.emit('upload', { 
				name : file.name,
				data : evnt.target.result
			});
		};
		socket.emit('start', { 
			'name' : file.name, 
			'size' : file.size
		});
	};

	socket.on('reqChunk', function(data){
		console.log('reqChunk');
		var place = data.offset * chunk; //The Next Blocks Starting Position
		var blob = new Blob([file], {"type" : file.type});
		var nFile = blob.slice(place, place + Math.min(chunk, (file.size-place)));
		fileReader.readAsBinaryString(nFile);
	});

	socket.on('message', function(data) {
		output.innerHTML += '<li>' + data.message + ' ' + data.name + '</li>';
		if(data.data)
			output.innerHTML += '<li>chunk: ' + data.chunk + '/' + parseInt(data.chunkCount, 10) +'</li>';
			progress(data.chunk/parseInt(data.chunkCount, 10));
		if(data.size)
			output.innerHTML += '<li>size: ' + data.chunk * chunk + '/' + data.size + '</li>';
	});

	var progress = function(p) {
		var bar = document.querySelector('.bar');
		bar.style.width = p*100 + '%';
		bar.innerText =  p*100 + '%';
		if(p==1) {
			bar.parentElement.className = 'progress progress-success progress-striped active';
			bar.innerText = 'Done !';
		}
	};

	if(window.File && window.FileReader){
		document.getElementById('submit').addEventListener('click', startUpload);
		document.getElementById('file').addEventListener('change', fileChosen);
	} else {
		document.getElementById('message').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
	}

}());
