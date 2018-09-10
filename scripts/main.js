"use strict";

/*----------------------------------------------------------------------------*/

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
}

/*----------------------------------------------------------------------------*/

function printToInfoBoxDiv(text, link = "", color = "black") {
    var infoBoxDiv = document.getElementById("infoBoxDiv");
    var newParagraph = document.createElement("p");
    newParagraph.style.color = color;
    newParagraph.style.margin = "2px";
    var timeAndDate = new Date();
    var timeAndDateString = timeAndDate.toLocaleDateString() + " " + timeAndDate.toLocaleTimeString();
    var newParagraphText = document.createTextNode(timeAndDateString + " > " + text);
    newParagraph.appendChild(newParagraphText);
    if (link !== "") {
        var newLink = document.createElement("a");
        newLink.href = link;
        newLink.text = link;
        newLink.rel = "noopener noreferrer";
        newLink.target = "_blank";
        newParagraph.appendChild(newLink);
    }
    infoBoxDiv.appendChild(newParagraph);
    infoBoxDiv.scrollTop = infoBoxDiv.scrollHeight;
}

function printToSequenceAlignmentDiv(text, id = "", white = true) {
    var sequenceAlignmentDiv = document.getElementById("sequenceAlignmentDiv");
    var newParagraph = document.createElement("p");
    if (id !== "") {
        newParagraph.id = id;
        if ((id === "selectedSequenceAlignment") && (white === true)) {
            newParagraph.style.color = "white";
        }
    }
    var newParagraphText = document.createTextNode(text);
    newParagraph.appendChild(newParagraphText);
    sequenceAlignmentDiv.appendChild(newParagraph);
}

/*----------------------------------------------------------------------------*/

function initialize(wipeSelectedDomain = true) {
    document.querySelector("#createSavePointFileButton").disabled = true;
    d3.select("#structureSelection").selectAll("*").remove();
    document.querySelector("#structureSelection").disabled = true;
    document.querySelector("#selectStructureButton").disabled = true;
    document.querySelector("#applyScalingButton").disabled = true;
    d3.select("#informationContentProfileSVG").selectAll("*").remove();
    d3.select("#domainCoverageSVG").selectAll("*").remove();
    d3.select("#sequenceAlignmentDiv").selectAll("*").remove();
    if (wipeSelectedDomain === true) {
        window.selectedDomainGlobalObject = undefined;
        window.applyScalingMode = false;
    }
    if (window.plugin) {
        plugin.destroy();
    }
    LiteMolWrapper();
    window.plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#FFFFFF", layoutState: {hideControls: true}});
    d3.select("#informationContentColorScaleSVG").selectAll("*").remove();
}

initialize();
document.querySelector("#scalingSelection").value = "linearRelative";

function disableInputButtons() {
    document.querySelector("#submitSequenceButton").disabled = true;
    document.querySelector("#submitHMMButton").disabled = true;
    document.querySelector("#loadSavePointButton").disabled = true;
    document.querySelector("#scalingSelection").disabled = true;
}

function enableInputButtons() {
    document.querySelector("#submitSequenceButton").disabled = false;
    document.querySelector("#submitHMMButton").disabled = false;
    document.querySelector("#loadSavePointButton").disabled = false;
    document.querySelector("#scalingSelection").disabled = false;
}

/*----------------------------------------------------------------------------*/

document.querySelector("#submitSequenceButton").onclick = function() {
    initialize();
    disableInputButtons();
    window.inputMode = "sequence";
    window.inputSequence = document.querySelector("#sequenceInput").value.trim().split("\n");
    if (inputSequence[0][0] === ">") {
        inputSequence = inputSequence.slice(1).join("").toUpperCase().replace(/\s+/g, "");
    } else {
        inputSequence = inputSequence.join("").toUpperCase().replace(/\s+/g, "");
    }
    printToInfoBoxDiv("Accepted sequence (" + inputSequence.length + " residues):" + wrapSequence(inputSequence));
    printToInfoBoxDiv("Checking input sequence ...");
    checkInputSequence(inputSequence);
    phmmerRequest(inputSequence);
}

function wrapSequence(seq) {
    var wrappedSeq = "";
    for (var i = 0; i <= Math.floor(seq.length / 60); i += 1) {
        wrappedSeq += "\n" + seq.slice(i * 60, (i + 1) * 60);
    }
    return wrappedSeq;
}

function checkInputSequence(seq) {
    var seqLength = seq.length;
    var seqUniqueCharacters = new Set(seq);
    var nucleotides = new Set("ACGT");
    if (seqLength < 10) {
        printToInfoBoxDiv("ERROR: input sequence must contain at least 10 characters.", "", "red");
        enableInputButtons();
        throw new Error("Input sequence must contain at least 10 characters.");
    }
    if ((seqLength === 10) && (seqUniqueCharacters.size < 6)) {
        printToInfoBoxDiv("ERROR: at least 6 unique characters must be present in an input sequence containing exactly 10 characters.", "", "red");
        enableInputButtons();
        throw new Error("At least 6 unique characters must be present in an input sequence containing exactly 10 characters.");
    }
    if ((seqLength > 10) && (seqUniqueCharacters.size === (seqUniqueCharacters.intersection(nucleotides)).size)) {
        printToInfoBoxDiv("ERROR: at least 1 character which is not A/C/G/T must be present in an input sequence containing more than 10 characters.", "", "red");
        enableInputButtons();
        throw new Error("At least 1 character which is not A/C/G/T must be present in an input sequence containing more than 10 characters.");
    }
}

document.querySelector("#exampleSequenceInputButton").onclick = function() {
    document.querySelector("#sequenceInput").value = ">sp|P07477|TRY1_HUMAN\nMNPLLILTFVAAALAAPFDDDDKIVGGYNCEENSVPYQVSLNSGYHFCGGSLINEQWVVS\nAGHCYKSRIQVRLGEHNIEVLEGNEQFINAAKIIRHPQYDRKTLNNDIMLIKLSSRAVIN\nARVSTISLPTAPPATGTKCLISGWGNTASSGADYPDELQCLDAPVLSQAKCEASYPGKIT\nSNMFCVGFLEGGKDSCQGDSGGPVVCNGQLQGVVSWGDGCAQKNKPGVYTKVYNYVKWIK\nNTIAANS";
}

document.querySelector("#clearSequenceInputButton").onclick = function() {
    document.querySelector("#sequenceInput").value = "";
}

