const express = require('express')
const app = express()
var path = require('path');
var request = require('request'); // used to get the page
var cheerio = require('cheerio'); // used to parse HTML
var urlparse = require('url-parse');
var url = require("url"); // used to parse urls for hostname etc

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies



app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
})

app.post('/check', function (req, res) {
  var pageToVisit = req.body.url
  var toReturn = ""
  toReturn = toReturn + "Checking " + pageToVisit + " <br/>"
  new Promise(resolve => {
    request(pageToVisit, function(error, response, body) {
      if(error) {
        toReturn = toReturn +  error + " <br/>"
      }
      // Check status code (200 is HTTP OK)
      toReturn = toReturn + "Status code: " + response.statusCode + " <br/>"
      if(response.statusCode === 200) {
      // Parse the document body
        var $ = cheerio.load(body)
        toReturn = toReturn + "Page title:  " + $('title').text() + " <br/>"

        // get relative links
        var relativeLinks = $("a[href^='/']");
        toReturn = toReturn + "Relative links:  " + Object.keys(relativeLinks).length + " <br/>"

        // get absolute links
        var absolutepath = $("a[href^='http']");
        toReturn = toReturn + "Absolute path links:  " + Object.keys(absolutepath).length + " <br/>"

        // get total links
        toReturn = toReturn + "Total links:  " + (Object.keys(absolutepath).length + Object.keys(relativeLinks).length) + " <br/>"

        // check unique domains
        let uniquedomains = []
        absolutepath.each(function() {
          if (uniquedomains.indexOf(url.parse($(this).attr('href')).hostname) < 0) uniquedomains.push(url.parse($(this).attr('href')).hostname);
        });
        toReturn = toReturn + "Unique Domains:  " + uniquedomains.length + " <br/>"

        // check is secure
        if(url.parse(pageToVisit).protocol == "https:"){
          toReturn = toReturn + "Is secure: Yes " + " <br/>"
        }else{
          toReturn = toReturn + "Is secure: No " + " <br/>"
        }

        // get JS files
        var scripts = $("script");
        let ga = false
        scripts.each(function() {
          if( $(this).attr('src') == "https://www.google-analytics.com/analytics.js"){
            ga = true;
          }
          if( $(this).attr('src') == "https://www.google-analytics.com/ga.js"){
            ga = true;
          }
        });

        if(ga == true) {
          toReturn = toReturn + "Google analytics was found" + " <br/>"
        }else{
          toReturn = toReturn + "Google analytics was not found but may still be installed via tag manager or another method" + " <br/>"
        }

      }

      resolve(toReturn);
    })
  }).then(value => {
    res.send(toReturn);
  })


})

app.listen(3000, () => console.log('Example app listening on port 3000!'))