Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

/*----------------------------------------------------------------------------*/

function phmmerRequest(seq, seqdb, callback) {
//    var url = "https://www.ebi.ac.uk/Tools/hmmer/search/phmmer";
    var url = "http://ves-hx-b6.ebi.ac.uk/Tools/hmmer/search/phmmer";
    var data = new FormData();
    data.append("algo", "phmmer");
    data.append("seq", seq);
    data.append("seqdb", seqdb);
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "text/html");
    request.onreadystatechange = callback.bind(this, request);
    request.send(data);
}

/*
function phmmerCallback(request) {
    if (request.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        var locationHeader = request.getResponseHeader("Location");	// searches GET headers
        console.log(locationHeader);
    }
}
*/

function phmmerCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        console.log(responseURL);
        hmmsearchRequest(responseURL, hmmsearchCallback);
    }
}

function hmmsearchRequest(resultsURL, callback) {
    var jobID = resultsURL.split("/")[6];
//    var url = "https://www.ebi.ac.uk/Tools/hmmer//search/hmmsearch?uuid=" + jobID + ".1";
    var url = "http://ves-hx-b6.ebi.ac.uk/Tools/hmmer//search/hmmsearch?uuid=" + jobID + ".1";
    console.log(url);
    var data = new FormData();
    data.append("algo", "hmmsearch");
    data.append("seqdb", "pdb");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request);
    request.send(data);
}

function hmmsearchCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        console.log(responseURL);
        phmmerResultsHMMRequest(responseURL, phmmerResultsHMMCallback);
        var hits = JSON.parse(request.response)["results"]["hits"];	// all hits, incl. high E-value
        console.log(hits);
    }
}

function phmmerResultsHMMRequest(resultsURL, callback) {
    var url = resultsURL.replace("results", "download") + "?format=hmm";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = callback.bind(this, request);
    request.send(null);
}

function phmmerResultsHMMCallback(request) {
    var phmmerResultsHMM = request.response;	// HMM from high-scoring (above threshold) phmmer search hits
//    console.log(phmmerResultsHMM);
    var phmmerResultsHMMBlob = new Blob([phmmerResultsHMM], {type: "text/plain"});
    skylignRequest("hmm", phmmerResultsHMMBlob, skylignCallback);
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

/*----------------------------------------------------------------------------*/

document.querySelector("#submitSequenceButton").onclick = function() {
    var sequence = document.querySelector("#sequenceInput").value.toUpperCase().replace(/\s+/g, "");
    console.log(sequence);
    checkInputSequence(sequence);
    phmmerRequest(sequence, "uniprotrefprot", phmmerCallback);
}

function checkInputSequence(seq) {
    var seqLength = seq.length;
    var seqUniqueCharacters = new Set(seq);
    var nucleotides = new Set("ACGT");
    if (seqLength < 10) {
        throw new Error("Input sequence must contain at least 10 characters.");
    }
    if ((seqLength === 10) && (seqUniqueCharacters.size < 6)) {
        throw new Error("At least 6 unique characters must be present in an input sequence containing exactly 10 characters.");
    }
    if ((seqLength > 10) && (seqUniqueCharacters.size === (seqUniqueCharacters.intersection(nucleotides)).size)) {
        throw new Error("At least 1 character which is not A/C/G/T must be present in an input sequence containing more than 10 characters.");
    }
}

// MERKRGRQTYTRYQTLELEKEFHFNRYLTRRRRIEIAHALSLTERQIKIWFQNRRMKWKKEN	9ant
// EQACDICRLKKLKCSKEKPKCAKCLKNNWECRYSPKTKRSPLTRAHLTEVESRLERLEQLFLLIFPREDLDMILKMDSLQ	3coq
