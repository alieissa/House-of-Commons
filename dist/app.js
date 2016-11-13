(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var parties = {
    'Conservative': 'CPC',
    'Liberal': 'Lib',
    'Bloc Québécois': 'BQ',
    'Green Party': 'GP',
    'NDP': 'NDP',
    'Independent': 'IND'
};

var House = exports.House = function () {
    function House(databaseUrl, rootRef) {
        _classCallCheck(this, House);

        try {
            var _fb = firebase.initializeApp({ databaseURL: databaseUrl });

            this.db = _fb.database();
            this.rootRef = this.db.ref(rootRef);
        } catch (error) {
            throw 'Encountered error trying to create firebase app', error;
        }
    }

    /* ////////////////////////////////////////////////////////////////////////////////////////////
    // Prefetches the image of an MP. This will make the transition between MP profiles
    // on mouseover mouseout events appear smooth.
    //////////////////////////////////////////////////////////////////////////////////////////////*/

    _createClass(House, [{
        key: 'getImage',
        value: function getImage(mp) {

            var img = new Image();
            img.onerror = function (error) {
                console.log('Unable to get image for ' + mp.Fname + ' ' + mp.Lname);
                console.log(error);
            };

            if (typeof mp.ImgName === "undefined") {
                mp.ImgName = '' + mp.Lname + mp.Fname + '_' + parties[mp["Political Affiliation"]];
                mp.ImgName = mp.ImgName.replace(/[' \.-]/g, ''); // Take care of middle name letters and hyphenated last names
            }

            mp.ImgUrl = 'http://www.parl.gc.ca/Parliamentarians/Images/OfficialMPPhotos/42/' + mp.ImgName + '.jpg';
            img.src = mp.ImgUrl;

            return;
        }

        /* ////////////////////////////////////////////////////////////////////////////////////////////
        // Retrieve MPs between row 'start' , row 'end' and column 'cloumnStart' and 'columnEnd'
        // Firebase doesn't have much querying capabilites so function queries firebase by row
        // then locally extracts data that meets columns condition
        //////////////////////////////////////////////////////////////////////////////////////////////*/

    }, {
        key: 'getMps',
        value: function getMps(rowStart, rowEnd, columnStart, columnEnd) {
            var _this = this;

            var _rowStart = rowStart < 10 ? '0' + rowStart : rowStart.toString();
            var _rowEnd = rowEnd < 10 ? '0' + rowEnd : rowEnd.toString();

            return this.rootRef.orderByChild('Row').startAt(_rowStart).endAt(_rowEnd).once('value').then(function (snapshot) {
                return _this._handlegetMpsResult(snapshot, columnStart, columnEnd); //verbose but clear
            });
        }
    }, {
        key: '_handlegetMpsResult',
        value: function _handlegetMpsResult(snapshot, columnStart, columnEnd) {

            var mps = [];
            var result = snapshot.val();

            // Convert huge json object to array
            for (var name in result) {
                var mp = result[name];

                // convert columns from leading zeroed num string to int e.g '06' to 6
                if (mp.Column[0] === "0") {
                    mp.Column = mp.Column[1];
                }

                mp.Column = parseInt(mp.Column);
                if (mp.Column >= columnStart && mp.Column <= columnEnd) {
                    mps.push(mp);
                }
            }
            return mps;
        }
    }, {
        key: 'separateMPs',
        value: function separateMPs(searchTerm) {

            var setInclusion = function setInclusion(d) {

                var constNames = d.Constituency.split("—");

                // if search term in beginnig of any of riding names, then inConst is true
                var inConst = constNames.reduce(function (prev, curr, index) {
                    return prev || constNames[index].indexOf(searchTerm) === 0;
                }, false);

                var inFname = d.Lname.indexOf(searchTerm) === 0;
                var inLname = d.Fname.indexOf(searchTerm) === 0;

                return inFname || inLname || inConst ? 'included' : 'excluded';
            };

            d3.selectAll('rect').attr('inclusion', setInclusion);

            var separatedMPs = {
                includedMPs: d3.selectAll('[inclusion=included]'),
                excludedMPs: d3.selectAll('[inclusion=excluded]')
            };

            return separatedMPs;
        }
    }]);

    return House;
}();

},{}],2:[function(require,module,exports){
'use strict';

var _House = require('./House.js');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Database only contains publicyl available data, so read permissions O.K.
var height = 31;
var width = 23;

var provinces = ['All Provinces and Territories', 'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Northwest Territories', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'];
var colours = {
    'Conservative': '#002395',
    'NDP': '#FF5800',
    'Bloc Québécois': '#0088CE',
    'Liberal': '#ed2e38',
    'Green Party': '#427730',
    'Independent': '#606860'
};

//  [a,b,] = [blockStart, blockEnd]
var seatingBlocks = [[0, 6], [8, 12], [14, 18], [20, 24], [26, 30], [32, 36], [38, 42], [44, 45], [47, 47]];

var house = new _House.House('https://houseofcommons-d40a9.firebaseio.com', '/MembersOfParliament');

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

function handleClearFindMPClick() {

    if ($('#FloorPlan-FindMP').attr('status') === 'active') {
        $('#FloorPlan-FindMP').attr('status', 'dormant');
        d3.selectAll('rect').attr('opacity', 1);
    }

    var message = '334 Members currently have seats in the House of Commons (88 Females, 246 Males)';
    $('#FloorPlanCard-FilterTitle').html(message);
    $('#FloorPlanCard-FilterTitle').attr('class', 'FloorPlanCard-FilterTitle-LeftAligned');
    clearSearchBox();

    return;
}

function handleProvRefinerChange() {

    var gender = $('#FloorPlan-GenderList').val();
    var provinceId = $('#FloorPlan-ProvinceList').val();
    var province = provinceId === 'All' ? provinceId : provinces[provinceId];
    var selector = provinceId === 'All' ? 'rect' : '[province="' + provinces[provinceId] + '"]';

    var totalCount = d3.selectAll('' + selector).size();
    var femaleCount = d3.selectAll(selector + '[gender="F"]').size();
    var maleCount = d3.selectAll(selector + '[gender="M"]').size();

    var message = ' ' + totalCount + ' Members currently have seats in the House of Commons (' + femaleCount + ' Females, ' + maleCount + ' Males)';
    message = provinceId === 'All' ? message : provinces[provinceId] + ': ' + message;

    $('#FloorPlanCard-FilterTitle').html(message);
    $('#FloorPlanCard-FilterTitle').attr('class', 'FloorPlanCard-FilterTitle-LeftAligned');
    setFilteredOpacity(province, gender);

    return;
}

/* ////////////////////////////////////////////////////////////////////////////////////////////
// This function (callback) highlight MPs that meet the users specification of gender
// and/or province. MPs that don't are 'defocused'
//////////////////////////////////////////////////////////////////////////////////////////////*/

function handleGenderRefinerChange() {

    var provinceId = $('#FloorPlan-ProvinceList').val();
    var province = provinceId === 'All' ? provinceId : provinces[provinceId];
    var gender = $('#FloorPlan-GenderList').val();

    setFilteredOpacity(province, gender);

    clearMPCard();
    clearSearchBox();

    return;
}

function handleFindMPButtonClick() {

    // If search filter is empty do nothing
    if ($('#FloorPlan-FindMPInput').val() === '') {
        return;
    }

    $('#FloorPlan-ClearFindMP').removeClass();
    clearMPCard();
    clearRefiners();

    var searchTerm = $('#FloorPlan-FindMPInput').val();
    var mps = house.separateMPs(searchTerm);

    // Put MPs that match search criteria in focus. defocus others.
    if (mps.includedMPs.size() > 0) {
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
    $('#FloorPlanCard-FilterTitle').html(mps.includedMPs.size() + ' Search Result');
    $('#FloorPlanCard-FilterTitle').attr('class', 'FloorPlanCard-FilterTitle-RightAligned');

    return;
}

function handleRectClick(mp) {

    var mpStatus = d3.select(this).attr('status');

    d3.select('[fill=yellow]').attr('fill', function (d) {
        return colours[d['Political Affiliation']];
    });

    if (mpStatus === 'dormant') {
        d3.select(this).attr('status', 'active');
        d3.select(this).attr('fill', 'yellow');
        $('#FloorPlanCard-Horizontal').attr('class', 'locked');
        $('#FloorPlanCard-Horizontal').css('visibility', 'visible');
    } else {
        d3.select(this).attr('status', 'dormant');
        $('#FloorPlanCard-Horizontal').attr('class', 'free');
        $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');
    }

    renderMPCard(mp);

    return;
}

function handleRectMouseout() {

    var status = $('#FloorPlanCard-Horizontal').attr('class');
    if (status === 'free') {
        $('#FloorPlanCard-Horizontal').css('visibility', 'hidden');
    }

    return;
}

function handleRectMouseover(mp) {

    var visibility = $('#FloorPlanCard-Horizontal').css('visibility');
    if (visibility === 'hidden') {
        renderMPCard(mp);
    }

    return;
}

function handleTBCKeypress() {

    if ($('#FloorPlan-ClearFindMP').hasClass('hidden')) {
        $('#FloorPlan-ClearFindMP').removeClass('hidden');
    }
    return;
}

function renderMPCard(mp) {

    var title = mp['Honorific Title'];
    var personName = title + ' ' + mp.Fname + ' ' + mp.Lname;
    var backgroundColour = colours[mp['Political Affiliation']];

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

    var padding = 10;
    var blockStart = block[0];
    var blockEnd = block[1];
    var blockOffset = blockStart * width - index * padding;
    var getMpX = function getMpX(d) {

        var xOffset = width + 1;
        var xBlockOffset = d.Column - blockStart; // Column - blockStart is offset within block
        return xBlockOffset * xOffset;
    };
    var getMpY = function getMpY(d) {

        var yOffset = height + 1;
        return side === 'opposition' ? d.Row * yOffset : (d.Row - 7) * yOffset; // Normalize gov mp rows
    };

    // Group by seating block
    var _block = d3.select('#' + side).append('g').attr('width', 1024).attr('height', 300).attr('transform', function () {
        return 'translate (' + blockOffset + ', 0)';
    });

    // Assign block seats
    _block.selectAll('rect').data(data).enter().append('rect').attr('x', getMpX).attr('y', getMpY).attr('width', width).attr('height', height).attr('status', 'dormant').attr('gender', function (d) {
        return d.Gender;
    }).attr('province', function (d) {
        return d.Province;
    }).on('click', handleRectClick).on('mouseout', handleRectMouseout).on('mouseover', handleRectMouseover).attr('fill', function (d) {
        return colours[d['Political Affiliation']];
    });

    return;
}

function setFilteredOpacity(province, gender) {

    var selector = void 0;
    console.log(province);
    console.log(gender);
    if (province === 'All' && gender === 'Both') {
        d3.selectAll('rect').attr('opacity', 1);
        return;
    }

    if (province === 'All' && gender !== 'Both') {
        selector = '[gender="' + gender + '"]';
    } else if (province !== 'All' && gender === 'Both') {
        selector = '[province="' + province + '"]';
    } else {
        selector = '[province="' + province + '"][gender="' + gender + '"]';
    }

    d3.selectAll('rect').attr('opacity', 0.3);
    d3.selectAll(selector).attr('opacity', 1);

    return;
}

$('#FloorPlan-ProvinceList').change(handleProvRefinerChange);
$('#FloorPlan-GenderList').change(handleGenderRefinerChange);

$('#FloorPlan-TextboxContainer').keypress(handleTBCKeypress);
$('#FloorPlan-FindMPButton').click(handleFindMPButtonClick);
$('#FloorPlan-ClearFindMP').click(handleClearFindMPClick);

// App 'entry point'
seatingBlocks.forEach(function (block, index) {

    var oppMps = house.getMps.apply(house, [0, 4].concat(_toConsumableArray(block)));
    var govMps = house.getMps.apply(house, [7, 11].concat(_toConsumableArray(block)));

    oppMps.then(function (mps) {

        mps.forEach(function (mp) {
            return house.getImage(mp);
        }); // prefetch mp images
        renderMps(mps, block, index, 'opposition');
    });

    govMps.then(function (mps) {
        mps.forEach(function (mp) {
            return house.getImage(mp);
        }); // prefetch mp images
        renderMps(mps, block, index, 'government');
    });
});

},{"./House.js":1}]},{},[2]);
