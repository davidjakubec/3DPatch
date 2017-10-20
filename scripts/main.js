"use strict";

/*----------------------------------------------------------------------------*/

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

/*
function printToInfoBox(text, wipe = false) {
    var infoBox = document.getElementById("infoBox");
    var newParagraph = document.createElement("p");
    var newParagraphText = document.createTextNode(text);
    newParagraph.appendChild(newParagraphText);
    if (wipe === true) {
        infoBox.textContent = null;
    }
    infoBox.appendChild(newParagraph);
}
*/

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

function phmmerCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        console.log(responseURL);
        var jobID = responseURL.split("/")[6];
        checkSignificantHitsRequest(jobID, checkSignificantHitsCallback);
    }
}

function checkSignificantHitsRequest(jobID, callback) {
//    var url = "https://www.ebi.ac.uk/Tools/hmmer/results/" + jobID + "?range=1,1&ali=0&output=json";
    var url = "http://ves-hx-b6.ebi.ac.uk/Tools/hmmer/results/" + jobID + "?range=1,1&ali=0&output=json";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = callback.bind(this, request, jobID);
    request.send(null);
}

function checkSignificantHitsCallback(request, jobID) {
    var topResultsStats = JSON.parse(request.response)["results"]["stats"];
    if (Number(topResultsStats["nhits"]) === 0) {
        throw new Error("No hits were found using phmmer search.");
    }
    if (Number(topResultsStats["nincluded"]) === 0) {
        throw new Error("No significant hits were found using phmmer search.");
    }
    hmmsearchRequest(jobID, hmmsearchCallback);
}

function hmmsearchRequest(jobID, callback) {
//    var url = "https://www.ebi.ac.uk/Tools/hmmer//search/hmmsearch?uuid=" + jobID + ".1";
    var url = "http://ves-hx-b6.ebi.ac.uk/Tools/hmmer//search/hmmsearch?uuid=" + jobID + ".1";
//    console.log(url);
    var data = new FormData();
    data.append("algo", "hmmsearch");
    data.append("seqdb", "pdb");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request, jobID);
    request.send(data);
}

function hmmsearchCallback(request, jobID) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        console.log(responseURL);
        var hits = JSON.parse(request.response)["results"]["hits"];	// all hits, incl. high E-value
//        console.log(hits);
        if (hits.length === 0) {
            throw new Error("No structures were found using hmmsearch.");
        }
        window.hmmsearchDomainAlignments = [];
        for (var hit of hits) {
            var domains = hit["domains"];
            for (var domain of domains) {
                var aliSeq = domain["aliaseq"];
                var hmmStart = domain["alihmmfrom"];
                var hmmEnd = domain["alihmmto"];
                var seqStart = domain["alisqfrom"];
                var seqName = domain["alisqname"];
                var seqEnd = domain["alisqto"];
                hmmsearchDomainAlignments.push([aliSeq, hmmStart, hmmEnd, seqStart, seqName, seqEnd]);
            }
        }
//        console.log(hmmsearchDomainAlignments);
        phmmerResultsHMMRequest(responseURL, phmmerResultsHMMCallback);
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 400)) {
//        throw new Error("400 Bad Request hmmsearch error.");
        console.log("400 Bad Request hmmsearch error, trying again ...");
        hmmsearchRequest(jobID, hmmsearchCallback);
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
    window.phmmerResultsHMMBlob = new Blob([phmmerResultsHMM], {type: "text/plain"});
    alignInputToHMMRequest(inputSequence, phmmerResultsHMM, alignInputToHMMCallback);
}

function alignInputToHMMRequest(seq, hmm, callback) {
    var url = "https://wwwdev.ebi.ac.uk/Tools/hmmer/align";
    var data = new FormData();
    data.append("seq", ">seq\n" + seq);
    data.append("hmm", hmm);
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "text/plain");
    request.onreadystatechange = callback.bind(this, request);
    request.send(data);
}

function alignInputToHMMCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var alignedInputSequence = request.response.split("\n")[2].split(/\s+/)[1];
//        console.log(alignedInputSequence);
        skylignURLRequest(phmmerResultsHMMBlob, skylignURLCallback);
    }
}

function skylignURLRequest(file, callback) {
    var url = "http://skylign.org/";
    var data = new FormData();
    data.append("file", file);
    data.append("processing", "hmm");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request);
    request.send(data);
}

function skylignURLCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = JSON.parse(request.response)["url"];
        console.log(responseURL);
        skylignLogoRequest(responseURL, skylignLogoCallback);
    }
}

function skylignLogoRequest(resultsURL, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", resultsURL, true);
    request.setRequestHeader("Accept", "application/json");
    request.onload = callback.bind(this, request);
    request.send(null);
}

function skylignLogoCallback(request) {
    var logo = JSON.parse(request.response);
//    console.log(logo);
    var informationContentProfile = [];
    for (var i = 0; i < logo["height_arr"].length; i += 1) {
        var positionLetterHeights = logo["height_arr"][i];
        var positionInformationContent = (positionLetterHeights.map(function (letter) {return Number(letter.split(":")[1]);})).reduce(function (a, b) {return a + b;}, 0);
        informationContentProfile.push(positionInformationContent);
    }
//    console.log(informationContentProfile);
    var maxObservedInformationContent = informationContentProfile.reduce(function (a, b) {return Math.max(a, b);});
    var maxTheoreticalInformationContent = Number(logo["max_height_theory"]);
    var normalizedInformationContentProfile = informationContentProfile.map(function (positionInformationContent) {return (positionInformationContent / maxTheoreticalInformationContent);});
//    var normalizedInformationContentProfile = informationContentProfile.map(function (positionInformationContent) {return (Math.exp(positionInformationContent) / Math.exp(maxObservedInformationContent));});
    calculateDomainInformationContentProfiles(normalizedInformationContentProfile);
}

function calculateDomainInformationContentProfiles(hmmInformationContentProfile) {
    var domainInformationContentProfiles = [];
    for (var domainAlignment of hmmsearchDomainAlignments) {
        var hmmStart = domainAlignment[1];
        var matchStateCount = 0;
        var domainInformationContentProfile = [];
        for (var letter of domainAlignment[0]) {
            if (letter === "-") {
                matchStateCount += 1;
            } else if ((letter === letter.toUpperCase()) && (letter !== "-")) {
                domainInformationContentProfile.push(hmmInformationContentProfile[hmmStart - 1 + matchStateCount]);
                matchStateCount += 1;
            } else {
                domainInformationContentProfile.push(0.0);
            }
        }
        domainInformationContentProfiles.push([domainAlignment[4], domainAlignment[3], domainAlignment[5], domainInformationContentProfile]);
    }
//    console.log(domainInformationContentProfiles);
    var representativeMolecule = domainInformationContentProfiles[0];
    console.log(representativeMolecule);
    representativeMoleculemmCIFRequest(representativeMolecule, representativeMoleculemmCIFCallback);
}

function representativeMoleculemmCIFRequest(moleculeData, callback) {
    var url = "https://www.ebi.ac.uk/pdbe/static/entry/" + moleculeData[0].split("_")[0] + "_updated.cif";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = callback.bind(this, request, moleculeData);
    request.send(null);
}