document.querySelector("#submitHMMButton").onclick = function() {
    if (document.querySelector("#HMMInput").files.length === 0) {
        printToInfoBoxDiv("ERROR: no file was selected.", "", "red");
        throw new Error("No file was selected.");
    }
    initialize();
    disableInputButtons();
    window.inputMode = "HMM";
    var inputHMMFile = document.querySelector("#HMMInput").files[0];
    printToInfoBoxDiv("Accepted profile HMM file: " + inputHMMFile.name);
    var reader = new FileReader();
    reader.onload = readInputHMMFileCallback.bind(this, reader, inputHMMFile);
    reader.readAsText(inputHMMFile);
}

document.querySelector("#loadSavePointButton").onclick = function() {
    if (document.querySelector("#savePointInput").files.length === 0) {
        printToInfoBoxDiv("ERROR: no file was selected.", "", "red");
        throw new Error("No file was selected.");
    }
    initialize();
    document.querySelector("#referenceStructuresListAnchor").href = "";
    disableInputButtons();
    window.inputMode = "savePoint";
    var inputSavePointFile = document.querySelector("#savePointInput").files[0];
    printToInfoBoxDiv("Accepted save point file: " + inputSavePointFile.name);
    var reader = new FileReader();
    reader.onload = readInputSavePointFileCallback.bind(this, reader, inputSavePointFile);
    reader.readAsText(inputSavePointFile);
}

document.querySelector("#selectStructureButton").onclick = function() {
    d3.select("#domainCoverageSVG").selectAll("g").selectAll("rect").attr("fill", "MediumSeaGreen");
    var domain = JSON.parse(document.querySelector("#structureSelection").value);
    if (inputMode !== "savePoint") {
        var savePoint = returnOriginalSavePoint();
        savePoint.selectedStructure = domain;
        updateSavePoint(savePoint);
    }
    var moleculeData = domain[0];
    window.selectedDomainGlobalObject = new Object();
    selectedDomainGlobalObject.chainId = moleculeData[0];
    selectedDomainGlobalObject.seqStart = moleculeData[1];
    selectedDomainGlobalObject.seqEnd = moleculeData[2];
    selectedDomainGlobalObject.domainIndex = -1;
    printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing alignment");
    var alignedSequence = domain[2];
    var hmmStart = domain[1].hmmStart;
    var hmmEnd = domain[1].hmmEnd;
    d3.select("#selectedSequenceAlignment").remove();
    if (inputMode !== "savePoint") {
        var selectedSequenceAlignmentString = moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePoint.informationContentProfile.length - hmmEnd);
        selectedDomainGlobalObject.selectedSequenceAlignmentString = selectedSequenceAlignmentString;
        printToSequenceAlignmentDiv(selectedSequenceAlignmentString, "selectedSequenceAlignment");
    } else {
        printToSequenceAlignmentDiv(moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePointInformationContentProfileLength - hmmEnd), "selectedSequenceAlignment");
    }
    moleculemmCIFRequest(moleculeData);
}

document.querySelector("#applyScalingButton").onclick = function() {
    initialize(false);
    window.applyScalingMode = true;
    normalizeInformationContentProfile();
}

/*----------------------------------------------------------------------------*/

function phmmerRequest(seq) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/search/phmmer";
    var data = new FormData();
    data.append("algo", "phmmer");
    data.append("seq", seq);
    data.append("seqdb", "uniprotrefprot");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "text/html");
    request.onreadystatechange = phmmerCallback.bind(this, request);
    printToInfoBoxDiv("Starting phmmer search against UniProt reference proteomes");
    request.send(data);
}

function phmmerCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        printToInfoBoxDiv("phmmer search against UniProt reference proteomes finished, results: ", responseURL);
        var jobID = responseURL.split("/")[6];
        printToInfoBoxDiv("Checking significant hits ...");
        checkSignificantHitsRequest(jobID);
    } else if ((request.readyState === XMLHttpRequest.DONE) && ((request.status === 500) || (request.status === 502) || (request.status === 503))) {
        printToInfoBoxDiv("ERROR: something went wrong during phmmer search. This may occur when the HMMER web server is full. You may want to try again later.", "", "red");
        enableInputButtons();
        throw new Error("Something went wrong during phmmer search.");
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 400)) {
        printToInfoBoxDiv("ERROR: something went wrong during phmmer search. This may occur when your input sequence length exceeds HMMER web server limitations. Visit the HMMER web server site to see current limits.", "", "red");
        enableInputButtons();
        throw new Error("Something went wrong during phmmer search.");
    }
}

function checkSignificantHitsRequest(jobID) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/results/" + jobID + "?range=1,1&ali=0&output=json";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = checkSignificantHitsCallback.bind(this, request, jobID);
    request.send(null);
}

function checkSignificantHitsCallback(request, jobID) {
    try {
        var topResultsStats = JSON.parse(request.response)["results"]["stats"];
    } catch (e) {
        printToInfoBoxDiv("ERROR: there was a problem with retrieving phmmer search results. This may occur when the HMMER web server is full. You may want to try again later.", "", "red");
        enableInputButtons();
        throw new Error("There was a problem with retrieving phmmer search results.");
    }
    if (Number(topResultsStats["nhits"]) === 0) {
        printToInfoBoxDiv("ERROR: no hits were found using phmmer search.", "", "red");
        enableInputButtons();
        throw new Error("No hits were found using phmmer search.");
    }
    if (Number(topResultsStats["nincluded"]) === 0) {
        printToInfoBoxDiv("ERROR: no significant hits were found using phmmer search.", "", "red");
        enableInputButtons();
        throw new Error("No significant hits were found using phmmer search.");
    }
    hmmsearchRequest(jobID);
}

function hmmsearchRequest(jobID) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer//search/hmmsearch?uuid=" + jobID + ".1";
    var data = new FormData();
    data.append("algo", "hmmsearch");
    data.append("seqdb", "pdb");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = hmmsearchCallback.bind(this, request, jobID);
    printToInfoBoxDiv("Starting hmmsearch search against the PDB");
    request.send(data);
}

function hmmsearchCallback(request, jobID) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        printToInfoBoxDiv("hmmsearch search against the PDB finished, results: ", responseURL);
        var hits = JSON.parse(request.response)["results"]["hits"];	// all hits, incl. high E-value
//        console.log(hits);
        printToInfoBoxDiv("Checking hits ...");
        if (hits.length === 0) {
            printToInfoBoxDiv("ERROR: no structures were found using hmmsearch search.", "", "red");
            enableInputButtons();
            throw new Error("No structures were found using hmmsearch search.");
        }
        generateReferenceStructuresList(hits);
        window.hmmsearchDomainAlignments = [];
        for (var hit of hits) {
            var domains = hit["domains"];
            for (var domain of domains) {
                if (domain["is_reported"] === 1) {
                    var aliSeq = domain["aliaseq"];
                    var hmmStart = domain["alihmmfrom"];
                    var hmmEnd = domain["alihmmto"];
                    var seqStart = domain["alisqfrom"];
                    var seqName = domain["alisqname"];
                    var seqEnd = domain["alisqto"];
                    hmmsearchDomainAlignments.push([aliSeq, hmmStart, hmmEnd, seqStart, seqName, seqEnd]);
                }
            }
        }
