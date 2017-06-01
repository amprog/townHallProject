(function(module) {
  var firebasedb = firebase.database();
  var provider = new firebase.auth.GoogleAuthProvider();

  // object to hold the front end view functions
  var eventHandler = {};

  // Renders the page in response to lookup
  eventHandler.lookup = function (e) {
    e.preventDefault();
    var zip = $('#look-up input').val();
    if (zip) {
      TownHall.lookupZip($('#look-up input').val());
      eventHandler.resetFilters();
    }
  };

  function getUrlParameter(search_parameter) {
    var page_URL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = page_URL.split('&'),
      search_parametereter_name,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      search_parametereter_name = sURLVariables[i].split('=');

      if (search_parametereter_name[0] === search_parameter) {
        return search_parametereter_name[1] === undefined ? true : search_parametereter_name[1];
      }
    }
  }


  // reset the home page to originial view
  eventHandler.resetHome = function () {
    $('[data-toggle="popover"]').popover('hide');
    $('.header-small').hide();
    $('.header-large').fadeIn();
    $('#look-up input').val('');
    $('#representativeCards section').empty();
    $('.form-text-results').removeClass('text-center');
    $('.header-with-results .results').removeClass('multipleResults');
    $('.left-panels').removeClass('left-panels-border');
    $('#nearest').removeClass('nearest-with-results');
    $('#button-to-form').hide();
    $('.spacer').show();
    $('#look-up').appendTo($('.right-panels'));
    TownHall.isCurrentContext = false;
    TownHall.currentContext = [];
    TownHall.zipQuery = '';
    $('#map').appendTo('.map-large');
    onResizeMap();
    var $parent = $('#nearest');
    var $results = $('#textresults');
    $parent.empty();
    $results.empty();
    eventHandler.resetFilters();
    eventHandler.addFilter('meetingType', 'Town Hall');
    TownHall.sortOn = 'State';
    eventHandler.renderTableWithArray(eventHandler.getFilterState());
    $('#partnership-text').show();
  };

  // Renders one panel, assumes data processing has happened
  eventHandler.renderPanels = function(event, $parent) {
    var compiledTemplate = Handlebars.getTemplate('eventCards');
    var $panel = $(compiledTemplate(event));
    if (event.Party) {
      $panel.children('.panel').addClass(event.Party.slice(0,3));
    } else {
      $panel.children('.panel').addClass('cap');
    }
    $panel.appendTo($parent);
  };

  eventHandler.renderRepresentativeCards = function(representativePromise, $parent) {
    $parent.empty(); // If they search for a new zipcode clear the old info
    representativePromise.success(function(representatives) {
      var compiledTemplate = Handlebars.getTemplate('representativeCard');
      $parent.append('<h2 class="text-primary text-center">Your Representatives</h2>');
      representatives.results.forEach(function(rep) {
        switch(rep.party) {
        case 'R':
          rep.party = 'Republican';
          break;
        case 'D':
          rep.party = 'Democrat';
          break;
        case 'I':
          rep.party = 'Independent';
          break;
        }
        var termEnd = new Date(rep.term_end);
        // If term expires in janurary then assume the election is in the prior year
        rep.electionYear = termEnd.getMonth() === 0 ? termEnd.getFullYear() - 1 : termEnd.getFullYear();
        $parent.append(compiledTemplate(rep));
      });
      if (representatives.results.length > 3) {
        $parent.append('<h4 class="col-md-12 text-center">Your zip code encompasses more than one district.<br><small><a href="http://www.house.gov/representatives/find/">Learn More</a></small></h4>');
      }
    });
  };

  eventHandler.renderTableWithArray = function (array) {
    $('.event-row').remove();
    $table = $('#all-events-table');
    // $currentState = $('#current-state');
    // var total = parseInt($currentState.attr('data-total'));
    var cur = array.length;
    array.forEach(function(ele){
      eventHandler.renderTable(ele, $table);
    });
    $('[data-toggle="popover"]').popover({
      container: 'body',
      html:true
    });
    /*eslint-env es6*/
    /*eslint quotes: ["error", "single", { "allowTemplateLiterals": true }]*/
    // $currentState.text('Viewing ' + cur + ' of ' + total + ' total events');
  };

  // render table row
  eventHandler.renderSingleEvent = function (townhall, eventid) {
    // if (townhall.dist) {
    //   townhall.dist = Math.round(townhall.dist/1609.344);
    // }
    townhall.addressLink = 'https://www.google.com/maps?q=' + escape(townhall.address);
    if(townhall.eventId == eventid) {
      var compiledTemplate = Handlebars.getTemplate('singleEventView');
      $('#event-details').append(compiledTemplate(townhall));
      console.log('Event ID is: ' + townhall.eventId + '!!!!!');
      console.log(JSON.stringify(townhall));
      $.getScript('https://addtocalendar.com/atc/1.5/atc.min.js');
    }else{}
  };


    // render table row
  eventHandler.renderTable = function (townhall, $tableid) {
    if (townhall.dist) {
      townhall.dist = Math.round(townhall.dist/1609.344);
    }
    townhall.addressLink = 'https://www.google.com/maps?q=' + escape(townhall.address);
    var compiledTemplate = Handlebars.getTemplate('eventTableRow');
    $($tableid).append(compiledTemplate(townhall));
  };

  eventHandler.getFilterState = function () {
    var data = TownHall.isCurrentContext ? TownHall.currentContext : TownHall.allTownHalls;
    return TownHall.getFilteredResults(data);
  };

  eventHandler.sortTable = function (e) {
    e.preventDefault();
    TownHall.sortOn = $(this).attr('data-filter');
    eventHandler.renderTableWithArray(eventHandler.getFilterState());
  };

  eventHandler.addFilter = function(filter, value) {
    // Avoid duplicates
    if (TownHall.filters.hasOwnProperty(filter) && TownHall.filters[filter].indexOf(value) !== -1) {
      return;
    }

    TownHall.addFilter(filter, value);

    var button = '<li><button class="btn btn-secondary btn-xs" ' +
                 'data-filter="' + filter + '" data-value="' + value + '" >' +
                    value + '<i class="fa fa-times" aria-hidden="true"></i>' +
                  '</button></li>';
    $('#filter-info').append(button);
  };

  eventHandler.removeFilter = function() {
    var $button = $(this);
    TownHall.removeFilter($button.attr('data-filter'), $button.attr('data-value'));
    eventHandler.renderTableWithArray(eventHandler.getFilterState());
    $button.parent().remove();
  };

  eventHandler.resetFilters = function() {
    TownHall.resetFilters();
    $('#filter-info li button').parent().remove();
  };
  // filters the table on click
  eventHandler.filterTable = function (e) {
    e.preventDefault();
    var filter = this.getAttribute('data-filter');
    eventHandler.addFilter(filter, this.id);

    var filterID = this.id.slice(0,5);
    var inputs = $('input[data-filter]');
    eventHandler.renderTableWithArray(eventHandler.getFilterState());
  };

  // initial state of table
  eventHandler.initialTable = function (townhall) {
    // var total = parseInt($currentState.attr('data-total')) + 1;
    // var cur = parseInt($currentState.attr('data-current'));
    var eventID = getUrlParameter('eid');
    eventHandler.renderSingleEvent(townhall, eventID);
  };

  // renders results of search
  eventHandler.render = function (events, zipQuery, representativePromise) {
    addtocalendar.load();
  };


  function setupTypeaheads() {
    var typeaheadConfig = {
      fitToElement: true,
      delay: 250,
      highlighter: function(item) { return item; }, // Kill ugly highlight
      updater: function(selection) {
        eventHandler.addFilter(this.$element.attr('data-filter'), selection);
        eventHandler.renderTableWithArray(eventHandler.getFilterState());
      }
    };

  }

  $(document).ready(function(){
    $('#partnership-text').show();
    init();
  });

  function init() {
    $('[data-toggle="popover"]').popover({html:true});
    $('#button-to-form').hide();
    $('#save-event').on('submit', eventHandler.save);
    $('#look-up').on('submit', eventHandler.lookup);
    $('#view-all').on('click', TownHall.viewAll);
    $('.sort').on('click', 'a', eventHandler.sortTable);
    setupTypeaheads();
    $('.filter').on('click', 'a', eventHandler.filterTable);
    $('#filter-info').on('click', 'button.btn', eventHandler.removeFilter);
    eventHandler.resetFilters();
    // eventHandler.addFilter('meetingType', 'Town Hall');
    eventHandler.addFilter('meetingType', 'Resistance Event');

    $('.navbar-main').on('click', '.hash-link', function onClickGethref(event) {
      var hashid = this.getAttribute('href');
      if (hashid === '#home' && TownHall.isMap === false) {
        history.replaceState({}, document.title, '.');
        setTimeout( function(){
          if (location.pathname ='/') {
            eventHandler.resetHome();
            TownHall.isMap = true;
          }
        }, 50);
      }
      else if (hashid === '#home' && TownHall.isMap === true) {
        console.log('going home and map');
        history.replaceState({}, document.title, '.');
        $('ul .hash-link').parent().removeClass('active');
        setTimeout( function(){
          eventHandler.resetHome();
        }, 0);
      }
      else {
        location.hash = hashid;
      }
      $('[data-toggle="popover"]').popover('hide');
    });

    // Only show one popover at a time
    $('#all-events-table').on('click', 'li[data-toggle="popover"]', function(e) {
      $('#all-events-table [data-toggle="popover"]').not(this).popover('hide');
    });

    $('body').on('click', '.popover .popover-title a.close', function(e) {
      $('[data-toggle="popover"]').popover('hide');
    });

    // Fix popover bug in bootstrap 3 https://github.com/twbs/bootstrap/issues/16732
    $('body').on('hidden.bs.popover', function (e) {
      $(e.target).data('bs.popover').inState.click = false;
    });
  }
  window.onBeforeunload=null;

  module.eventHandler = eventHandler;
})(window);
