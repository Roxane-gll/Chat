//varables
const express = require('express');
const app=express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const md5 = require('md5');
let names=[];

//http
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static('public'));

//node js côté serveur
io.on('connection', (socket) => {
    //objets des utilisateurs envoyer pour afficher les statuts
    socket.on('userConnection',isSet=>{
        io.emit('userConnection',names);
    })

    //texte lors de l'écriture d'un message
    socket.on('write',input=>{
        io.emit('write',input);
    })

    //creation des objets utilisateurs
    socket.on('login', name => {
        name.image='https://www.gravatar.com/avatar/'+md5(name.email.toLowerCase());
        name.socketId= socket.id;
        console.log(name.ligne);
        let bon=1
        for (let i=0;i<names.length;i++){
            if(name.email===names[i].email){
                bon=0
                names.splice(i,1);
                names.push(name);
            }
        }
        if(bon===1){
            names.push(name);
        }
        console.log(names);
        io.emit('login', name);
        socket.on('disconnect', () => {
            name.ligne=false;
            io.emit('login', name);
        });
    });

    //message du chat
    socket.on('chat message', msg => {
        var gravatar='';
        for (var i=0;i<names.length;i++){
            if(msg.nomUser===names[i].nomUser){
                gravatar=names[i].image;
            }
        }
        var messageObjet={
            'name':msg.nomUser,
            'image':gravatar,
            'message':msg.mess
        };
        io.emit('chat message', messageObjet );
    });
});

//http
http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});