//        console.log(hmmsearchDomainAlignments);
        phmmerResultsHMMRequest(responseURL);
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 400)) {
        delayedHmmsearchRequest(jobID);
    } else if ((request.readyState === XMLHttpRequest.DONE) && ((request.status === 500) || (request.status === 502) || (request.status === 503))) {
        printToInfoBoxDiv("ERROR: something went wrong during hmmsearch search. This may occur when the HMMER web server is full. You may want to try again later.", "", "red");
        enableInputButtons();
        throw new Error("Something went wrong during hmmsearch search.");
    }
}

function generateReferenceStructuresList(hits) {
    window.isoseqGroups = new Map();
    window.domainEvalues = new Map();
    var referenceStructuresList = [];
    for (var hit of hits) {
        var refId = hit["acc"];
        var seqs = hit["seqs"];
        if (seqs === undefined) {
            var isoseqIds = [];
        } else {
            var isoseqIds = seqs.map(function (seq) {return seq["dn"];}).sort();
        }
        isoseqGroups.set(refId, isoseqIds);
        var line = refId + "\t" + isoseqIds.join(", ");
        referenceStructuresList.push(line);
        var domains = hit["domains"];
        for (var domain of domains) {
            if (domain["is_reported"] === 1) {
                var seqStart = domain["alisqfrom"].toString();
                var seqEnd = domain["alisqto"].toString();
                var Evalue = Number(domain["ievalue"]);
                domainEvalues.set(refId + " " + seqStart + "-" + seqEnd, Evalue);
                for (var isoseqId of isoseqIds) {
                    domainEvalues.set(isoseqId + " " + seqStart + "-" + seqEnd, Evalue);
                }
            }
        }
    }
    var referenceStructuresListBlob = new Blob([referenceStructuresList.join("\n")], {type: "text/plain"});
    var referenceStructuresAnchor = document.querySelector("#referenceStructuresListAnchor");
    referenceStructuresAnchor.href = URL.createObjectURL(referenceStructuresListBlob);
}

function delayedHmmsearchRequest(jobID) {
    printToInfoBoxDiv("Received 400 (Bad Request), trying again ...");
    var timeoutID = window.setTimeout(hmmsearchRequest, 2000, jobID);
}

function phmmerResultsHMMRequest(resultsURL) {
    var url = resultsURL.replace("results", "download") + "?format=hmm";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = phmmerResultsHMMCallback.bind(this, request);
    printToInfoBoxDiv("Requesting phmmer search results profile HMM");
    request.send(null);
}

function phmmerResultsHMMCallback(request) {
    var phmmerResultsHMM = request.response;	// HMM from high-scoring (above threshold) phmmer search hits
//    console.log(phmmerResultsHMM);
    window.HMMConsensusSequence = phmmerResultsHMM.split("\n").filter(function (line) {return (line.trim().split(/\s+/g).length === 26);}).map(function (line) {return line.split(/\s+/g).slice(-4, -3)[0];}).join("");
//    console.log(HMMConsensusSequence);
    alignInputToHMMRequest(inputSequence, phmmerResultsHMM);
}

function alignInputToHMMRequest(seq, hmm) {
    var url = "https://wwwdev.ebi.ac.uk/Tools/hmmer/align";
    var data = new FormData();
    data.append("seq", ">seq\n" + seq);
    data.append("hmm", hmm);
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "text/plain");
    var hmmBlob = new Blob([hmm], {type: "text/plain"});
    request.onreadystatechange = alignInputToHMMCallback.bind(this, request, hmmBlob);
    printToInfoBoxDiv("Aligning input sequence to the phmmer search results profile HMM");
    request.send(data);
}

function alignInputToHMMCallback(request, hmmBlob) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        window.alignedInputSequence = request.response.split("\n")[2].split(/\s+/)[1];
//        console.log(alignedInputSequence);
        skylignURLRequest(hmmBlob);
    }
}

function skylignURLRequest(file) {
    var url = "https://skylign.org/";
    var data = new FormData();
    data.append("file", file);
    data.append("processing", "hmm");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = skylignURLCallback.bind(this, request);
    printToInfoBoxDiv("Requesting profile HMM information content calculation");
    request.send(data);
}

function skylignURLCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = JSON.parse(request.response)["url"].replace("http://", "https://");
        printToInfoBoxDiv("Profile HMM information content calculation finished, results: ", responseURL);
        skylignLogoRequest(responseURL);
    }
}

function skylignLogoRequest(resultsURL) {
    var request = new XMLHttpRequest();
    request.open("GET", resultsURL, true);
    request.setRequestHeader("Accept", "application/json");
    request.onload = skylignLogoCallback.bind(this, request);
    request.send(null);
}

function skylignLogoCallback(request) {
    var logo = JSON.parse(request.response);
//    console.log(logo);
    var informationContentProfile = [];
    for (var i = 0; i < logo["height_arr"].length; i += 1) {
        var positionLetterHeights = logo["height_arr"][i];
        var positionInformationContent = Math.round((positionLetterHeights.map(function (letter) {return Number(letter.split(":")[1]);})).reduce(function (a, b) {return a + b;}, 0) * 1000) / 1000;
        informationContentProfile.push(positionInformationContent);
    }
//    console.log(informationContentProfile);
    window.normalizeInformationContentProfile = normalizeInformationContentProfileCallback.bind(this, logo, informationContentProfile);
    normalizeInformationContentProfile();
}

