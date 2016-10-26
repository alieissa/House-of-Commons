var path = require('path');
var express = require('express');
var app = express();
var port = 3000;
app.use('/', express.static(__dirname));
app.use('/lib', express.static(path.join(__dirname, 'bower_components')));
app.get('/', (req, res, err) => {
  res.sendFile(path.join(__dirname, 'index.html'))
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
})
