'use strict';

import {House} from './House.js';

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

const house = new House('https://houseofcommons-d40a9.firebaseio.com', '/MembersOfParliament');

function clearMPCard() {

    $('#FloorPlanCard-Horizontal').attr('class', 'free');
    $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');
}

function clearRefiners() {

    $('#FloorPlan-ProvinceList').val(0); // Set to All provinces
    $('#FloorPlan-GenderList').val('A'); // Set to Both Geders
}

function clearSearchBox() {

    $('#FloorPlan-ClearFindMP').addClass('hidden');
    $('#FloorPlan-FindMPInput').val('');
}

function handleClearFindMPClick () {

    if($('#FloorPlan-FindMP').attr('status') === 'active') {
        $('#FloorPlan-FindMP').attr('status', 'dormant');
        d3.selectAll('rect').attr('opacity', 1);
    }

    clearSearchBox();
    return;
    // clearRefiners();

}

/* ////////////////////////////////////////////////////////////////////////////////////////////
// This function (callback) highlight MPs that meet the users specification of gender
// and/or province. MPs that don't are 'defocused'
//////////////////////////////////////////////////////////////////////////////////////////////*/

function handleFilterChange() {

    let provinceId = $('#FloorPlan-ProvinceList').val();
    let gender = $('#FloorPlan-GenderList').val();
    let setOpacity = (d) => {

        let isSameGender = (d.Gender === gender  || gender === 'A');
        let isSameProvince = (provinceId === '0' || provinces[provinceId] === d.Province);

        return (!isSameGender || !isSameProvince) ? 0.3 : 1;
    };

    d3.selectAll('rect').attr('opacity', setOpacity);

    clearMPCard();
    clearSearchBox();

    return;
}

function handleFindMPButtonClick() {

    // If search filter is empty do nothing
    if($('#FloorPlan-FindMPInput').val() === '') {
        return;
    }

    $('#FloorPlan-ClearFindMP').removeClass();
    clearMPCard();
    clearRefiners();

    let searchTerm = $('#FloorPlan-FindMPInput').val();
    let mps = house.separateMPs(searchTerm);

    if(mps.includedMPs.size() > 0) {
        mps.excludedMPs.attr('opacity', 0.3); //defocus
        mps.includedMPs.attr('opacity', 1);
        $('#FloorPlan-FindMP').attr('status', 'active');
    }
    else {
        // Show everyone, then hide clear button
        d3.selectAll('rect').attr('opacity', 1);
        $('#FloorPlan-ClearFindMP').addClass('hidden');
        $('#FloorPlan-FindMP').attr('status', 'dormant');
    }

    return;
}

function handleRectClick(mp) {

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

    renderMPCard(mp);
    return;
}

function handleRectMouseout() {

    let status = $('#FloorPlanCard-Horizontal').attr('class');
    if(status === 'free') {
        $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');
    }

    return;
}

function handleRectMouseover(mp) {

   let visibility = $('#FloorPlanCard-Horizontal').css('visibility');
   if(visibility === 'hidden') {
       renderMPCard(mp);
   }

   return;
}

function handleTBCKeypress() {

    if($('#FloorPlan-ClearFindMP').hasClass('hidden')) {
        $('#FloorPlan-ClearFindMP').removeClass('hidden');
    }
    return;
}

function renderMPCard(mp) {

    let title = mp['Honorific Title'];
    let personName =  `${title} ${mp.Fname} ${mp.Lname}`;
    let backgroundColour = colours[mp['Political Affiliation']];

    $('#FloorPlanCardPhoto').attr('src', mp.ImgUrl);
    $('#PersonName').text(personName);
    $('#CaucusName').text(mp['Political Affiliation']);
    $('#ConstituencyName').text(mp.Constituency);
    $('#ProvinceName').text(mp.Province);
    $('#CaucusColour').css('background-color', backgroundColour);
    $('#FloorPlanCard-Horizontal').css('visibility', 'visible');

    return;
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
    let getMpX = function(d) {

        let xOffset = width + 1;
        let xBlockOffset = d.Column - blockStart; // Column - blockStart is offset within block
        return xBlockOffset * xOffset;
    };
    let getMpY = function(d) {

        let yOffset = height + 1;
        return side === 'opposition' ? d.Row * yOffset: (d.Row - 7) * yOffset; // Normalize gov mp rows
    };

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
        .on('click', handleRectClick)
        .on('mouseout', handleRectMouseout)
        .on('mouseover', handleRectMouseover)
        .attr('fill', (d) => colours[d['Political Affiliation']]);

    return;
}

$('.FloorPlan-RefinerValues').change(handleFilterChange);
$('#FloorPlan-TextboxContainer').keypress(handleTBCKeypress);
$('#FloorPlan-FindMPButton').click(handleFindMPButtonClick);
$('#FloorPlan-ClearFindMP').click(handleClearFindMPClick);


// App 'entry point'
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
