const parties = {
    'Conservative': 'CPC',
    'Liberal':'Lib',
    'Bloc Québécois': 'BQ',
    'Green Party': 'GP',
    'NDP': 'NDP',
    'Independent': 'IND'
};
export class House {

    constructor(databaseUrl, rootRef) {
        try {
            let _fb = firebase.initializeApp({databaseURL:databaseUrl});

            this.db = _fb.database();
            this.rootRef = this.db.ref(rootRef);
        }
        catch(error) {
            throw ('Encountered error trying to create firebase app', error);
        }

    }


    /* ////////////////////////////////////////////////////////////////////////////////////////////
    // Prefetches the image of an MP. This will make the transition between MP profiles
    // on mouseover mouseout events appear smooth.
    //////////////////////////////////////////////////////////////////////////////////////////////*/

    getImage(mp) {
        
        let img = new Image();
        img.onerror = (error) => {
            console.log(`Unable to get image for ${mp.Fname} ${mp.Lname}`);
            console.log(error);
        }

        if(typeof mp.ImgName === "undefined") {
            mp.ImgName = `${mp.Lname}${mp.Fname}_${parties[mp["Political Affiliation"]]}`;
            mp.ImgName = mp.ImgName.replace(/[' \.-]/g, ''); // Take care of middle name letters and hyphenated last names
        }

        mp.ImgUrl = `http://www.parl.gc.ca/Parliamentarians/Images/OfficialMPPhotos/42/${mp.ImgName}.jpg`
        img.src = mp.ImgUrl;


    }

    /* ////////////////////////////////////////////////////////////////////////////////////////////
    // Retrieve MPs between row 'start' , row 'end' and column 'cloumnStart' and 'columnEnd'
    // Firebase doesn't have much querying capabilites so function queries firebase by row
    // then locally extracts data that meets columns condition
    //////////////////////////////////////////////////////////////////////////////////////////////*/

    getMps(rowStart, rowEnd, columnStart, columnEnd) {

        let _rowStart = rowStart < 10 ? `0${rowStart}` : rowStart.toString();
        let _rowEnd = rowEnd < 10 ? `0${rowEnd}` : rowEnd.toString();

        return this.rootRef.orderByChild('Row')
            .startAt(_rowStart)
            .endAt(_rowEnd)
            .once('value')
            .then((snapshot) => {
                return this._handlegetMpsResult(snapshot, columnStart, columnEnd) //verbose but clear
            });
    }

     _handlegetMpsResult(snapshot, columnStart, columnEnd) {

        let mps = [];
        let result = snapshot.val();

        // Convert huge json object to array
        for(let name in result) {
            let mp = result[name];

            if(mp.Column[0] === "0") {
                mp.Column = mp.Column[1];
            }

            mp.Column = parseInt(mp.Column);
            // convert columns from leading zeroed num string to int e.g '06' to 6
            //column = column[0] === "0" ? parseInt(column[1]): parseInt(column);
            if(mp.Column >= columnStart && mp.Column <= columnEnd) {
                mps.push(mp);
            }
        }
        return mps;
    }
}
