jQuery(document).ready(function($) {
  $.getJSON("https://s3.amazonaws.com/resistancenearme.org/data/sheet1.json", function (result) {

    $.each(result, function (i, singleResource) {
      var resourceText = !singleResource.leadtext ? "" : singleResource.leadtext;
      var resourceURL = !singleResource.url ? "" : singleResource.url;
      var resourceURLText = !singleResource.linktext ? "" : singleResource.linktext;

      renderTweetSection(resourceText, resourceURL, resourceURLText);

    });
  });

  function renderTweetSection(leadtext, url, linktext) {

    var resource = '<p class="resource" style=""><span>' +
        leadtext +
        '</span> - <span class="resource-url" style=""><a href="' + url + '" target="_blank">' + linktext + '</a></span>' +
        '</p>' ;

    $("#resource-section").append(resource);
  }

});