function normalizeInformationContentProfileCallback(logo, informationContentProfile) {
    var savePointObject = new Object();
    savePointObject.HMMConsensusSequence = HMMConsensusSequence;
    if (applyScalingMode === false) {
        printToInfoBoxDiv("Printing profile HMM consensus sequence");
    }
    printSequencePositionIndices(HMMConsensusSequence.length);
    printToSequenceAlignmentDiv("CONS\t" + HMMConsensusSequence);
    if (inputMode === "sequence") {
        savePointObject.alignedInputSequence = alignedInputSequence;
        if (applyScalingMode === false) {
            printToInfoBoxDiv("Printing input sequence alignment");
        }
        printToSequenceAlignmentDiv("INPUT\t" + alignedInputSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join(""));
    }
    savePointObject.informationContentProfile = informationContentProfile;
    var maxObservedInformationContent = informationContentProfile.reduce(function (a, b) {return Math.max(a, b);});
    var maxExpObservedInformationContent = Math.exp(maxObservedInformationContent);
    var maxTheoreticalInformationContent = Number(logo["max_height_theory"]);
    savePointObject.maxTheoreticalInformationContent = maxTheoreticalInformationContent;
    var maxExpTheoreticalInformationContent = Math.exp(maxTheoreticalInformationContent);
    if (applyScalingMode === false) {
        printToInfoBoxDiv("Plotting profile HMM information content profile");
    }
    plotInformationContentProfile(informationContentProfile, maxTheoreticalInformationContent);
    var normalizationMethod = document.querySelector("#scalingSelection").value;
    savePointObject.normalizationMethod = normalizationMethod;
    if (normalizationMethod === "linearAbsolute") {
        var normalizedInformationContentProfile = informationContentProfile.map(function (positionInformationContent) {return (positionInformationContent / maxTheoreticalInformationContent);});
        plotInformationContentColorScale("linear", maxTheoreticalInformationContent);
        savePointObject.colorScalePlotParameters = ["linear", maxTheoreticalInformationContent];
    } else if (normalizationMethod === "linearRelative") {
        var normalizedInformationContentProfile = informationContentProfile.map(function (positionInformationContent) {return (positionInformationContent / maxObservedInformationContent);});
        plotInformationContentColorScale("linear", maxObservedInformationContent);
        savePointObject.colorScalePlotParameters = ["linear", maxObservedInformationContent];
    } else if (normalizationMethod === "exponentialAbsolute") {
        var normalizedInformationContentProfile = informationContentProfile.map(function (positionInformationContent) {return (Math.exp(positionInformationContent) / maxExpTheoreticalInformationContent);});
        plotInformationContentColorScale("exponential", maxExpTheoreticalInformationContent);
        savePointObject.colorScalePlotParameters = ["exponential", maxExpTheoreticalInformationContent];
    } else if (normalizationMethod === "exponentialRelative") {
        var normalizedInformationContentProfile = informationContentProfile.map(function (positionInformationContent) {return (Math.exp(positionInformationContent) / maxExpObservedInformationContent);});
        plotInformationContentColorScale("exponential", maxExpObservedInformationContent);
        savePointObject.colorScalePlotParameters = ["exponential", maxExpObservedInformationContent];
    }
    if (inputMode === "sequence") {
        calculateDomainInformationContentProfiles(normalizedInformationContentProfile, hmmsearchDomainAlignments, savePointObject);
    } else if (inputMode === "HMM") {
        calculateDomainInformationContentProfiles(normalizedInformationContentProfile, HMMInputHmmsearchDomainAlignments, savePointObject);
    }
}

function printSequencePositionIndices(sequenceLength) {
    var positionIndices = [];
    for (var i = 10; i <= sequenceLength; i += 10) {
        positionIndices.unshift(i.toString());
    }
    var positionIndexString = " ".repeat(sequenceLength).split("");
    for (var i of positionIndices) {
        positionIndexString.splice(Number(i) - 1, i.length, i);
    }
    printToSequenceAlignmentDiv("\t" + positionIndexString.join(""));
}

function plotInformationContentProfile(profile, yMax) {
    var svg = d3.select("#informationContentProfileSVG");
    svg.append("rect")
        .attr("width", svg.attr("width"))
        .attr("height", svg.attr("height"))
        .attr("fill", "white");
    var chartMargin = {top: 20, right: 20, bottom: 45, left: 55};
    var chartWidth = svg.attr("width") - chartMargin.left - chartMargin.right;
    var chartHeight = svg.attr("height") - chartMargin.top - chartMargin.bottom;
    var chart = svg.append("g")
        .attr("transform", "translate(" + chartMargin.left + ", " + chartMargin.top + ")");
    var x = d3.scaleLinear()
        .range([0, chartWidth])
        .domain([1, profile.length]);
    var y = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, yMax]);
    var line = d3.line()
        .x(function (d, i) {return x(i + 1);})
        .y(function (d) {return y(d);});
    var area = d3.area()
        .x(function (d, i) {return x(i + 1);})
        .y0(chartHeight)
        .y1(function (d) {return y(d);});
    chart.append("g")
        .attr("transform", "translate(0, " + chartHeight + ")")
        .call(d3.axisBottom(x));
    chart.append("g")
        .call(d3.axisLeft(y));
    chart.append("text")
        .text("Profile HMM position")
        .attr("transform", "translate(" + (chartWidth / 2) + ", " + (chartHeight + 35) +")")
        .attr("font-size", 14)
        .attr("text-anchor", "middle");
    svg.append("text")
        .text("Information content / bits")
        .attr("transform", "translate(20, " + (chartMargin.top + (chartHeight / 2)) + ")rotate(-90)")
        .attr("font-size", 14)
        .attr("text-anchor", "middle");
    chart.append("path")
        .datum(profile)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);
    chart.append("path")
        .datum(profile)
        .attr("fill", "lightsteelblue")
        .attr("d", area);
}

function plotInformationContentColorScale(method, xMax) {
    var svg = d3.select("#informationContentColorScaleSVG");
    svg.append("rect")
        .attr("width", svg.attr("width"))
        .attr("height", svg.attr("height"))
        .attr("fill", "white");
    var chartMargin = {top: 20, right: 20, bottom: 45, left: 20};
    var chartWidth = svg.attr("width") - chartMargin.left - chartMargin.right;
    var chartHeight = svg.attr("height") - chartMargin.top - chartMargin.bottom;
    var chart = svg.append("g")
        .attr("transform", "translate(" + chartMargin.left + ", " + chartMargin.top + ")");
    var colors = [];
    for (var color of conservationColorScale.map(function (i) {return JSON.stringify(i);})) {
        if (colors.indexOf(color) === -1) {
            colors.push(color);
        }
    }
    var colorCount = colors.length;
    var relativeTickSize = 1 / colorCount;
    var relativeTickMarks = [];
    for (var i = 0; i <= colorCount; i += 1) {
        relativeTickMarks.push(i * relativeTickSize);
    }
    var rectWidth = chartWidth / colorCount;
    var colorIndex = 0;
    for (var color of colors.map(function (i) {return JSON.parse(i);})) {
        var colorHex = "#" + color.map(function (i) {return ("0" + (parseInt(i * 255, 10).toString(16))).slice(-2);}).join("");
        chart.append("rect")
            .attr("x", colorIndex * rectWidth)
            .attr("y", 0)
            .attr("width", rectWidth)
            .attr("height", chartHeight)
            .attr("fill", colorHex);
        colorIndex += 1;
    }
    var x = d3.scaleLinear()
        .range([0, chartWidth])
        .domain([0, xMax]);
    var xValues = relativeTickMarks.map(function (i) {return (i * xMax);});
    chart.append("g")
        .attr("transform", "translate(0, " + chartHeight + ")")
        .call(d3.axisBottom(x)
//            .ticks(colorCount + 1)
            .tickValues(xValues)
            .tickFormat(d3.format(",.2f")));
    if (method === "linear") {
        chart.append("text")
            .text("Information content / bits")
            .attr("transform", "translate(" + (chartWidth / 2) + ", " + (chartHeight + 35) +")")
            .attr("font-size", 14)
            .attr("text-anchor", "middle");
    } else if (method === "exponential") {
        chart.append("text")
            .text("exp[information content / bits]")
            .attr("transform", "translate(" + (chartWidth / 2) + ", " + (chartHeight + 35) +")")
            .attr("font-size", 14)
            .attr("text-anchor", "middle");
    }
}

