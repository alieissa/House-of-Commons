'use strict';

const path = require('path');
const express = require('express');
const app = express();


app.set('port', process.env.PORT || 8000);
app.use('/', express.static(__dirname));
app.use('/lib', express.static(path.join(__dirname, 'bower_components')));

app.listen(app.get("port"), (err) => {
    if(err) {
        console.log(err);
    }
    else {
        console.log(`Listening on ${app.get("port")}`);
    }
});
