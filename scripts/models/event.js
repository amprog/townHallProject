(function(module) {
  function TownHall (opts) {
    for (var key in opts) {
      this[key] = opts[key];
    }
  }
  //Global data stete
  TownHall.allTownHalls = [];
  TownHall.allMoCs = [];
  TownHall.allStates = [];
  TownHall.currentContext = [];
  TownHall.filters = {};
  TownHall.sortOn = 'State';
  TownHall.filteredResults = [];
  TownHall.isCurrentContext = false;
  TownHall.isMap = false;
  TownHall.zipQuery;

  // Lookup dictionaries
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
    //apiKey: 'AIzaSyDwZ41RWIytGELNBnVpDr7Y_k1ox2F2Heg',
    //authDomain: 'townhallproject-86312.firebaseapp.com',
    databaseURL: 'https://resistancenearme.firebaseio.com/',
    //storageBucket: 'townhallproject-86312.appspot.com',
    //messagingSenderId: '208752196071'
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

  // Takes an array of TownHalls and sorts by sortOn field
  TownHall.sortFunction = function(a, b) {
    if (a[TownHall.sortOn] && b[TownHall.sortOn]) {
      if (parseInt(b[TownHall.sortOn])) {
        return a[TownHall.sortOn] - b[TownHall.sortOn];
      }
      else {
        return a[TownHall.sortOn].toLowerCase().localeCompare(b[TownHall.sortOn].toLowerCase());
      }
    }
  };

  TownHall.getFilteredResults = function(data) {
    // Itterate through all active filters and pull out any townhalls that match them
    // At least one attribute from within each filter group must match
    return TownHall.filteredResults = Object.keys(TownHall.filters).reduce(function(filteredData, key) {
      return filteredData.filter(function(townhall) {
        // Currently some of the data is inconsistent.  Some parties are listed as "Democrat" and some are listed as "Democratic", etc
        // TODO:  Once data is sanatized use return TownHall.filters[key].indexOf(townhall[key]) !== -1;
        if (townhall[key]) {
          return TownHall.filters[key].some(function(filter) {
            return filter.slice(0, 8) === townhall[key].slice(0, 8);
          });
        }
      });
    }, data).sort(TownHall.sortFunction);
  };

  // METHODS IN RESPONSE TO lookup
  // Converts zip to lat lng google obj
  TownHall.lookupZip = function (zip) {
    return firebasedb.ref('/zips/' + zip).once('value').then(function(snapshot) {
      var representativePromise = $.ajax({
        url: 'https://congress.api.sunlightfoundation.com/legislators/locate?zip=' + zip,
        dataType: 'jsonp'
      });
      //alert('This is lat long ' + snapshot.val().LAT + "    " + snapshot.val().LNG);
      var zipQueryLoc = new google.maps.LatLng(snapshot.val().LAT, snapshot.val().LNG);
      //alert(zipQueryLoc);
      TownHall.zipQuery = zipQueryLoc;
      TownHall.returnNearest(zipQueryLoc).then(function(sorted) {
        //alert('This is lat long ' + JSON.stringify(representativePromise));
        eventHandler.render(sorted, zipQueryLoc, representativePromise);
      });
      $('#partnership-text').hide();
    }).catch(function(error){
      var $results = $('#header-textresults');
      console.log(error);
      $results.empty();
      var $text = $('<h4>');
      $text.text('That is not a real zip code');
      $results.append($text);
    });
  };

// cleaning out Unaffiliated fields
  TownHall.prototype.removeUnaffliated = function () {
    townHall = this;
    Object.keys(townHall).forEach(function(key){
      if (townHall[key] === 'Unaffiliated') {
        townHall[key] = null;
      }
    });
    return townHall;
  };

  // given a zip, returns sorted array of events
  TownHall.returnNearest = function (zipQueryLoc) {
    var locations = [];
    return firebase.database().ref('/townHalls/').once('value')
    .then(function(townHallsSS) {
      townHallsSS.forEach(function(ele){
        if (ele.val().StateAb !== 'DC') {
          locations.push(new TownHall(ele.val()));
        }
      });
    })
    .then(function(){
      return firebase.database().ref('/capEvents/').once('value')
      .then(function(capSS) {
        capSS.forEach(function(ele){
          capEvent = new TownHall(ele.val());
          capEvent.removeUnaffliated();
          locations.push(capEvent);
        });
        var sorted = locations.sort(function (a , b) {
	        a.dist = google.maps.geometry.spherical.computeDistanceBetween(zipQueryLoc, new google.maps.LatLng(a.lat,a.lng))/1609.344;
	        b.dist = google.maps.geometry.spherical.computeDistanceBetween(zipQueryLoc, new google.maps.LatLng(b.lat,b.lng))/1609.344;
	        console.log("zipQueryLoc:" + zipQueryLoc + ' ' + a.lat + ' ' + a.lng + ' ' + a.dist);
	        return a.dist <= b.dist ? -1 : 1;
  	    });
  	    return sorted;
      });
    });
  };

  TownHall.addFilter = function(filter, value) {
    if (!TownHall.filters.hasOwnProperty(filter)) {
      TownHall.filters[filter] = [value];
    } else {
      TownHall.filters[filter].push(value);
    }
  };

  TownHall.removeFilter = function(filter, value) {
    var index = TownHall.filters[filter].indexOf(value);
    if (index !== -1) {
      TownHall.filters[filter].splice(index, 1);
    }
    if (TownHall.filters[filter].length === 0) {
      delete TownHall.filters[filter];
    }
  };

  TownHall.resetFilters = function() {
    Object.keys(TownHall.filters).forEach(function(key) {
      delete TownHall.filters[key];
    });
  };

  TownHall.addFilterIndexes = function(townhall) {
    if (TownHall.allStates.indexOf(townhall.State) === -1) {
      TownHall.allStates.push(townhall.State);
    }
    if (townhall.Member && TownHall.allMoCs.indexOf(townhall.Member) === -1) {
      TownHall.allMoCs.push(townhall.Member);
    }
  };

  Handlebars.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  module.TownHall = TownHall;
})(window);
