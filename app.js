var http = require("http");
const express = require("express");
const app = express();
const fs = require("fs");
var d = new Date();
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var dateOfToday = d.getDate() + "-" + months[d.getMonth()] + "-" + d.getFullYear();
app.use(express.json());

app.get("/login",(req,res) => {
    res.sendFile("Client/login.html",{root: __dirname});
    console.log("Received");
});

app.get("/session",(req,res) => {
    res.sendFile("Client/LoggedIn.html",{root: __dirname});
});
//MY SESSION
app.post("/session",(req,res) => {
    var user = req.body.user, token = req.body.token;
    if(req.body.ASK == "CONTACTS") {
        var userFileContent = fs.readFileSync("./Users/" + user + ".json","utf-8");
        if(JSON.parse(userFileContent).validToken == token) {
            res.send(fs.readFileSync("./Chats/" + user + ".json"));
        }
        else {
            var data = JSON.stringify({"response":"AUTHERROR","value":"THE TOKEN DOES NOT MATCH"});
            res.send(data);
            return;
        }
    }
});

app.get("/chat",(req,res) => {
    res.sendFile("Client/chat.html",{root: __dirname});
});

app.post("/chat",(req,res) => {
    var username = req.body.user, token = req.body.token;
    if(req.body.ASK == "GETCHAT") {
        if(JSON.parse(fs.readFileSync(`./Users/${req.body.user}.json`)).validToken == req.body.token) {
        var authUsersCheck = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`)).authUsers;
        var isAllowed = false;
            authUsersCheck.forEach(element => {
                if(element == req.body.user) {
                    isAllowed = true;
                }
            });
            if(isAllowed == true) {
                //DEVOLVER EL CHAT
                var allChatData = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`)).chat;
                //var actualMaxID = Object.keys(allChatData).length;
                var chName;
                authUsersCheck.forEach(element => {
                    if(element != req.body.user)
                        chName = element;
                });
                var data = JSON.stringify({"response":"OK","name":chName,"chat":allChatData});
                console.log({"response":"OK","name":chName,"chat":allChatData});
                res.send(data);
                return;
            }
        } else {
            var data = JSON.stringify({"response":"AUTHERROR","value":"THE TOKEN DOES NOT MATCH"});
            res.send(data);
            return;
        }
    } else if(req.body.ASK == "SENDMSG") {
        if(JSON.parse(fs.readFileSync(`./Users/${req.body.user}.json`)).validToken == req.body.token) {
            var authUsersCheck = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`)).authUsers;
            var isAllowed = false;
            authUsersCheck.forEach(element => {
                if(element == req.body.user) {
                    isAllowed = true;
                }
            });
            if(isAllowed == true) {
                //ENVIAR MENSAJE
                var chatOBJ = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`));
                var actualMaxID = Object.keys(chatOBJ.chat).length + 1;
                chatOBJ.chat["M" + actualMaxID] = {"msg":req.body.MSG,"owner":req.body.user,"date":dateOfToday};
                fs.writeFileSync(`./Conversations/${req.body.ID}.json`,JSON.stringify(chatOBJ));
                var data = JSON.stringify({"response":"OK"});
                res.send(data);
                return;
            }
        } else {
            var data = JSON.stringify({"response":"AUTHERROR","value":"THE TOKEN DOES NOT MATCH"});
            res.send(data);
            return;
        }
    } else if(req.body.ASK == "GETNEWSMS") {
        if(JSON.parse(fs.readFileSync(`./Users/${req.body.user}.json`)).validToken == req.body.token) {
            var authUsersCheck = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`)).authUsers;
            var isAllowed = false;
            authUsersCheck.forEach(element => {
                if(element == req.body.user) {
                    isAllowed = true;
                }
            });
            if(isAllowed == true) {
                //COMPROBAR DATOS DESACTUALIZADOS
                var chatOBJ = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`));
                var actualMaxID = Object.keys(chatOBJ.chat).length;
                if(actualMaxID != req.body.LASTMSG) {
                    //DEVOLVER EL CHAT
                    var allChatData = JSON.parse(fs.readFileSync(`./Conversations/${req.body.ID}.json`)).chat;
                    var data = JSON.stringify({"response":"OK","chat":allChatData});
                    res.send(data);
                    return;
                    //END
                }
                else {
                    var data = JSON.stringify({"response":"NOUPDATES"});
                    res.send(data);
                    return;
                }
            }
        } else {
            var data = JSON.stringify({"response":"AUTHERROR","value":"THE TOKEN DOES NOT MATCH"});
            res.send(data);
            return;
        }
    }
});

function logSth(toLog) {
    var preMsg = `[${dateOfToday} / ${d.getHours()}:${d.getMinutes()}]: `;
    if(fs.existsSync("./logs/" + dateOfToday + ".html"))
        fs.writeFileSync("./logs/" + dateOfToday + ".html",fs.readFileSync("./logs/" + dateOfToday + ".html") + "<br>" + preMsg + toLog);
    else
        fs.writeFileSync("./logs/" + dateOfToday + ".html",preMsg + toLog);
}

app.post("/login",(req,res) => {
    fs.exists("./Users/" + req.body.user + ".json",(exists) => {
        if(exists) {
            var fileContent = fs.readFileSync("./Users/" + req.body.user + ".json","utf-8");
            if(JSON.parse(fileContent).password == req.body.password) {
                const tokenChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890()&%$#@-_";
                var newToken = "";
                for(var n = 0;n <= 35;n++) {
                    newToken += tokenChars[Math.floor(Math.random() * tokenChars.length)];
                }
                var newInfo = JSON.parse(fileContent);
                console.log(newToken);
                newInfo.validToken = newToken;
                newInfo.lastlogin = dateOfToday;
                console.log(newInfo);
                fs.writeFileSync("./Users/" + req.body.user + ".json",JSON.stringify(newInfo),"utf-8");
                var data = JSON.stringify({"response":"TOKEN","token":newToken});
                res.send(data);
                logSth(`<span style="color: #0055FF">LOGIN</span> in <b>${req.body.user}</b> from <b>${req.connection.remoteAddress}</b>.`);
            }
            else {
                var data = JSON.stringify({"response":"AUTHERROR","value":"PASSWORD WAS NOT CORRECT"});
                res.send(data);
                logSth(`<span style="color: #FF0000">AUTHERROR</span> in <b>${req.body.user}</b> from <b>${req.connection.remoteAddress}</b>. Inserted data:<br>password: <b>${req.body.password}</b>`);
            }
        }
        else {
            var data = JSON.stringify({"response":"AUTHERROR","value":"THE USER DOES NOT EXIST"});
            res.send(data);
        }
    });
});

//PORT
const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Listening on port ${port}...`);
});