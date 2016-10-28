
// Database only contains publicyl available data, so read permissions O.K.
const firebaseApp = firebase.initializeApp({ databaseURL: "https://houseofcommons-d40a9.firebaseio.com"});
const mpsRef = firebaseApp.database().ref('/MembersOfParliament')

const height = 31;
const width =  23;

const provinces = [
    "All Provinces and Territories",
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Nova Scotia",
    "Northwest Territories",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon"
];
const parties = {
    'Conservative': 'CPC',
    'Liberal':'Lib',
    'Bloc Québécois': 'BQ',
    'Green Party': 'GP',
    'NDP': 'NDP',
    'Independent': 'IND'
};
const colours = {
    'Conservative': '#002395',
    'NDP': '#FF5800',
    'Bloc Québécois': '#0088CE',
    'Liberal': '#ed2e38',
    'Green Party': '#427730',
    'Independent': '#606860'
};

//  [a,b,] = [blockStart, blockEnd]
const seatingBlocks = [
    [0, 6],
    [8, 12],
    [14, 18],
    [20, 24],
    [26, 30],
    [32, 36],
    [38, 42],
    [44, 45],
    [47, 47]
];

seatingBlocks.forEach((block, index, self) => {

    let oppMps = getMps(0, 4, ...block);
    let govMps = getMps(7, 11, ...block);

    oppMps.then((mps) => {
        renderMps(mps, block, index, 'opposition');
    });

    govMps.then((mps) => {
        renderMps(mps, block, index, 'government');
    });
});

/* ////////////////////////////////////////////////////////////////////////////////////////////
// Retrieve MPs between row 'start' , row 'end' and column 'cloumnStart' and 'columnEnd'
// Firebase doesn't have much querying capabilites so function queries firebase by row
// then locally extracts data that meets columns condition
//////////////////////////////////////////////////////////////////////////////////////////////*/

function getMps(rowStart, rowEnd, columnStart, columnEnd) {

    let mpsArray = [];
    let _rowStart = rowStart < 10 ? `0${rowStart}` : rowStart.toString();
    let _rowEnd = rowEnd < 10 ? `0${rowEnd}` : rowEnd.toString();

    let blockRef = mpsRef
    .orderByChild('Row')
    .startAt(_rowStart)
    .endAt(_rowEnd);

    return blockRef
    .once('value')
    .then(getBlockMps);

    function getBlockMps(snapshot) {
        let mpsCollection = snapshot.val();

        // Convert huge json object to array
        for(let fullname in mpsCollection) {
            let column = mpsCollection[fullname].Column;

            // convert columns from leading zeroed num string to int e.g '06' to 6
            column = column[0] === "0" ? parseInt(column[1]): parseInt(column);
            if(column >= columnStart && column <= columnEnd) {
                mpsArray.push(mpsCollection[fullname]);
            }
        }
        return mpsArray;
    }
}

/* ////////////////////////////////////////////////////////////////////////////////////////////
// Draws all the MPS according to their coordinates and party Affiliation
// Assigns appropriate click handlers to each MP. Note that seat assignment is done
// by block, so a particular MP woud be found under <svg> ---> <g> ---> <rect>
//////////////////////////////////////////////////////////////////////////////////////////////*/

function renderMps(data, block, index, side) {

    let padding = 10;
    let blockStart = block[0];
    let blockEnd = block[1];
    let blockOffset = (blockStart * width) - (index * padding);

    // Group by seating block
    let opp = d3.select(`#${side}`)
        .append('g')
        .attr('width', 1024)
        .attr('height', 300)
        .attr('transform', (d) => {
            return `translate (${blockOffset}, 0)`;
        });

    // Assign block seats
    opp.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('height', height)
        .attr('width', width)
        .attr('fill', (d) => {
            return colours[d['Political Affiliation']];
        })
        .attr('x', getMpX)
        .attr('y', getMpY)
        .attr('status', 'dormant')
        .on('mouseover', renderMPCard)
        .on('mouseout', function(d) {
            $("#FloorPlanCard-Horizontal").css("visibility", "hidden");
            // d3.select(this).attr('fill', colours[d['Political Affiliation']]);
        })
        .on('click', handleMpClick)

    function handleMpClick(d) {

        let target = d3.select(this);
        let status = target.attr('status');

        if(status === 'active') {
            $("#FloorPlanCard-Horizontal").css("visibility", "hidden");
            target.attr('status', 'dormant');
            return ;
        }

        renderMPCard(d);
        return;
    }

    function getMpX(d) {
        let xOffset = width + 1;
        let xBlockOffset = d.Column - blockStart; // Column - blockStart is offset within block
        return xBlockOffset * xOffset;
    }

    function getMpY(d) {
        let yOffset = height + 1;
        return side == 'opposition' ? d.Row * yOffset: (d.Row - 7) * yOffset // Normalize gov mp rows
    }

    function renderMPCard(d) {

        let backgroundColour = colours[d['Political Affiliation']];

        $("#FloorPlanCardPhoto").attr("src", () => {
            let imgName=`${d.Lname}${d.Fname}_${parties[d["Political Affiliation"]]}`
            imgName = imgName.replace(/[' \.-]/g, ''); // Take care of middle name letters and hyphenated last names

            if (imgName === "GourdeJacques_CPC") imgName = "GourdeJaques_CPC" // type in source data
            if(imgName === "WattsDianneL_CPC") imgName = "WattsDianneLynn_CPC"; //Doesn't fit the pattern

            return  `http://www.parl.gc.ca/Parliamentarians/Images/OfficialMPPhotos/42/${imgName}.jpg`;
        });

        $("#PersonName").text(() => {
            let title = d['Honorific Title'];
            return `${title} ${d.Fname} ${d.Lname}`;
        });
        $("#CaucusName").text(d['Political Affiliation']);
        $("#ConstituencyName").text(d.Constituency);
        $("#ProvinceName").text(d.Province);
        $("#CaucusColour").css("background-color", backgroundColour);
        $("#FloorPlanCard-Horizontal").css("visibility", "visible");

        return;
    }
}

function handleOptionsChange() {

    let id = d3.select("#FloorPlan-ProvinceList").property('value');
    let gender = d3.select('#FloorPlan-GenderList').property('value');

    d3.selectAll('rect')
    .attr('opacity', (d) => {
        let isSameGender = (d.Gender === gender  || gender === 'A');
        let isSameProvince = (id == 0 || provinces[id] === d.Province);

        if (!isSameGender || !isSameProvince) return 0.3;
        return 1;
    });
}
