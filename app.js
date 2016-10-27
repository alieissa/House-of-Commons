
// Database only contains publicyl available data, so read permissions O.K.
const firebaseApp = firebase.initializeApp({ databaseURL: "https://houseofcommons-d40a9.firebaseio.com"});
const mpsRef = firebaseApp.database().ref('/MembersOfParliament')

const height = 31;
const width =  23;
const colours = {
    'Conservative': '#002395',
    'NDP': '#FF5800',
    'Bloc Québécois': '#0088CE',
    'Liberal': '#ed2e38',
    'Green Party': '#427730',
    'Independent': '#606860'
};

/*///////////////////////////////////////////////////////
//  [a,b,c] = [blockStart, blockEnd, blockOffset]
// Algorithm for offset apparent. But keep hardoced vals
//////////////////////////////////////////////////////////*/

const seatingBlocks = [
    [0, 6, 0],
    [8, 12, 150],
    [14, 18, 260],
    [20, 24, 370],
    [26, 30, 480],
    [32, 36, 590],
    [38, 42, 700],
    [44, 45, 810],
    [47, 47, 860]
];


seatingBlocks.forEach((block, index, self) => {
    let oppMps = getMps(0, 4, ...block);
    let govMps = getMps(7, 11, ...block);

    oppMps.then((mps) => {
        renderMps(mps, block, index, 'opposition');
    });

    govMps.then((mps) => {
        console.log(index)
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
    // let blockOffset = block[2];
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
    .attr('x', (d) => {
        let xOffset = width + 1;
        let xBlockOffset = d.Column - blockStart; // Column - blockStart is offset within block
        return xBlockOffset * xOffset;
    })
    .attr('y', (d) => {
        let yOffset = height + 1;
        return side == 'opposition' ? d.Row * yOffset: (d.Row - 7) * yOffset // Normalize gov mp rows
    }).
    on('click', (d) => {
        console.log(d)
    })
}
