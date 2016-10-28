const path = require('path');
const express = require('express');
const app = express();


app.set('port', process.env.PORT || 8000);
app.use('/', express.static(__dirname));
app.use('/lib', express.static(path.join(__dirname, 'bower_components')));
// app.use('/images', express.static(path.join(__dirname, 'assets/images')));
// app.use('/css', express.static(path.join(__dirname, 'assets/css')));
// app.get('/', (req, res, err) => {
//   res.sendFile(path.join(__dirname, 'index.html'))
// });

app.listen(app.get("port"), (err) => {
  console.log(`Listening on ${app.get("port")}`);
})
