#!/usr/bin/env node

var argv = require('yargs').array('resolutions').argv;

var plist = require('plist-native');
var fs = require('fs');
require('shelljs/global');


var CommandEDID = "ioreg -l | grep IODisplayEDID | awk -F '<|>' '{print $2}'";
var CommandProductID = "ioreg -l | grep DisplayProductID |awk '{print $NF}'"
var CommandVendorID = "ioreg -l | grep DisplayVendorID |awk '{print $NF}'"

/*
http://www.tonymacx86.com/graphics/102321-guide-add-your-custom-retina-hidpi-resolution-your-desktop-display-2.html
find the maximum resolution your greaphic card (my is gtx 650 ti : 4096 x 2160)
get your monitor aspect ratio ( 2560 x 1440 -> 1.777.. )
divide graphic card resolution by 2 and adapt it (lowering) to your monitor aspect ratio. ( 4096 x 2160 / 2 = 2048 x 1080 -> lower heith to match aspect ratio : 1920 x 1080).
multiply back by 2 the res obtained in previus step: 1920 x 1080 * 2 = 3840 x 2160 // Tis the resolution i will put in configuration. Note: is lower than the max graphic card max res but higher than monitor res.


*/

//sudo sh -c './displaytool.js  --resolutions 3440x1440 2580x1080 1911x800 1720x720 > /System/Library/Displays/Contents/Resources/Overrides/DisplayVendorID-10ac/DisplayYearManufacture-2015-DisplayWeekManufacture-11'

 
if (argv.resolutions) {
	var edidString = exec(CommandEDID, {silent:true}).output.replace('\n','');
	// console.log(edidString);
	var res = {
			DisplayVendorID:parseInt(exec(CommandVendorID, {silent:true}).output),
			DisplayProductID:parseInt(exec(CommandProductID, {silent:true}).output),
			DisplayProductName:argv.name?argv.name:"My Custom Monitor",
			IODisplayEDID:new Buffer(edidString, 'hex'),
			IOGFlags:4,
			"scale-resolutions":[]
		};
	argv.resolutions.forEach(function(resolution) {
		var m = resolution.match(/([0-9]+)x([0-9]+)/);
		var w = parseInt(m[1]);
		var h = parseInt(m[2]);
		var r = new Buffer(16);
		r.writeInt32BE(w,0);
		r.writeInt32BE(h,4);
		r.writeInt32BE(1,8);
		r.writeInt32BE(0x00200000,12);
		res["scale-resolutions"].push(r);
		

	});
	console.log(plist.build(res).toString());
} else {
	console.log("analyzyng ", argv._);

	argv._.forEach(function(filename) {
		try {
			var obj = plist.parse(fs.readFileSync(filename, 'utf8'));
			if (!obj["scale-resolutions"]) 
				return;
			obj["scale-resolutions"].forEach(function(resolution) {
				if (Number.isInteger(resolution))
					return;
			    var w = resolution.readInt32BE(0);
			    var h = resolution.readInt32BE(4);
			    var o1 = null; 
			    if (resolution.length>8)
			     	o1 = resolution.readInt32BE(8);
			    var o2 = null; 
			    if (resolution.length>12)
			     	o2 = resolution.readInt32BE(12);

			    var ratio = w/h;

			    console.log("%s:  %dx%d %s:%s", filename, w, h, +o1!=null?o1 : "-" , o2!=null?o2 : "-", ratio);
			});
		} catch(e) {
			console.log("Error: ", e);
		}

		
	});

}




