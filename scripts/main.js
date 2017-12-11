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

function printToInfoBoxDiv(text, link = "") {
    var infoBoxDiv = document.getElementById("infoBoxDiv");
    var newParagraph = document.createElement("p");
    var timeAndDate = new Date();
    var timeAndDateString = timeAndDate.toLocaleDateString() + " " + timeAndDate.toLocaleTimeString();
    var newParagraphText = document.createTextNode(timeAndDateString + " >>> " + text);
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

function printToSequenceAlignmentDiv(text, id = "", color = "black") {
    var sequenceAlignmentDiv = document.getElementById("sequenceAlignmentDiv");
    var newParagraph = document.createElement("p");
    newParagraph.id = id;
    newParagraph.style.color = color;
    var newParagraphText = document.createTextNode(text);
    newParagraph.appendChild(newParagraphText);
    sequenceAlignmentDiv.appendChild(newParagraph);
}

/*----------------------------------------------------------------------------*/

function initialize() {
    document.querySelector("#createSavePointFileButton").disabled = true;
    d3.select("#structureSelection").selectAll("*").remove();
    document.querySelector("#structureSelection").disabled = true;
    document.querySelector("#selectStructureButton").disabled = true;
    document.querySelector("#applyScalingButton").disabled = true;
    d3.select("#informationContentProfileSVG").selectAll("*").remove();
    d3.select("#domainCoverageSVG").selectAll("*").remove();
    d3.select("#sequenceAlignmentDiv").selectAll("*").remove();
    if (window.plugin) {
        plugin.destroy();
    }
    LiteMolCallback();
    window.plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#FFFFFF", layoutState: {hideControls: true}});
//    window.plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#FFFFFF"});
    d3.select("#informationContentColorScaleSVG").selectAll("*").remove();
}

initialize();
document.querySelector("#scalingSelection").value = "linearAbsolute";

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
    window.inputSequence = document.querySelector("#sequenceInput").value.toUpperCase().replace(/\s+/g, "");
    printToInfoBoxDiv("Accepted sequence (" + inputSequence.length + " residues): " + inputSequence);
    printToInfoBoxDiv("Checking input ...");
    checkInputSequence(inputSequence);
    phmmerRequest(inputSequence, "uniprotrefprot", phmmerCallback);
}

function checkInputSequence(seq) {
    var seqLength = seq.length;
    var seqUniqueCharacters = new Set(seq);
    var nucleotides = new Set("ACGT");
    if (seqLength < 10) {
        printToInfoBoxDiv("ERROR: input sequence must contain at least 10 characters.");
        enableInputButtons();
        throw new Error("Input sequence must contain at least 10 characters.");
    }
    if ((seqLength === 10) && (seqUniqueCharacters.size < 6)) {
        printToInfoBoxDiv("ERROR: at least 6 unique characters must be present in an input sequence containing exactly 10 characters.");
        enableInputButtons();
        throw new Error("At least 6 unique characters must be present in an input sequence containing exactly 10 characters.");
    }
    if ((seqLength > 10) && (seqUniqueCharacters.size === (seqUniqueCharacters.intersection(nucleotides)).size)) {
        printToInfoBoxDiv("ERROR: at least 1 character which is not A/C/G/T must be present in an input sequence containing more than 10 characters.");
        enableInputButtons();
        throw new Error("At least 1 character which is not A/C/G/T must be present in an input sequence containing more than 10 characters.");
    }
}

document.querySelector("#exampleSequenceInputButton").onclick = function() {
    document.querySelector("#sequenceInput").value = "MERKRGRQTYTRYQTLELEKEFHFNRYLTRRRRIEIAHALSLTERQIKIWFQNRRMKWKKEN";
}

document.querySelector("#clearSequenceInputButton").onclick = function() {
    document.querySelector("#sequenceInput").value = "";
}

document.querySelector("#submitHMMButton").onclick = function() {
    if (document.querySelector("#HMMInput").files.length === 0) {
        printToInfoBoxDiv("ERROR: no file was selected.");
        throw new Error("No file was selected.");
    }
    initialize();
    disableInputButtons();
    window.inputMode = "HMM";
    var inputHMMFile = document.querySelector("#HMMInput").files[0];
    printToInfoBoxDiv("Accepted HMM file: " + inputHMMFile.name);
    var reader = new FileReader();
    reader.onload = readInputHMMFileCallback.bind(this, reader, inputHMMFile);
    reader.readAsText(inputHMMFile);
}

