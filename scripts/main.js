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
        var hits = JSON.parse(request.response)["results"]["hits"];	// filter by evalue ?
//        console.log(hits);
        var modelLength = hits[0]["domains"][0]["aliM"];
//        console.log(modelLength);
        var phmmerWorkAlignment = [];
        for (var i = 0; i < hits.length; i += 1) {
            var domains = hits[i]["domains"];	// filter by evalue, length, overlap, fusion proteins ?
            for (var j = 0; j < domains.length; j += 1) {
                var domain = domains[j];
//                console.log(i, j, domain);
                var hmmStart = domain["alihmmfrom"];
                var alignedSeq = domain["aliaseq"];
                var seqStart = domain["alisqfrom"].toString();
                var seqName = domain["alisqname"];
                var seqEnd = domain["alisqto"].toString();
                phmmerWorkAlignment.push([".".repeat(hmmStart - 1) + alignedSeq, seqName + "/" + seqStart + "-" + seqEnd]);	// fill beginning with "-"s ?
            }
        }
//        console.log(phmmerWorkAlignment);
        var insertSeqs = phmmerWorkAlignment.filter(function(seq) {return (seq[0] !== seq[0].toUpperCase());});
//        console.log(insertSeqs);
        var seqInsertionIndexMaps = new Map();
        var maxInsertionIndexMap = new Map();
        for (var i = 0; i < insertSeqs.length; i += 1) {
            var insertSeq = insertSeqs[i][0];
//            console.log(insertSeq);
            var insertSeqName = insertSeqs[i][1];	// unique ?
//            console.log(insertSeqName);
            var matchIndex = 0;
            var insertionIndexMap = new Map();
            for (var j = 0; j < insertSeq.length; j += 1) {
                if (insertSeq[j] !== insertSeq[j].toUpperCase()) {
                    if (insertionIndexMap.has(matchIndex) === true) {
                        insertionIndexMap.set(matchIndex, insertionIndexMap.get(matchIndex) + 1);
                    } else {
                        insertionIndexMap.set(matchIndex, 1);
                    }
                } else {
                    matchIndex += 1;
                }
            }
//            console.log(insertionIndexMap);
            seqInsertionIndexMaps.set(insertSeqName, insertionIndexMap);
            for (var [index, count] of insertionIndexMap.entries()) {
                if (maxInsertionIndexMap.has(index) === true) {
                    if (count > maxInsertionIndexMap.get(index)) {
                        maxInsertionIndexMap.set(index, count);
                    }
                } else {
                    maxInsertionIndexMap.set(index, count);
                }
            }
        }
//        console.log(seqInsertionIndexMaps);
//        console.log(maxInsertionIndexMap);
        var insertionPositionIndices = Array.from(maxInsertionIndexMap.keys()).sort(function (a, b) {return (a - b);}).reverse();
        var insertionPositionIndicesNormal = Array.from(maxInsertionIndexMap.keys()).sort(function (a, b) {return (a - b);});
        var totalInsertionLength = 0;
        for (var insertionLength of maxInsertionIndexMap.values()) {
            totalInsertionLength += insertionLength;
        }
//        console.log(totalInsertionLength);
        var totalAlignmentLength = modelLength + totalInsertionLength;
//        console.log(totalAlignmentLength);
        var phmmerFinalAlignment = [];
        for (var [seq, name] of phmmerWorkAlignment) {
            var tempSeq = Array.from(seq + ".".repeat(totalAlignmentLength - seq.length));	// fill end with "-"s ?
            if (tempSeq.join("") === tempSeq.join("").toUpperCase()) {
                for (var index of insertionPositionIndices) {
                    tempSeq.splice(index, 0, ".".repeat(maxInsertionIndexMap.get(index)));
                }
            } else {
                var seqInsertionIndexMap = seqInsertionIndexMaps.get(name);
//                console.log(seqInsertionIndexMap);
                var indexOffset = 0;
                var seqIndexOffsetMap = new Map();
                for (var index of insertionPositionIndicesNormal) {
                    seqIndexOffsetMap.set(index, indexOffset);
                    if (seqInsertionIndexMap.has(index) === true) {
                        indexOffset += seqInsertionIndexMap.get(index);
                    }
                }
//                console.log(seqIndexOffsetMap);
                for (var index of insertionPositionIndices) {
                    if (seqInsertionIndexMap.has(index) === true) {
                        var insertionCount = seqInsertionIndexMap.get(index);
                        tempSeq.splice(index + seqIndexOffsetMap.get(index) + insertionCount, 0, ".".repeat(maxInsertionIndexMap.get(index) - insertionCount));
                    } else {
                        tempSeq.splice(index + seqIndexOffsetMap.get(index), 0, ".".repeat(maxInsertionIndexMap.get(index)));
                    }
                }
            }
            phmmerFinalAlignment.push([tempSeq.join("").slice(0, totalAlignmentLength), name]);
        }
//        console.log(phmmerFinalAlignment);
        var phmmerFinalAlignmentString = "";
        for (var [seq, name] of phmmerFinalAlignment) {
            phmmerFinalAlignmentString += name + " " + seq + "\n";	// align seq strings ?
        }
//        console.log(phmmerFinalAlignmentString);
        hmmerRequest("hmmsearch", phmmerFinalAlignmentString, "pdb", hmmsearchCallback);	// 500 if phmmer against uniprotrefprot
        var phmmerFinalAlignmentStringBlob = new Blob([phmmerFinalAlignmentString], {type: "text/plain"});
        skylignRequest("observed", phmmerFinalAlignmentStringBlob, skylignCallback);
    }
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
        console.log(JSON.parse(request.response));
    }
}

document.querySelector("#submitSequenceButton").onclick = function() {
    var sequence = document.querySelector("#sequenceInput").value.toUpperCase();
    console.log(sequence);
    hmmerRequest("phmmer", sequence, "pdb", phmmerCallback);
}

// MERKRGRQTYTRYQTLELEKEFHFNRYLTRRRRIEIAHALSLTERQIKIWFQNRRMKWKKEN
