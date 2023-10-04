const express = require("express");
const app = express();
app.use(express.static(__dirname));

const port = 3000
app.use(express.static("public"));

app.get('/', function(req, res){
    res.sendFile(__dirname + "/" + '/public/home.html');
  });

app.listen(port, () => {
    console.log(`Express server is running and listening on port ${port}`);
})