document.querySelector("#loadSavePointButton").onclick = function() {
    if (document.querySelector("#savePointInput").files.length === 0) {
        printToInfoBoxDiv("ERROR: no file was selected.");
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
    var savePoint = returnOriginalSavePoint();
    savePoint.selectedStructure = domain;
    updateSavePoint(savePoint);
    var moleculeData = domain[0];
    printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing sequence alignment ...");
    var alignedSequence = domain[2];
    var hmmStart = domain[1].hmmStart;
    var hmmEnd = domain[1].hmmEnd;
    d3.select("#selectedSequenceAlignment").remove();
    printToSequenceAlignmentDiv(moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePoint.informationContentProfile.length - hmmEnd), "selectedSequenceAlignment");
    representativeMoleculemmCIFRequest(moleculeData, representativeMoleculemmCIFCallback);
}

document.querySelector("#applyScalingButton").onclick = function() {
    initialize();
    normalizeInformationContentProfile();
}

/*----------------------------------------------------------------------------*/

function phmmerRequest(seq, seqdb, callback) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/search/phmmer";
    var data = new FormData();
    data.append("algo", "phmmer");
    data.append("seq", seq);
    data.append("seqdb", seqdb);
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "text/html");
    request.onreadystatechange = callback.bind(this, request);
    printToInfoBoxDiv("Starting phmmer search against UniProt reference proteomes.");
    request.send(data);
}

function phmmerCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        printToInfoBoxDiv("phmmer search against UniProt reference proteomes finished, results: ", responseURL);
        var jobID = responseURL.split("/")[6];
        printToInfoBoxDiv("Checking significant hits ...");
        checkSignificantHitsRequest(jobID, checkSignificantHitsCallback);
    }
}

function checkSignificantHitsRequest(jobID, callback) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/results/" + jobID + "?range=1,1&ali=0&output=json";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = callback.bind(this, request, jobID);
    request.send(null);
}

function checkSignificantHitsCallback(request, jobID) {
    var topResultsStats = JSON.parse(request.response)["results"]["stats"];
    if (Number(topResultsStats["nhits"]) === 0) {
        printToInfoBoxDiv("ERROR: no hits were found using phmmer search.");
        enableInputButtons();
        throw new Error("No hits were found using phmmer search.");
    }
    if (Number(topResultsStats["nincluded"]) === 0) {
        printToInfoBoxDiv("ERROR: no significant hits were found using phmmer search.");
        enableInputButtons();
        throw new Error("No significant hits were found using phmmer search.");
    }
    hmmsearchRequest(jobID, hmmsearchCallback);
}

function hmmsearchRequest(jobID, callback) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer//search/hmmsearch?uuid=" + jobID + ".1";
    var data = new FormData();
    data.append("algo", "hmmsearch");
    data.append("seqdb", "pdb");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request, jobID);
    printToInfoBoxDiv("Starting hmmsearch search against PDB.");
    request.send(data);
}

function hmmsearchCallback(request, jobID) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        printToInfoBoxDiv("hmmsearch search against PDB finished, results: ", responseURL);
        var hits = JSON.parse(request.response)["results"]["hits"];	// all hits, incl. high E-value
//        console.log(hits);
        printToInfoBoxDiv("Checking hits ...");
        if (hits.length === 0) {
            printToInfoBoxDiv("ERROR: no structures were found using hmmsearch search.");
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
        phmmerResultsHMMRequest(responseURL, phmmerResultsHMMCallback);
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 400)) {
        delayedHmmsearchRequest(jobID);
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 500)) {
        printToInfoBoxDiv("ERROR: something went wrong during hmmsearch search.");
        enableInputButtons();
        throw new Error("Something went wrong during hmmsearch search.");
    }
}

function generateReferenceStructuresList(hits) {
    var referenceStructuresList = [];
    for (var hit of hits) {
        var line = hit["acc"] + "\t" + hit["pdbs"].filter(function (id) {return (id !== hit["acc"]);}).sort().join(" ");
        referenceStructuresList.push(line);
    }
    var referenceStructuresListBlob = new Blob([referenceStructuresList.join("\n")], {type: "text/plain"});
    var referenceStructuresAnchor = document.querySelector("#referenceStructuresListAnchor");
    referenceStructuresAnchor.href = URL.createObjectURL(referenceStructuresListBlob);
}