function calculateDomainInformationContentProfiles(hmmInformationContentProfile, domainAlignments, savePoint) {
    var coveredHmmInformationContentProfilePositions = new Set();
    var minimumNewHmmPositions = 40;
    var domainInformationContentProfiles = [];
    var otherDomains = [];
    for (var domainAlignment of domainAlignments) {
        var hmmStart = domainAlignment[1];
        var hmmEnd = domainAlignment[2];
        var matchStateCount = 0;
        var domainInformationContentProfile = [];
        for (var letter of domainAlignment[0]) {
            if (letter === "-") {
                matchStateCount += 1;
            } else if ((letter === letter.toUpperCase()) && (letter !== "-")) {
                domainInformationContentProfile.push(hmmInformationContentProfile[hmmStart - 1 + matchStateCount]);
                matchStateCount += 1;
            } else {
                domainInformationContentProfile.push("i");
            }
        }
        var hmmPositions = new Set();
        for (var i = hmmStart; i <= hmmEnd; i += 1) {
            hmmPositions.add(i);
        }
        var newHmmPositions = hmmPositions.difference(coveredHmmInformationContentProfilePositions);
        if ((coveredHmmInformationContentProfilePositions.size === 0) || (newHmmPositions.size >= minimumNewHmmPositions)) {
            coveredHmmInformationContentProfilePositions = coveredHmmInformationContentProfilePositions.union(newHmmPositions);
            domainInformationContentProfiles.push([[domainAlignment[4], domainAlignment[3], domainAlignment[5], domainInformationContentProfile], {"hmmStart": hmmStart, "hmmEnd": hmmEnd}, domainAlignment[0]]);
        } else {
            otherDomains.push([[domainAlignment[4], domainAlignment[3], domainAlignment[5], domainInformationContentProfile], {"hmmStart": hmmStart, "hmmEnd": hmmEnd}, domainAlignment[0]]);
        }
        for (var isoseqId of isoseqGroups.get(domainAlignment[4])) {
            otherDomains.push([[isoseqId, domainAlignment[3], domainAlignment[5], domainInformationContentProfile], {"hmmStart": hmmStart, "hmmEnd": hmmEnd}, domainAlignment[0]]);
        }
    }
//    console.log(domainInformationContentProfiles);
//    console.log(otherDomains);
    savePoint.domainInformationContentProfiles = domainInformationContentProfiles;
    updateSavePoint(savePoint);
    window.returnOriginalSavePoint = (function (savePoint) {return savePoint;}).bind(this, JSON.parse(JSON.stringify(savePoint)));
    createStructureSelectionOptions(otherDomains);
    document.querySelector("#structureSelection").disabled = false;
    document.querySelector("#selectStructureButton").disabled = false;
    document.querySelector("#createSavePointFileButton").disabled = false;
    document.querySelector("#applyScalingButton").disabled = false;
    enableInputButtons();
    if (applyScalingMode === false) {
        printToInfoBoxDiv("Plotting profile HMM structure coverage");
    }
    plotDomainCoverage(hmmInformationContentProfile.length, domainInformationContentProfiles, savePoint);
    if (selectedDomainGlobalObject !== undefined) {
        if (selectedDomainGlobalObject.domainIndex !== -1) {
            savePoint.domainIndex = selectedDomainGlobalObject.domainIndex;
            updateSavePoint(savePoint);
            d3.select("#domainCoverageRect" + selectedDomainGlobalObject.domainIndex).attr("fill", "springgreen");
            var moleculeData = domainInformationContentProfiles[selectedDomainGlobalObject.domainIndex][0];
            printToSequenceAlignmentDiv(selectedDomainGlobalObject.selectedSequenceAlignmentString, "selectedSequenceAlignment");
            moleculemmCIFRequest(moleculeData);
        } else {
            var selectedStructure = otherDomains.filter(function (domain) {return ((domain[0][0] === selectedDomainGlobalObject.chainId) && (domain[0][1] === selectedDomainGlobalObject.seqStart) && (domain[0][2] === selectedDomainGlobalObject.seqEnd));})[0];
            savePoint.selectedStructure = selectedStructure;
            updateSavePoint(savePoint);
            var moleculeData = selectedStructure[0];
            printToSequenceAlignmentDiv(selectedDomainGlobalObject.selectedSequenceAlignmentString, "selectedSequenceAlignment");
            moleculemmCIFRequest(moleculeData);
        }
    }
}

function updateSavePoint(savePoint) {
    var savePointBlob = new Blob([JSON.stringify(savePoint)], {type: "application/json"});
    var savePointAnchor = document.querySelector("#createSavePointFileAnchor");
    savePointAnchor.href = URL.createObjectURL(savePointBlob);
    var timeAndDate = new Date();
    var timeAndDateString = [timeAndDate.getFullYear(), timeAndDate.getMonth(), timeAndDate.getDate(), timeAndDate.getHours(), timeAndDate.getMinutes(), timeAndDate.getSeconds()].map(function (i) {return i.toString();}).join("_");
    savePointAnchor.download = "3DPatch_" + timeAndDateString + ".json";
}

function evaluePictogram(evalue) {
    if (evalue < 1e-20) {
        return String.fromCodePoint(0x1f525);
    } else if ((evalue >= 1e-20) && (evalue < 1e-10)) {
        return "***";
    } else if ((evalue >= 1e-10) && (evalue < 1e-2)) {
        return "**";
    } else {
        return "*";
    }
}

function createStructureSelectionOptions(domains) {
    var select = document.getElementById("structureSelection");
    for (var domain of domains) {
        var option = document.createElement("option");
        option.text = domain[0][0] + " " + domain[0][1].toString() + "-" + domain[0][2].toString() + " (HMM " + domain[1].hmmStart.toString() + "-" + domain[1].hmmEnd.toString() + "), ind. E-value: " + domainEvalues.get(domain[0][0] + " " + domain[0][1].toString() + "-" + domain[0][2].toString()).toString() + " " + evaluePictogram(domainEvalues.get(domain[0][0] + " " + domain[0][1].toString() + "-" + domain[0][2].toString()));
        option.value = JSON.stringify(domain);
        select.appendChild(option);
    }
}

