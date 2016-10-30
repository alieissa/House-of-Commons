# House of Commons
This app, found [here](http://house-of-commons.herokuapp.com), is a re-reproduction of the House of Commons seating app, found [here](http://www.parl.gc.ca/parliamentarians/en/floorplan). Although the functionality of the two is the same the code base is vastly different.

## Data
It was easy enough to find a csv containing the names of the MPs and their details, but I had to scrap the House of Commons website to collect the url of MPs' image and had to do data some manipulations to get data in the format that was required.

I have saved the entire data set on Firebase, so it is easily accessible from the browser, no need for back-end proxy.

## Visualization
I used the wonderful d3.js to do the visualization. Data binding in d3.js made it really simple to handle events and act on them appropriately. For all the non-SVG related coding, I used good old JQuery, this is obviously by choice and not because d3.js is incapable of doing it.