function delayedHmmsearchRequest(jobID) {
    printToInfoBoxDiv("Status 400, trying again ...");
    var timeoutID = window.setTimeout(hmmsearchRequest, 2000, jobID, hmmsearchCallback);
}

function phmmerResultsHMMRequest(resultsURL, callback) {
    var url = resultsURL.replace("results", "download") + "?format=hmm";
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = callback.bind(this, request);
    printToInfoBoxDiv("Requesting phmmer search results HMM ...");
    request.send(null);
}

function phmmerResultsHMMCallback(request) {
    var phmmerResultsHMM = request.response;	// HMM from high-scoring (above threshold) phmmer search hits
//    console.log(phmmerResultsHMM);
    window.HMMConsensusSequence = phmmerResultsHMM.split("\n").filter(function (line) {return (line.trim().split(/\s+/g).length === 26);}).map(function (line) {return line.split(/\s+/g).slice(-4, -3)[0];}).join("");
//    console.log(HMMConsensusSequence);
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
    var hmmBlob = new Blob([hmm], {type: "text/plain"});
    request.onreadystatechange = callback.bind(this, request, hmmBlob);
    printToInfoBoxDiv("Aligning input sequence to the phmmer search results HMM ...");
    request.send(data);
}

function alignInputToHMMCallback(request, hmmBlob) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        window.alignedInputSequence = request.response.split("\n")[2].split(/\s+/)[1];
//        console.log(alignedInputSequence);
        skylignURLRequest(hmmBlob, skylignURLCallback);
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
    printToInfoBoxDiv("Requesting HMM information content calculation.");
    request.send(data);
}

function skylignURLCallback(request) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = JSON.parse(request.response)["url"];
        printToInfoBoxDiv("HMM information content calculation finished, results: ", responseURL);
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
    window.normalizeInformationContentProfile = normalizeInformationContentProfileCallback.bind(this, logo, informationContentProfile);
    normalizeInformationContentProfile();
}

function normalizeInformationContentProfileCallback(logo, informationContentProfile) {
    var savePointObject = new Object();
    savePointObject.HMMConsensusSequence = HMMConsensusSequence;
    printToInfoBoxDiv("Printing HMM consensus sequence ...");
    printSequencePositionIndices(HMMConsensusSequence.length);
    printToSequenceAlignmentDiv("CONS\t" + HMMConsensusSequence);
    if (inputMode === "sequence") {
        savePointObject.alignedInputSequence = alignedInputSequence;
        printToInfoBoxDiv("Printing input sequence alignment ...");
        printToSequenceAlignmentDiv("INPUT\t" + alignedInputSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join(""));
    }
    savePointObject.informationContentProfile = informationContentProfile;
    var maxObservedInformationContent = informationContentProfile.reduce(function (a, b) {return Math.max(a, b);});
    var maxExpObservedInformationContent = Math.exp(maxObservedInformationContent);
    var maxTheoreticalInformationContent = Number(logo["max_height_theory"]);
    savePointObject.maxTheoreticalInformationContent = maxTheoreticalInformationContent;
    var maxExpTheoreticalInformationContent = Math.exp(maxTheoreticalInformationContent);
    printToInfoBoxDiv("Plotting HMM information content profile ...");
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
    chart.append("g")
        .attr("transform", "translate(0, " + chartHeight + ")")
        .call(d3.axisBottom(x));
    chart.append("g")
        .call(d3.axisLeft(y));
    chart.append("text")
        .text("HMM position")
        .attr("transform", "translate(" + (chartWidth / 2) + ", " + (chartHeight + 35) +")")
        .attr("font-size", 14)
        .attr("text-anchor", "middle");
    svg.append("text")
        .text("Information content (bits)")
        .attr("transform", "translate(20, " + (chartMargin.top + (chartHeight / 2)) + ")rotate(-90)")
        .attr("font-size", 14)
        .attr("text-anchor", "middle");
    chart.append("path")
        .datum(profile)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);
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
            .text("Information content (bits)")
            .attr("transform", "translate(" + (chartWidth / 2) + ", " + (chartHeight + 35) +")")
            .attr("font-size", 14)
            .attr("text-anchor", "middle");
    } else if (method === "exponential") {
        chart.append("text")
            .text("exp[information content (bits)]")
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
    printToInfoBoxDiv("Plotting HMM structure coverage ...");
    plotDomainCoverage(hmmInformationContentProfile.length, domainInformationContentProfiles, savePoint);
}

