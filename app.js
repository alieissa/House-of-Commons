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

    return;
}

function clearRefiners() {

    $('#FloorPlan-ProvinceList').val('All');
    $('#FloorPlan-GenderList').val('Both');

    return;
}

function clearSearchBox() {

    $('#FloorPlan-ClearFindMP').addClass('hidden');
    $('#FloorPlan-FindMPInput').val('');

    return;
}

function handleClearFindMPClick () {

    if($('#FloorPlan-FindMP').attr('status') === 'active') {
        $('#FloorPlan-FindMP').attr('status', 'dormant');
        d3.selectAll('rect').attr('opacity', 1);
    }

    let message = '334 Members currently have seats in the House of Commons (88 Females, 246 Males)';
    $('#FloorPlanCard-FilterTitle').html(message);
    $('#FloorPlanCard-FilterTitle').attr('class', 'FloorPlanCard-FilterTitle-LeftAligned');
    clearSearchBox();

    return;
}

function handleProvRefinerChange() {

    let provinceId = $('#FloorPlan-ProvinceList').val();
    let gender = $('#FloorPlan-GenderList').val();
    let selector = provinceId === 'All' ? 'rect' : `[province="${provinces[provinceId]}"]`;

    let totalCount = d3.selectAll(`${selector}`).size();
    let femaleCount = d3.selectAll(`${selector}[gender="F"]`).size()
    let maleCount = d3.selectAll(`${selector}[gender="M"]`).size()

    let message = ` ${totalCount} Members currently have seats in the House of Commons (${femaleCount} Females, ${maleCount} Males)`;
    message = provinceId === 'All' ? message :  `${provinces[provinceId]}: ${message}`;

    $('#FloorPlanCard-FilterTitle').html(message);
    $('#FloorPlanCard-FilterTitle').attr('class', 'FloorPlanCard-FilterTitle-LeftAligned');
    setFilteredOpacity(provinces[provinceId], gender);

    return;
}

/* ////////////////////////////////////////////////////////////////////////////////////////////
// This function (callback) highlight MPs that meet the users specification of gender
// and/or province. MPs that don't are 'defocused'
//////////////////////////////////////////////////////////////////////////////////////////////*/

function handleGenderRefinerChange() {

    let provinceId = $('#FloorPlan-ProvinceList').val();
    let gender = $('#FloorPlan-GenderList').val();

    setFilteredOpacity(provinces[provinceId], gender);

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

    // Put MPs that match search criteria in focus. defocus others.
    if(mps.includedMPs.size() > 0) {
        mps.excludedMPs.attr('opacity', 0.3);
        mps.includedMPs.attr('opacity', 1);
        $('#FloorPlan-FindMP').attr('status', 'active');
    }
        // Show everyone, then hide clear button
    else {

        d3.selectAll('rect').attr('opacity', 1);
        $('#FloorPlan-ClearFindMP').addClass('hidden');
        $('#FloorPlan-FindMP').attr('status', 'dormant');
    }

    // Show result of search
    $('#FloorPlanCard-FilterTitle').html(`${mps.includedMPs.size()} Search Result`);
    $('#FloorPlanCard-FilterTitle').attr('class', 'FloorPlanCard-FilterTitle-RightAligned');

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
        .attr('gender', (d) => d.Gender)
        .attr('province', (d) => d.Province)
        .on('click', handleRectClick)
        .on('mouseout', handleRectMouseout)
        .on('mouseover', handleRectMouseover)
        .attr('fill', (d) => colours[d['Political Affiliation']]);

    return;
}

function setFilteredOpacity(province, gender) {

    let selector;

    if(province === 'All' && gender === 'Both') {
        d3.selectAll('rect').attr('opacity', 1);
        return;
    }

    if(province === 'All' && gender !== 'Both') {
        selector = `[gender="${gender}"]`;
    }
    else if(province !== 'All' && gender === 'Both') {
        selector = `[province="${province}"]`;
    }
    else {
        selector = `[province="${province}"][gender="${gender}"]`
    }

    d3.selectAll('rect').attr('opacity', 0.3);
    d3.selectAll(selector).attr('opacity', 1);

    return;
}

$('#FloorPlan-ProvinceList').change(handleProvRefinerChange)
$('#FloorPlan-GenderList').change(handleGenderRefinerChange)

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