function plotDomainCoverage(hmmLength, domainInformationContentProfiles, savePoint) {
    var domainCount = domainInformationContentProfiles.length;
    var svg = d3.select("#domainCoverageSVG");
    var chartMargin = {top: 20, right: 20, bottom: 45, left: 20};
    var rectElementHeight = 50;
    svg.attr("height", (domainCount * rectElementHeight) + chartMargin.top + chartMargin.bottom);
    svg.append("rect")
        .attr("width", svg.attr("width"))
        .attr("height", svg.attr("height"))
        .attr("fill", "white");
    var chartWidth = svg.attr("width") - chartMargin.left - chartMargin.right;
    var chartHeight = svg.attr("height") - chartMargin.top - chartMargin.bottom;
    var chart = svg.append("g")
        .attr("transform", "translate(" + chartMargin.left + ", " + chartMargin.top + ")");
    var x = d3.scaleLinear()
        .range([0, chartWidth])
        .domain([1, hmmLength]);
    chart.append("g")
        .attr("transform", "translate(0, " + chartHeight + ")")
        .call(d3.axisBottom(x));
    chart.append("text")
        .text("Profile HMM position")
        .attr("transform", "translate(" + (chartWidth / 2) + ", " + (chartHeight + 35) +")")
        .attr("font-size", 14)
        .attr("text-anchor", "middle");
    var rectElementMargin = {top: 10, bottom: 10};
    var rectElementCornerRadius = {x: 5, y: 5};
    var domainIndex = 0;
    for (var domain of domainInformationContentProfiles) {
        chart.append("rect")
            .attr("id", "domainCoverageRect" + domainIndex) 
            .attr("x", x(domain[1].hmmStart))
            .attr("y", (domainIndex * rectElementHeight) + rectElementMargin.top)
            .attr("width", x(domain[1].hmmEnd) - x(domain[1].hmmStart))
            .attr("height", rectElementHeight - rectElementMargin.top - rectElementMargin.bottom)
            .attr("rx", rectElementCornerRadius.x)
            .attr("ry", rectElementCornerRadius.y)
            .attr("fill", "MediumSeaGreen")
            .attr("domainIndex", domainIndex)
            .on("click", function () {
                delete savePoint.selectedStructure;
                savePoint.domainIndex = d3.select(this).attr("domainIndex");
                updateSavePoint(savePoint);
                chart.selectAll("rect").attr("fill", "MediumSeaGreen");
                d3.select(this).attr("fill", "springgreen");
                var moleculeData = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][0];
//                console.log(moleculeData);
                window.selectedDomainGlobalObject = new Object();
                selectedDomainGlobalObject.domainIndex = d3.select(this).attr("domainIndex");
                printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing alignment");
                var alignedSequence = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][2];
                var hmmStart = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][1].hmmStart;
                var hmmEnd = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][1].hmmEnd;
                d3.select("#selectedSequenceAlignment").remove();
                var selectedSequenceAlignmentString = moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(hmmLength - hmmEnd);
                selectedDomainGlobalObject.selectedSequenceAlignmentString = selectedSequenceAlignmentString;
                printToSequenceAlignmentDiv(selectedSequenceAlignmentString, "selectedSequenceAlignment");
                moleculemmCIFRequest(moleculeData);
            });
        var label = chart.append("text")
            .text(domain[0][0])
            .style("pointer-events", "none")
            .attr("fill", "white")
            .attr("font-family", "Roboto Mono, monospace")
            .attr("font-size", 16)
            .attr("text-anchor", "middle")
            .attr("x", Number(d3.select("#domainCoverageRect" + domainIndex).attr("x")) + (Number(d3.select("#domainCoverageRect" + domainIndex).attr("width")) / 2))
            .attr("y", Number(d3.select("#domainCoverageRect" + domainIndex).attr("y")) + rectElementHeight - rectElementMargin.top - rectElementMargin.bottom - 9);
        if (Number(d3.select("#domainCoverageRect" + domainIndex).attr("width")) < 72) {
            label.attr("lengthAdjust", "spacingAndGlyphs");
            label.attr("textLength", Number(d3.select("#domainCoverageRect" + domainIndex).attr("width")) - 2);
        }
        d3.select("#domainCoverageRect" + domainIndex).append("title")
            .text(domain[0][0] + " " + domain[0][1] + "-" + domain[0][2] + " (HMM " + domain[1].hmmStart + "-" + domain[1].hmmEnd + ")");
        domainIndex += 1;
    }
    if ((inputMode !== "savePoint") && (applyScalingMode === false)) {
        printToInfoBoxDiv("DONE !");
    }
}

function moleculemmCIFRequest(moleculeData) {
    var url = "https://www.ebi.ac.uk/pdbe/static/entry/" + moleculeData[0].split("_")[0] + "_updated.cif";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = moleculemmCIFCallback.bind(this, request, moleculeData);
    request.send(null);
}