function updateSavePoint(savePoint) {
    var savePointBlob = new Blob([JSON.stringify(savePoint)], {type: "application/json"});
    var savePointAnchor = document.querySelector("#createSavePointFileAnchor");
    savePointAnchor.href = URL.createObjectURL(savePointBlob);
}

function createStructureSelectionOptions(domains) {
    var select = document.getElementById("structureSelection");
    for (var domain of domains) {
        var option = document.createElement("option");
        option.text = domain[0][0] + " " + domain[0][1].toString() + "-" + domain[0][2].toString() + " (HMM " + domain[1].hmmStart.toString() + "-" + domain[1].hmmEnd.toString() + ")";
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
        .text("HMM position")
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
                savePoint.domainIndex = d3.select(this).attr("domainIndex");
                updateSavePoint(savePoint);
                chart.selectAll("rect").attr("fill", "MediumSeaGreen");
                d3.select(this).attr("fill", "springgreen");
                var moleculeData = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][0];
//                console.log(moleculeData);
                printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing sequence alignment ...");
                var alignedSequence = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][2];
                var hmmStart = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][1].hmmStart;
                var hmmEnd = domainInformationContentProfiles[d3.select(this).attr("domainIndex")][1].hmmEnd;
                d3.select("#selectedSequenceAlignment").remove();
                printToSequenceAlignmentDiv(moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(hmmLength - hmmEnd), "selectedSequenceAlignment");
                representativeMoleculemmCIFRequest(moleculeData, representativeMoleculemmCIFCallback);
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
        domainIndex += 1;
    }
    if (inputMode !== "savePoint") {
        printToInfoBoxDiv("DONE !");
    }
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
            structureResidueSchemeInformationContentProfile.push("d");
        } else {
            if ((currentResidueIndex >= informationContentProfileStart) && (currentResidueIndex <= informationContentProfileEnd)) {
                structureResidueSchemeInformationContentProfile.push(regionInformationContentProfile[informationContentProfileRegionResidueIndex]);
                informationContentProfileRegionResidueIndex += 1;
            } else {
                structureResidueSchemeInformationContentProfile.push("m");
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
    LiteMolCallback(structureInformationContentColors);
    window.plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#FFFFFF", layoutState: {hideControls: true}});
//    window.plugin = LiteMol.Plugin.create({target: "#litemol", viewportBackground: "#FFFFFF"});
    plugin.loadMolecule({id: pdbId, url: "https://www.ebi.ac.uk/pdbe/static/entry/" + pdbId + "_updated.cif", format: "cif"});
}

/*----------------------------------------------------------------------------*/

function readInputHMMFileCallback(reader, HMMFile) {
    window.HMMConsensusSequence = reader.result.split("\n").filter(function (line) {return (line.trim().split(/\s+/g).length === 26);}).map(function (line) {return line.split(/\s+/g).slice(-4, -3)[0];}).join("");
//    console.log(HMMConsensusSequence);
    HMMInputHmmsearchRequest(HMMFile, HMMInputHmmsearchCallback);
}

function HMMInputHmmsearchRequest(HMMFile, callback) {
    var url = "https://www.ebi.ac.uk/Tools/hmmer/search/hmmsearch";
    var data = new FormData();
    data.append("algo", "hmmsearch");
    data.append("file", HMMFile);
    data.append("seqdb", "pdb");
    var request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Accept", "application/json");
    request.onreadystatechange = callback.bind(this, request, HMMFile);
    printToInfoBoxDiv("Starting hmmsearch search against PDB.");
    request.send(data);
}

function HMMInputHmmsearchCallback(request, HMMFile) {
    if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 200)) {
        var responseURL = request.responseURL;
        printToInfoBoxDiv("hmmsearch search against PDB finished, results: ", responseURL);
        var hits = JSON.parse(request.response)["results"]["hits"];	// all hits, incl. high E-value
//        console.log(hits);
        printToInfoBoxDiv("Checking hits ...");
        if (hits.length === 0) {
            printToInfoBoxDiv("ERROR: no structures were found using hmmsearch search.");
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
        skylignURLRequest(HMMFile, skylignURLCallback);
    } else if ((request.readyState === XMLHttpRequest.DONE) && (request.status === 400)) {
        printToInfoBoxDiv("ERROR: something went wrong with your search. Did you upload a valid HMM file ?");
        enableInputButtons();
        throw new Error("Something went wrong with your search. Did you upload a valid HMM file ?");
    }
}