function representativeMoleculemmCIFCallback(request, moleculeData) {
    var mmCIFBlocks = request.response.split(/\n#\n/).map(function (block) {return block.split("\n");});
    var polySeqScheme = mmCIFBlocks.filter(function (block) {return ((block[0] === "loop_") && (block[1].slice(0, 21) === "_pdbx_poly_seq_scheme"));})[0];
    var structureResidueScheme = [];
    var polySeqSchemeHeaders = polySeqScheme.filter(function (line) {return line.slice(0, 21) === "_pdbx_poly_seq_scheme";}).map(function (line) {return line.trim().split(".")[1];});
    var polySeqSchemeHeadersPDBStrandIdIndex = polySeqSchemeHeaders.indexOf("pdb_strand_id");
    var polySeqSchemeHeadersPDBMonIdIndex = polySeqSchemeHeaders.indexOf("pdb_mon_id");
    var polySeqSchemeData = polySeqScheme.filter(function (line) {return ((line.slice(0, 21) !== "_pdbx_poly_seq_scheme") && (line !== "loop_"));}).map(function (line) {return line.trim().split(/\s+/g);});
    for (var line of polySeqSchemeData) {
        structureResidueScheme.push([line[polySeqSchemeHeadersPDBStrandIdIndex], line[polySeqSchemeHeadersPDBMonIdIndex]]);
    }
    var nonpolyScheme = mmCIFBlocks.filter(function (block) {return ((block[0] === "loop_") && (block[1].slice(0, 20) === "_pdbx_nonpoly_scheme"));})[0];
    if (nonpolyScheme !== undefined) {
        var nonpolySchemeHeaders = nonpolyScheme.filter(function (line) {return line.slice(0, 20) === "_pdbx_nonpoly_scheme";}).map(function (line) {return line.trim().split(".")[1];});
        var nonpolySchemeHeadersPDBStrandIdIndex = nonpolySchemeHeaders.indexOf("pdb_strand_id");
        var nonpolySchemeHeadersPDBMonIdIndex = nonpolySchemeHeaders.indexOf("pdb_mon_id");
        var nonpolySchemeData = nonpolyScheme.filter(function (line) {return ((line.slice(0, 20) !== "_pdbx_nonpoly_scheme") && (line !== "loop_"));}).map(function (line) {return line.trim().split(/\s+/g);});
        for (var line of nonpolySchemeData) {
            structureResidueScheme.push([line[nonpolySchemeHeadersPDBStrandIdIndex], line[nonpolySchemeHeadersPDBMonIdIndex]]);
        }
    }
//    console.log(structureResidueScheme);
    var informationContentProfileChainId = moleculeData[0].split("_")[1];
    var informationContentProfileStart = moleculeData[1];
    var informationContentProfileEnd = moleculeData[2];
    var regionInformationContentProfile = moleculeData[3];
    var structureResidueSchemeInformationContentProfile = [];
    var currentResidueIndex = 1;
    var informationContentProfileRegionResidueIndex = 0;
    for (var residue of structureResidueScheme) {
        if (residue[0] !== informationContentProfileChainId) {
            structureResidueSchemeInformationContentProfile.push(0.0);
        } else {
            if ((currentResidueIndex >= informationContentProfileStart) && (currentResidueIndex <= informationContentProfileEnd)) {
                structureResidueSchemeInformationContentProfile.push(regionInformationContentProfile[informationContentProfileRegionResidueIndex]);
                informationContentProfileRegionResidueIndex += 1;
            } else {
                structureResidueSchemeInformationContentProfile.push(0.0);
            }
            currentResidueIndex += 1;
        }
    }
//    console.log(structureResidueSchemeInformationContentProfile);
    var structureInformationContentProfile = [];
    for (var i = 0; i < structureResidueScheme.length; i += 1) {
        if (structureResidueScheme[i][1] !== "?") {
            structureInformationContentProfile.push(structureResidueSchemeInformationContentProfile[i]);
        }
    }
//    console.log(structureInformationContentProfile);
    visualizeMolecule(moleculeData, structureInformationContentProfile);
}

function visualizeMolecule(moleculeData, structureInformationContentProfile) {
//    console.log(conservationColorScale);
    conservationColorScale.splice(0, 1, [0.749, 0.937, 0.561]);
    var structureInformationContentColors = ["firstEntrySkipped",];
    for (var i = 0; i < structureInformationContentProfile.length; i += 1) {
        var colorId = Math.round(255 * structureInformationContentProfile[i]);
        var color = {r: conservationColorScale[colorId][0], g: conservationColorScale[colorId][1], b: conservationColorScale[colorId][2]};
        structureInformationContentColors.push(color);
    }
//    console.log(structureInformationContentColors);
    var pdbId = moleculeData[0].split("_")[0];
    LiteMolCallback(structureInformationContentColors);
    var plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#8FBFEF"});
    plugin.loadMolecule({id: pdbId, url: "https://www.ebi.ac.uk/pdbe/static/entry/" + pdbId + "_updated.cif", format: "cif"});
}

/*----------------------------------------------------------------------------*/

document.querySelector("#submitSequenceButton").onclick = function() {
    window.inputSequence = document.querySelector("#sequenceInput").value.toUpperCase().replace(/\s+/g, "");
    console.log(inputSequence);
    checkInputSequence(inputSequence);
    phmmerRequest(inputSequence, "uniprotrefprot", phmmerCallback);
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

// MERKRGRQTYTRYQTLELEKEFHFNRYLTRRRRIEIAHALSLTERQIKIWFQNRRMKWKKEN	9ant_A
// EQACDICRLKKLKCSKEKPKCAKCLKNNWECRYSPKTKRSPLTRAHLTEVESRLERLEQLFLLIFPREDLDMILKMDSLQ	3coq_A
// KAERKRMRNRIAASKSRKRKLERIARLEEKVKTLKAQNSELASTANMLREQVAQLKQKVMNH	1fos_F
