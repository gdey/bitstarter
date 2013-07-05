#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teach command line applicaiton development
and basic DOM parsing.

References:

  + cheerio
    - https://github.com/MatthewMueller/cheerio
    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
    - http://maxogden.com/scraping-with-node.html

  + commander.js
    - https://github.com/visionmedia/commander.js
    - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + JSON
    - http://en.wikipedia.org/wiki/JSON
    - https://developer.mozilla.org/en-US/docs/JSON
    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_FireFox_2

*/


var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest    = require('restler');
var HTMLFILE_DEFAULT  = "index.html";
var CHECKFILE_DEFAULT = "checks.json";


var assertFileExists = function(infile){
   var instr = infile.toString();
   if(!fs.existsSync(instr)) {
      console.log("%s does not exists. Exiting.", instr);
      process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
   }
   return instr;
};

var loadChecks = function(checksfile){
   return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(htmlData, checks){
   $ = cheerio.load(htmlData);
   var out = {};
   for( var ii in checks ){
      out[checks[ii]] = ($(checks[ii]).length > 0);
   }
   return out;
   
}

var checkHtmlFile = function( htmlfile, checks, onComplete ){
  var fileData = fs.readFileSync(htmlfile);
  onComplete( checkHtml(fileData, checks) );
};

var checkHtmlURL = function( url, checks, onComplete ){
  rest.get(url).on('complete', function(result){
    if( result instanceof Error ){
       console.log("Error for %s : "+result.error,url);
       process.exit(1);
    } else {
       onComplete( checkHtml(result, checks) );
    }

  });
}


if( require.main == module ){
   program
     .option( '-c, --checks ', 'Path to checks.json', assertFileExists, CHECKFILE_DEFAULT )
     .option( '-f, --file <file>', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT )
     .option( '-u, --url <url>', 'url to check')
     .parse( process.argv )
     ;

  
   var checks = loadChecks(program.checks).sort();
   var checkJson = {};
   var printOutput = function(checkJson) {
      var outJson   = JSON.stringify( checkJson, null, 4 );
      console.log( outJson );
   }
   program.url ? checkHtmlURL(  program.url,  checks, printOutput )
               : checkHtmlFile( program.file, checks, printOutput );
} else {
   exports.checkHtmlFile = checkHtmlFile;
}