/*----------------------------------------------------------------------------*/

function readInputSavePointFileCallback(reader, savePointFile) {
    try {
        var savePoint = JSON.parse(reader.result);
    } catch (e) {
        printToInfoBoxDiv("ERROR: input doesn't look like a JSON file.");
        enableInputButtons();
        throw new Error("Input doesn't look like a JSON file.");
    }
//    console.log(savePoint);
    printToInfoBoxDiv("Checking input ...");
    checkSavePoint(savePoint);
    document.querySelector("#scalingSelection").value = savePoint.normalizationMethod;
    printToInfoBoxDiv("Printing HMM consensus sequence ...");
    printSequencePositionIndices(savePoint.HMMConsensusSequence.length);
    printToSequenceAlignmentDiv("CONS\t" + savePoint.HMMConsensusSequence);
    if (savePoint.alignedInputSequence) {
        printToInfoBoxDiv("Printing input sequence alignment ...");
        printToSequenceAlignmentDiv("INPUT\t" + savePoint.alignedInputSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join(""));
    }
    printToInfoBoxDiv("Plotting HMM information content profile ...");
    plotInformationContentProfile(savePoint.informationContentProfile, savePoint.maxTheoreticalInformationContent);
    plotInformationContentColorScale(savePoint.colorScalePlotParameters[0], savePoint.colorScalePlotParameters[1]);
    enableInputButtons();
    printToInfoBoxDiv("Plotting HMM structure coverage ...");
    plotDomainCoverage(savePoint.informationContentProfile.length, savePoint.domainInformationContentProfiles, savePoint);
    if (Object.keys(savePoint).indexOf("domainIndex") !== -1) {
        d3.select("#domainCoverageRect" + savePoint.domainIndex).attr("fill", "springgreen");
        var moleculeData = savePoint.domainInformationContentProfiles[savePoint.domainIndex][0];
        printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing sequence alignment ...");
        var alignedSequence = savePoint.domainInformationContentProfiles[savePoint.domainIndex][2];
        var hmmStart = savePoint.domainInformationContentProfiles[savePoint.domainIndex][1].hmmStart;
        var hmmEnd = savePoint.domainInformationContentProfiles[savePoint.domainIndex][1].hmmEnd;
        printToSequenceAlignmentDiv(moleculeData[0] + "\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePoint.informationContentProfile.length - hmmEnd), "selectedSequenceAlignment");
        representativeMoleculemmCIFRequest(moleculeData, representativeMoleculemmCIFCallback);
    }
    if (Object.keys(savePoint).indexOf("selectedStructure") !== -1) {
        var domain = savePoint.selectedStructure;
        createStructureSelectionOptions([domain,]);
        var moleculeData = domain[0];
        printToInfoBoxDiv("Selected structure: " + moleculeData[0] + ", printing sequence alignment ...");
        var alignedSequence = domain[2];
        var hmmStart = domain[1].hmmStart;
        var hmmEnd = domain[1].hmmEnd;
        printToSequenceAlignmentDiv(moleculeData[0] +"\t" + "-".repeat(hmmStart - 1) + alignedSequence.split("").filter(function (letter) {return (letter === letter.toUpperCase());}).join("") + "-".repeat(savePoint.informationContentProfile.length - hmmEnd), "selectedSequenceAlignment");
        representativeMoleculemmCIFRequest(moleculeData, representativeMoleculemmCIFCallback);
    }
    printToInfoBoxDiv("DONE !");
}

function checkSavePoint(savePoint) {
    if (Object.keys(savePoint).indexOf("informationContentProfile") === -1) {
        printToInfoBoxDiv("ERROR: input doesn't look like a save point file.");
        enableInputButtons();
        throw new Error("Input doesn't look like a save point file.");
    }
}
