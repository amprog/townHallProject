(function(module) {
  function TownHall (opts) {
    for (var key in opts) {
      this[key] = opts[key];
    }
  }
  //Global data stete
  TownHall.allTownHalls = [];
  TownHall.currentContext = [];
  TownHall.filteredResults = [];
  TownHall.filterIds = {
    meetingType:'',
    Party:'',
    State:''
  };
  TownHall.isCurrentContext = false;
  TownHall.isMap = false;
  TownHall.zipQuery;

  TownHall.timeZones = {
    PST : 'America/Los_Angeles',
    MST : 'America/Denver',
    CST : 'America/Chicago',
    EST : 'America/New_York',
    other : 'no time zone'
  };

  //FIREBASE METHODS
  // Initialize Firebase
  var config = {
    apiKey: 'AIzaSyDwZ41RWIytGELNBnVpDr7Y_k1ox2F2Heg',
    authDomain: 'townhallproject-86312.firebaseapp.com',
    databaseURL: 'https://townhallproject-86312.firebaseio.com',
    storageBucket: 'townhallproject-86312.appspot.com',
    messagingSenderId: '208752196071'
  };

  firebase.initializeApp(config);
  var firebasedb = firebase.database();

  TownHall.saveZipLookup = function (zip) {
    firebasedb.ref('/zipZeroResults/' + zip).once('value').then(function(snapshot){
      console.log(zip);
      if (snapshot.exists()) {
        newVal = snapshot.val() + 1;
        console.log('new val', newVal);
      }
      else {
        newVal = 1;
      }
      return firebasedb.ref('/zipZeroResults/' + zip).set(newVal);
    });
  };

  TownHall.prototype.isInFuture = function (){
    this.dateObj = new Date(this.Date);
    var now = new Date();
    if (now - this.dateObj < 0) {
      return true;
    }
  };

  //Handlebars write
  TownHall.prototype.toHtml= function(templateid){
    var source = $(templateid).html();
    var renderTemplate = Handlebars.compile(source);
    return renderTemplate(this);
  };

  //  Table Sorting Methods
  //takes an array and sorts by date objects
  TownHall.sortDate = function(data) {
    return data.sort(function(a, b ){
      return new Date(a.dateString) - new Date(b.dateString);
    });
  };

  // filters by a value in a column
  TownHall.filterByCol = function(filterCol, filterID, data) {
    return data.filter(function(ele){
      return ele[filterCol] === filterID;
    });
  };

  // Filters by a query in a column
  TownHall.filterColumnByQuery = function(filterCol, query, data) {
    return data.filter(function(element) {
      return element[filterCol].indexOf(query) !== -1;
    });
  };

  // METHODS IN RESPONSE TO lookup
  // Converts zip to lat lng google obj
  TownHall.lookupZip = function (zip) {
    return firebasedb.ref('/zips/' + zip).once('value').then(function(snapshot) {
      var representativePromise = $.ajax({
        url: 'https://congress.api.sunlightfoundation.com/legislators/locate?zip=' + zip,
        dataType: 'jsonp'
      });
      var zipQueryLoc = new google.maps.LatLng(snapshot.val().LAT, snapshot.val().LNG);
      TownHall.zipQuery = zipQueryLoc;
      TownHall.returnNearest(zipQueryLoc).then(function(sorted) {
        eventHandler.render(sorted, zipQueryLoc, representativePromise);
      });
    }).catch(function(error){
      var $results = $('#textresults');
      console.log(error);
      $results.empty();
      var $text = $('<h4>');
      $text.text('That is not a real zip code');
      $results.append($text);
    });
  };

  // given a zip, returns sorted array of events
  TownHall.returnNearest = function (zipQueryLoc) {
    var locations = [];
    return firebase.database().ref('/townHalls').once('value').then(function(snapshot) {
      snapshot.forEach(function(ele){
        if (ele.val().StateAb !== 'DC') {
          locations.push(new TownHall(ele.val()));
        }
      });
      var sorted = locations.sort(function (a , b) {
        a.dist = google.maps.geometry.spherical.computeDistanceBetween(zipQueryLoc, new google.maps.LatLng(a.lat,a.lng));
        b.dist = google.maps.geometry.spherical.computeDistanceBetween(zipQueryLoc, new google.maps.LatLng(b.lat,b.lng));
        return a.dist <= b.dist ? -1 : 1;
      });
      return sorted;
    });
  };

  // TownHall.fetchAll();
  module.TownHall = TownHall;
})(window);
