function hmmerRequest(algo, seq, seqdb, callback) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/search/" + algo;
    var data = new FormData();
    data.append("algo", algo);
    data.append("seq", seq);
    data.append("seqdb", seqdb);
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request);
    request.send(data);
}

function phmmerCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        console.log(responseURL);
        phmmerAlignmentRequest(responseURL, phmmerAlignmentCallback);
    }
}

function phmmerAlignmentRequest(resultsURL, callback) {
    var url = resultsURL.replace("results", "download") + "?format=stockholm";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.setRequestHeader("Accept", "x-application/x-gzip");
    request.onload = callback.bind(this, request);
    request.send(null);
}

function phmmerAlignmentCallback(request) {
    var uint8 = new Uint8Array(request.response);
    var gunzip = new Zlib.Gunzip(uint8);
    var charCodes = gunzip.decompress();
    var phmmerAlignmentString = "";
    for (var charCode of charCodes) {
        phmmerAlignmentString += String.fromCharCode(charCode);
    }
//    console.log(phmmerAlignmentString);	// remove header ?
    hmmerRequest("hmmsearch", phmmerAlignmentString, "pdb", hmmsearchCallback);	// 500 if phmmer against uniprotrefprot
    var phmmerAlignmentStringBlob = new Blob([phmmerAlignmentString], {type: "text/plain"});
    skylignRequest("observed", phmmerAlignmentStringBlob, skylignCallback);
}

function hmmsearchCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        console.log(responseURL);
    }
}

function skylignRequest(processing, file, callback) {
    var url = "http://skylign.org/";
    var data = new FormData();
    data.append("processing", processing);
    data.append("file", file);
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request);
    request.send(data);
}

function skylignCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = JSON.parse(request.response)["url"];
        console.log(responseURL);
    }
}

document.querySelector("#submitSequenceButton").onclick = function() {
    var sequence = document.querySelector("#sequenceInput").value.toUpperCase();
    console.log(sequence);
    hmmerRequest("phmmer", sequence, "pdb", phmmerCallback);
}

// MERKRGRQTYTRYQTLELEKEFHFNRYLTRRRRIEIAHALSLTERQIKIWFQNRRMKWKKEN