function moleculemmCIFCallback(request, moleculeData) {
    var mmCIFBlocks = request.response.split(/\n#\n/).map(function (block) {return block.split("\n");});
    var structureResidueScheme = [];
    var polySeqScheme = mmCIFBlocks.filter(function (block) {return ((block[0] === "loop_") && (block[1].slice(0, 21) === "_pdbx_poly_seq_scheme"));})[0];
    var polySeqSchemeHeaders = polySeqScheme.filter(function (line) {return line.slice(0, 21) === "_pdbx_poly_seq_scheme";}).map(function (line) {return line.trim().split(".")[1];});
    var polySeqSchemeHeadersPDBStrandIdIndex = polySeqSchemeHeaders.indexOf("pdb_strand_id");
    var polySeqSchemeHeadersPDBMonIdIndex = polySeqSchemeHeaders.indexOf("pdb_mon_id");
    var polySeqSchemeHeadersEntityIdIndex = polySeqSchemeHeaders.indexOf("entity_id");
    var polySeqSchemeHeadersAsymIdIndex = polySeqSchemeHeaders.indexOf("asym_id");
    var polySeqSchemeData = polySeqScheme.filter(function (line) {return ((line.slice(0, 21) !== "_pdbx_poly_seq_scheme") && (line !== "loop_"));}).map(function (line) {return line.trim().split(/\s+/g);});
    for (var line of polySeqSchemeData) {
        structureResidueScheme.push([line[polySeqSchemeHeadersPDBStrandIdIndex], line[polySeqSchemeHeadersPDBMonIdIndex], line[polySeqSchemeHeadersEntityIdIndex], line[polySeqSchemeHeadersAsymIdIndex]]);
    }
    var nonpolyScheme = mmCIFBlocks.filter(function (block) {return ((block[0] === "loop_") && (block[1].slice(0, 20) === "_pdbx_nonpoly_scheme"));})[0];
    if (nonpolyScheme !== undefined) {
        var nonpolySchemeHeaders = nonpolyScheme.filter(function (line) {return line.slice(0, 20) === "_pdbx_nonpoly_scheme";}).map(function (line) {return line.trim().split(".")[1];});
        var nonpolySchemeHeadersPDBStrandIdIndex = nonpolySchemeHeaders.indexOf("pdb_strand_id");
        var nonpolySchemeHeadersPDBMonIdIndex = nonpolySchemeHeaders.indexOf("pdb_mon_id");
        var nonpolySchemeHeadersEntityIdIndex = nonpolySchemeHeaders.indexOf("entity_id");
        var nonpolySchemeHeadersAsymIdIndex = nonpolySchemeHeaders.indexOf("asym_id");
        var nonpolySchemeData = nonpolyScheme.filter(function (line) {return ((line.slice(0, 20) !== "_pdbx_nonpoly_scheme") && (line !== "loop_"));}).map(function (line) {return line.trim().split(/\s+/g);});
        for (var line of nonpolySchemeData) {
            structureResidueScheme.push([line[nonpolySchemeHeadersPDBStrandIdIndex], line[nonpolySchemeHeadersPDBMonIdIndex], line[nonpolySchemeHeadersEntityIdIndex], line[nonpolySchemeHeadersAsymIdIndex]]);
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
    var alignmentResidueIndices = [];
    for (var residue of structureResidueScheme) {
        if (residue[0] !== informationContentProfileChainId) {
            structureResidueSchemeInformationContentProfile.push("d");
        } else {
            if ((currentResidueIndex >= informationContentProfileStart) && (currentResidueIndex <= informationContentProfileEnd)) {
                var residueInformationContent = regionInformationContentProfile[informationContentProfileRegionResidueIndex];
                structureResidueSchemeInformationContentProfile.push(residueInformationContent);
                informationContentProfileRegionResidueIndex += 1;
                if (residueInformationContent !== "i") {
                    alignmentResidueIndices.push({residueIndex: currentResidueIndex, PDBMonId: residue[1], entityId: residue[2], asymId: residue[3]});
                }    
            } else {
                structureResidueSchemeInformationContentProfile.push("m");
            }
            currentResidueIndex += 1;
        }
    }
//    console.log(structureResidueSchemeInformationContentProfile);
//    console.log(alignmentResidueIndices);
    var structureInformationContentProfile = [];
    for (var i = 0; i < structureResidueScheme.length; i += 1) {
        if (structureResidueScheme[i][1] !== "?") {
            structureInformationContentProfile.push(structureResidueSchemeInformationContentProfile[i]);
        }
    }
//    console.log(structureInformationContentProfile);
    visualizeMolecule(moleculeData, alignmentResidueIndices, structureInformationContentProfile);
}

function visualizeMolecule(moleculeData, alignmentResidueIndices, structureInformationContentProfile) {
//    console.log(conservationColorScale);
    var structureInformationContentColors = ["firstEntrySkipped",];
    for (var i = 0; i < structureInformationContentProfile.length; i += 1) {
        if (structureInformationContentProfile[i] === "d") {
            var color = {r: 0.839, g: 0.910, b: 0.976};
        } else if (structureInformationContentProfile[i] === "m") {
            var color = {r: 0.749, g: 0.937, b: 0.561};
        } else if (structureInformationContentProfile[i] === "i") {
            var color = {r: 0.749, g: 0.937, b: 0.561};
        } else {
            var colorId = Math.round(255 * structureInformationContentProfile[i]);
            var color = {r: conservationColorScale[colorId][0], g: conservationColorScale[colorId][1], b: conservationColorScale[colorId][2]};
        }
        structureInformationContentColors.push(color);
    }
//    console.log(structureInformationContentColors);
    var pdbId = moleculeData[0].split("_")[0];
    plugin.destroy();
    LiteMolWrapper(structureInformationContentColors);
    window.plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#FFFFFF", layoutState: {hideControls: true}});
    plugin.loadMolecule({id: pdbId, url: "https://www.ebi.ac.uk/pdbe/static/entry/" + pdbId + "_updated.cif", format: "cif", modelRef: "pluginMoleculeModel"});
    var timeoutID = window.setTimeout(createAlignmentViewerBindings, 500, alignmentResidueIndices);
}

function createAlignmentViewerBindings(alignmentResidueIndices) {
    var selectedSequenceAlignmentString = d3.select("#selectedSequenceAlignment");
    var chainId = selectedSequenceAlignmentString.text().split("\t")[0];
    var alignedSeq = selectedSequenceAlignmentString.text().split("\t")[1];
    selectedSequenceAlignmentString.remove();
    printToSequenceAlignmentDiv(chainId + "\t", "selectedSequenceAlignment", false);
    selectedSequenceAlignmentString = undefined;
    selectedSequenceAlignmentString = d3.select("#selectedSequenceAlignment");
    var model = plugin.context.select("pluginMoleculeModel")[0];
    var residueCount = 0;
    for (var letter of alignedSeq) {
        if (letter === "-") {
            selectedSequenceAlignmentString.append("span")
                .text("-");
        } else {
            var residueIndexAttributes = alignmentResidueIndices[residueCount];
            var PDBMonId = residueIndexAttributes.PDBMonId;
            if (PDBMonId === "?") {
                selectedSequenceAlignmentString.append("span")
                    .text(letter)
                    .on("mouseover", function () {
                        d3.select(this)
                            .style("color", "white")
                            .style("background-color", "blue");
                    })
                    .on("mouseout", function () {
                        d3.select(this)
                            .style("color", "black")
                            .style("background-color", "white");
                    });
            } else {
                selectedSequenceAlignmentString.append("span")
                    .text(letter)
                    .attr("residueIndex", residueIndexAttributes.residueIndex)
                    .attr("entityId", residueIndexAttributes.entityId)
                    .attr("asymId", residueIndexAttributes.asymId)
                    .on("mouseover", function () {
                        d3.select(this)
                            .style("color", "white")
                            .style("background-color", "magenta");
                        var query = LiteMol.Core.Structure.Query.sequence(d3.select(this).attr("entityId"), d3.select(this).attr("asymId"), {seqNumber: d3.select(this).attr("residueIndex")}, {seqNumber: d3.select(this).attr("residueIndex")});
                        LiteMol.Bootstrap.Command.Molecule.Highlight.dispatch(plugin.context, {model: model, query: query, isOn: true});
                    })
                    .on("mouseout", function () {
                        d3.select(this)
                            .style("color", "black")
                            .style("background-color", "white");
                        var query = LiteMol.Core.Structure.Query.sequence(d3.select(this).attr("entityId"), d3.select(this).attr("asymId"), {seqNumber: d3.select(this).attr("residueIndex")}, {seqNumber: d3.select(this).attr("residueIndex")});
                        LiteMol.Bootstrap.Command.Molecule.Highlight.dispatch(plugin.context, {model: model, query: query, isOn: false});
                    });
            }
            residueCount += 1;
        }
    }
}

/*----------------------------------------------------------------------------*/

function readInputHMMFileCallback(reader, HMMFile) {
    window.HMMConsensusSequence = reader.result.split("\n").filter(function (line) {return (line.trim().split(/\s+/g).length === 26);}).map(function (line) {return line.split(/\s+/g).slice(-4, -3)[0];}).join("");
//    console.log(HMMConsensusSequence);
    HMMInputHmmsearchRequest(HMMFile);
}

function HMMInputHmmsearchRequest(HMMFile) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/search/hmmsearch";
    var data = new FormData();
    data.append("algo", "hmmsearch");
    data.append("file", HMMFile);
    data.append("seqdb", "pdb");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = HMMInputHmmsearchCallback.bind(this, request, HMMFile);
    printToInfoBoxDiv("Starting hmmsearch search against the PDB");
    request.send(data);
}

function HMMInputHmmsearchCallback(request, HMMFile) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        printToInfoBoxDiv("hmmsearch search against the PDB finished, results: ", responseURL);
        var hits = JSON.parse(request.response)["results"]["hits"];	// all hits, incl. high E-value
//        console.log(hits);
        printToInfoBoxDiv("Checking hits ...");
        if (hits.length === 0) {
            printToInfoBoxDiv("ERROR: no structures were found using hmmsearch search.", "", "red");
            enableInputButtons();
            throw new Error("No structures were found using hmmsearch search.");
        }
        generateReferenceStructuresList(hits);
        window.HMMInputHmmsearchDomainAlignments = [];
        for (var hit of hits) {
            var domains = hit["domains"];
            for (var domain of domains) {
                if (domain["is_reported"] === 1) {
                    var aliSeq = domain["aliaseq"];
                    var hmmStart = domain["alihmmfrom"];
                    var hmmEnd = domain["alihmmto"];
                    var seqStart = domain["alisqfrom"];
                    var seqName = domain["alisqname"];
                    var seqEnd = domain["alisqto"];
                    HMMInputHmmsearchDomainAlignments.push([aliSeq, hmmStart, hmmEnd, seqStart, seqName, seqEnd]);
                }
            }
        }
//        console.log(HMMInputHmmsearchDomainAlignments);
        skylignURLRequest(HMMFile);
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 400)) {
        printToInfoBoxDiv("ERROR: something went wrong with your search. Did you upload a valid profile HMM file ?", "", "red");
        enableInputButtons();
        throw new Error("Something went wrong with your search. Did you upload a valid HMM file ?");
    }
}

