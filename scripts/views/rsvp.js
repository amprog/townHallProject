jQuery(document).ready(function($) {
  function rsvpPopup(source, campaign, event_id, event_type, event_name, event_date, event_unix_timestamp, event_venue, event_address, event_url) {
    if(event_id != '9ac8d2ff-b8ad-4703-b671-0d36a352e525') {
      var popup = '<div id="rsvp-popup" class="popup">' +
          '<div class="pum-content popmake-content">' +
          '<div id="thanks" style="display: none"><p>Thank you for signing up for a Resistance Near Me event! Please check your email for a confirmation message. If you’re new to our database, you’ll also get an email from us asking you to opt-in to future messages. <strong>This is important – you must opt in to receive event updates or cancellation notices.</strong> Simply click on the “Yes, subscribe me” button, and you’ll be set.</p></div>' +
          '<form action="https://s785.t.eloqua.com/e/f2" method="post" id="main-form">' +
              '<div id="rsvp-title" style="font-size: 2.5rem; margin: 0 auto 1.5rem 0;"><strong>RSVP</strong></div>' +
          '* E-mail:<input type="email" name="email" id="email" required>' +
          '* ZIP code:<input type="text" name="rsvp_zip" id="rsvp_zip" required>' +
          '<input type="hidden" name="rsvp_source" value="' + source + '">' +
          '<input type="hidden" name="rsvp_campaign" value="' + campaign + '">' +
          '<input type="hidden" name="event-id" value="' + event_id + '">' +
          '<input type="hidden" name="event-type" value="' + event_type + '">' +
          '<input type="hidden" name="event-name" value="' + event_name + '">' +
          '<input type="hidden" name="event-date-string" value="' + event_date + '">' +
          '<input type="hidden" name="event-date" value="' + event_unix_timestamp + '">' +
          '<input type="hidden" name="event-venue" value="' + event_venue + '">' +
          '<input type="hidden" name="event-address" value="' + event_address + '">' +
          '<input type="hidden" name="event-url" value="' + event_url + '">' +
          '<input type="hidden" name="elqFormName" value="townhallregistrations">' +
          '<input type="hidden" name="elqSiteID" value="785">' +
          '<input type="submit" value="Send" id="popup-submit" class="btn">' +
          '<div id="dialogue" style="display: inline-block; margin: 0.5rem 0 0 3rem;"></div>' +
          '</form>' +
          '</div>' +
          '<button type="button" class="pum-close popmake-close" aria-label="Close">X</button>' +
          '</div>';
    } else {
      var popup = '<div id="rsvp-popup" class="popup">' +
        '<div class="pum-content popmake-content">' +
        '<div id="no-rsvp"><p><strong>Unfortunately this event is sold out and has a waiting list. You\'ll need to try to RSVP at the event site itself.</strong></p></div>' +
        '</div>' +
        '<button type="button" class="pum-close popmake-close" aria-label="Close">X</button>' +
        '</div>';
    }
    var overlay = '<div id="overlay"></div>'

    $("body").append(overlay);
    $("#overlay").append(popup);
    $(".pum-close").click(function(){
      removePopup();
    });
    $("#popup-submit").click(function(e){

      e.preventDefault();

      if(!$.trim($("#email").val()).length || !$.trim($('#rsvp_zip').val()).length) {
        //alert("Please fill out all form fields.     " + $("#email").val() + "     " + $("#rsvp_zip").val());
      } else if($.trim($("#email").val()).length || $.trim($('#rsvp_zip').val()).length) {
        var formToSubmit = $("#main-form").serialize();
        $('#dialogue').show().text('Submitting...');
        $.ajax({
          type: "POST",
          url: "https://s785.t.eloqua.com/e/f2?elqFormName=townhallregistrations&elqSiteID=785",
          data: formToSubmit,
        // dataType: "json",
          encode: true,
          success: function(result){
            //$('#main-form').hide();
            location.replace("eventthankyou.html?eid=" + event_id + "&ename=" + event_name);
          }
        });
        // $('#main-form').hide();
        // location.replace("eventthankyou.html?eid=" + event_id + "&ename=" + event_name);
        //$('#thanks').show();
      //setTimeout(function () {
      //removePopup();
      //}, 19000);
      }
    });
    // }
  }

  function removePopup() {
    $("#rsvp-popup").remove();
    $("#overlay").remove();
  }

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

  $('body').on('click', '.rsvpButton', function () {
    //alert($(this).closest('.panel-secondary').find('.event-link').attr('data-value'));
    //alert($(this).closest('.panel-secondary').attr('id'));
    var source = getUrlParameter('src');
    var campaign = getUrlParameter('cmp');

    var event_id = $(this).closest('.panel-secondary').attr('id');
    var event_type = $(this).closest('.panel-secondary').find('.event-type').attr('data-value');
    var event_name = $(this).closest('.panel-secondary').find('.event-name').attr('data-value');
    var event_date = $(this).closest('.panel-secondary').find('.event-date').attr('data-value');
    var event_milli = new Date(event_date);
    var event_unix_timestamp = event_milli.getFullYear() + "-" + (event_milli.getMonth() + 1) + "-" + event_milli.getDate() + " " + event_milli.getHours() + ":" + (event_milli.getMinutes()<10?'0':'') + event_milli.getMinutes();
    var event_venue = $(this).closest('.panel-secondary').find('.event-venue').attr('data-value');
    var event_address = $(this).closest('.panel-secondary').find('.event-address').attr('data-value');
    var event_url = 'https://resistancenearme.org/event.html?eid=' + event_id;

    rsvpPopup(source, campaign, event_id, event_type, event_name, event_date, event_unix_timestamp, event_venue, event_address, event_url);
  });

  $('body').on('click', '.badge-rsvpButton', function (e) {
    //alert($(this).closest('.panel-secondary').find('.event-name').attr('data-value'));
    //alert($(this).closest('.panel-secondary').attr('id'));
    e.preventDefault();
    var source = getUrlParameter('src');
    var campaign = getUrlParameter('cmp');

    var event_id = $(this).closest('.event-row.list-group-item').attr('id');
    var event_type = $(this).closest('.event-row.list-group-item').find('.event-type').attr('data-value');
    var event_name = $(this).closest('.event-row.list-group-item').find('.event-name').attr('data-value');
    var event_date = ($(this).closest('.event-row.list-group-item').find('.event-date').attr('data-value')?$(this).closest('.event-row.list-group-item').find('.event-date').attr('data-value'):"");
    var event_time = ($(this).closest('.event-row.list-group-item').find('.event-time').attr('data-value')?$(this).closest('.event-row.list-group-item').find('.event-time').attr('data-value'):"");
    var event_date_time_string = event_date + " " + event_time;
    var event_milli = new Date(event_date_time_string);
    var event_unix_timestamp = event_milli.getFullYear() + "-" + (event_milli.getMonth() + 1) + "-" + event_milli.getDate() + " " + event_milli.getHours() + ":" + (event_milli.getMinutes()<10?'0':'') + event_milli.getMinutes();
    var event_venue = $(this).closest('.event-row.list-group-item').find('.event-venue').attr('data-value');
    var event_address = $(this).closest('.event-row.list-group-item').find('.event-address').attr('data-value');
    var event_url = 'https://resistancenearme.org/event.html?eid=' + event_id;


    rsvpPopup(source, campaign, event_id, event_type, event_name, event_date_time_string, event_unix_timestamp, event_venue, event_address, event_url);
  });


});
