'use strict';

// Database only contains publicyl available data, so read permissions O.K.
const height = 31;
const width =  23;

const provinces = [
    'All Provinces and Territories',
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Nova Scotia',
    'Northwest Territories',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon'
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


import {House} from './House.js'
const house = new House('https://houseofcommons-d40a9.firebaseio.com', '/MembersOfParliament')

seatingBlocks.forEach((block, index) => {

    let oppMps = house.getMps(0, 4, ...block);
    let govMps = house.getMps(7, 11, ...block);

    oppMps.then((mps) => {

        mps.forEach((mp) => house.getImage(mp)); // prefetch mp images
        renderMps(mps, block, index, 'opposition');
    });

    govMps.then((mps) => {
        mps.forEach((mp) => house.getImage(mp)); // prefetch mp images
        renderMps(mps, block, index, 'government');
    });
});


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
    let _block = d3.select(`#${side}`)
        .append('g')
        .attr('width', 1024)
        .attr('height', 300)
        .attr('transform', () => {
            return `translate (${blockOffset}, 0)`;
        });

    // Assign block seats
    _block.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', getMpX)
        .attr('y', getMpY)
        .attr('width', width)
        .attr('height', height)
        .attr('status', 'dormant')
        .attr('fill', (d) => colours[d['Political Affiliation']])
        .on('click', handleRectClick)
        .on('mouseover', function(d) {
            let visibility = $('#FloorPlanCard-Horizontal').css('visibility');
            if(visibility === 'hidden') renderMPCard(d);
        })
        .on('mouseout', (d) => {
            let status = $('#FloorPlanCard-Horizontal').attr('class');
            if(status === 'free') $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');
        });

    function handleRectClick(d) {

        let cardStatus = $('#FloorPlanCard-Horizontal').attr('class');
        let mpStatus = d3.select(this).attr('status');

        if(mpStatus === 'dormant') {
            d3.select(this).attr('status', 'active');
            $('#FloorPlanCard-Horizontal').attr('class', 'locked');
            $('#FloorPlanCard-Horizontal').css('visibility', 'visible');
        }
        else {
            d3.select(this).attr('status', 'dormant');
            $('#FloorPlanCard-Horizontal').attr('class', 'free');
            $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');
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
        return side === 'opposition' ? d.Row * yOffset: (d.Row - 7) * yOffset; // Normalize gov mp rows
    }

    function renderMPCard(d) {

        let title = d['Honorific Title'];
        let personName =  `${title} ${d.Fname} ${d.Lname}`;
        let backgroundColour = colours[d['Political Affiliation']];

        $('#FloorPlanCardPhoto').attr('src', d.ImgUrl);
        $('#PersonName').text(personName);
        $('#CaucusName').text(d['Political Affiliation']);
        $('#ConstituencyName').text(d.Constituency);
        $('#ProvinceName').text(d.Province);
        $('#CaucusColour').css('background-color', backgroundColour);
        $('#FloorPlanCard-Horizontal').css('visibility', 'visible');

        return;
    }
}


// Filter by province and/or gender
$('.FloorPlan-RefinerValues').change(handleFilterChange);

/* ////////////////////////////////////////////////////////////////////////////////////////////
// This function (callback) highlight MPs that meet the users specification of gender
// and/or province. MPs that don't are 'defocused'
//////////////////////////////////////////////////////////////////////////////////////////////*/

function handleFilterChange() {

    let provinceId = $('#FloorPlan-ProvinceList').val();
    let gender = $('#FloorPlan-GenderList').val();

    d3.selectAll('rect')
    .attr('opacity', (d) => {
        let isSameGender = (d.Gender === gender  || gender === 'A');
        let isSameProvince = (provinceId === '0' || provinces[provinceId] === d.Province);

        return (!isSameGender || !isSameProvince) ? 0.3 : 1;
    });

    // Hide the MP card
    $('#FloorPlanCard-Horizontal').attr('class', 'free');
    $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');

    return;
}