/*----------------------------------------------------------------------------*/

function readInputSavePointFileCallback(reader, savePointFile) {
    try {
        var savePoint = JSON.parse(reader.result);
    } catch (e) {
        printToInfoBoxDiv("ERROR: input doesn't look like a JSON file.", "", "red");
        enableInputButtons();
        throw new Error("Input doesn't look like a JSON file.");
    }
//    console.log(savePoint);
    printToInfoBoxDiv("Checking input save point file ...");
    checkSavePoint(savePoint);
    document.querySelector("#scalingSelection").value = savePoint.normalizationMethod;
    printToInfoBoxDiv("Printing profile HMM consensus sequence");
    printSequencePositionIndices(savePoint.HMMConsensusSequence.length);
    printToSequenceAlignmentDiv("CONS\t" + savePoint.HMMConsensusSequence);
    if (savePoint.alignedInputSequence) {
        printToInfoBoxDiv("Printing input sequence alignment");
        printToSequenceAlignmentDiv("INPUT\t" + savePoint.alignedInputSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join(""));
    }
    printToInfoBoxDiv("Plotting profile HMM information content profile");
    plotInformationContentProfile(savePoint.informationContentProfile, savePoint.maxTheoreticalInformationContent);
    plotInformationContentColorScale(savePoint.colorScalePlotParameters[0], savePoint.colorScalePlotParameters[1]);
    enableInputButtons();
    printToInfoBoxDiv("Plotting profile HMM structure coverage");
    plotDomainCoverage(savePoint.informationContentProfile.length, savePoint.domainInformationContentProfiles, savePoint);
    if (Object.keys(savePoint).indexOf("domainIndex") !== -1) {
        d3.select("#domainCoverageRect" + savePoint.domainIndex).attr("fill", "springgreen");
        var moleculeData = savePoint.domainInformationContentProfiles[savePoint.domainIndex][0];
        printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing alignment");
        var alignedSequence = savePoint.domainInformationContentProfiles[savePoint.domainIndex][2];
        var hmmStart = savePoint.domainInformationContentProfiles[savePoint.domainIndex][1].hmmStart;
        var hmmEnd = savePoint.domainInformationContentProfiles[savePoint.domainIndex][1].hmmEnd;
        printToSequenceAlignmentDiv(moleculeData[0] + "\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePoint.informationContentProfile.length - hmmEnd), "selectedSequenceAlignment");
        moleculemmCIFRequest(moleculeData);
    }
    if (Object.keys(savePoint).indexOf("selectedStructure") !== -1) {
        var domain = savePoint.selectedStructure;
        createStructureSelectionOptions([domain,]);
        window.savePointInformationContentProfileLength = savePoint.informationContentProfile.length;
        document.querySelector("#structureSelection").disabled = false;
        document.querySelector("#selectStructureButton").disabled = false;
        var moleculeData = domain[0];
        printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing alignment");
        var alignedSequence = domain[2];
        var hmmStart = domain[1].hmmStart;
        var hmmEnd = domain[1].hmmEnd;
        printToSequenceAlignmentDiv(moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePoint.informationContentProfile.length - hmmEnd), "selectedSequenceAlignment");
        moleculemmCIFRequest(moleculeData);
    }
    printToInfoBoxDiv("DONE !");
}

function checkSavePoint(savePoint) {
    if (Object.keys(savePoint).indexOf("informationContentProfile") === -1) {
        printToInfoBoxDiv("ERROR: input doesn't look like a save point file.", "", "red");
        enableInputButtons();
        throw new Error("Input doesn't look like a save point file.");
    }
}
