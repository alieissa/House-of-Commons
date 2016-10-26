
class FB_Model {
  constructor(url) {
    firebase.initializeApp({ databaseURL: url });
    this.db = firebase.database().ref('/MembersOfParliament')
  }

  // Retrieve MPs between row 'start' and row 'end'
  _getMps(start, end) {
    let mpsArray = [];
    let mpsRef = this.db.orderByChild('Row').startAt(start).endAt(end);

    return mpsRef
      .once('value')
      .then((snapshot) => {
        let mpsCollection = snapshot.val();

        // Convert huge json object to array
        for(let fullname in mpsCollection) {
          mpsArray.push(mpsCollection[fullname]);
        }

        return mpsArray;
    });
  }

  getAllMps() {
    return this.db.once('value').then((snapshot) => { return snapshot.val()})
  }

  getOppMps() {

    // Opposition occupies rows 0 to 4
    return this._getMps("00", "04");
  }

  getGovMps() {

    // Gov occupies rows 7 to 11
    return this._getMps("07", "11")
  }
}

const mps = new FB_Model("https://houseofcommons-d40a9.firebaseio.com");
mps.getOppMps().then((oppMps) => {
  // Show d3 rendered graph here
});

mps.getGovMps().then((govMps) => {
  // Show d3 rendered graph here
});
