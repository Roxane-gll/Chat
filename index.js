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
        let writingId='';
        if(input.writing.includes('@')){
            names.forEach(whoIs=>{
                if(input.pseudoWriting===whoIs.nameCurrentlyUsed){
                    writingId=whoIs.socketId;
                }
                if(input.writing.includes('@'+whoIs.nameCurrentlyUsed)){
                    io.to(whoIs.socketId).to(writingId).emit('write', input);
                }
            })
        }else{
            io.emit('write',input);
        }
    })

    //creation des objets utilisateurs
    socket.on('login', name => {
        name.image='https://www.gravatar.com/avatar/'+md5(name.email.toLowerCase());
        name.socketId= socket.id;
        console.log(name.online);
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
            name.online=false;
            io.emit('login', name);
        });
    });

    //message du chat
    socket.on('chat message', msg => {
        var gravatar='';
        let idRoom='';
        names.forEach(whoIs=>{
            if(msg.pseudo===whoIs.nameCurrentlyUsed){
                gravatar=whoIs.image;
                idRoom=whoIs.socketId;
            }
        })
        if(msg.message.includes('@')){
            names.forEach(searchValue=>{
                if(msg.message.includes('@'+searchValue.nameCurrentlyUsed)){
                    console.log('private');
                    var messageObjet={
                        'name':msg.pseudo,
                        'image':gravatar,
                        'message':msg.message
                    };
                    io.to(searchValue.socketId).to(idRoom).emit('chat message', messageObjet );
                }
            })
        }else{
            var messageObjet={
                'name':msg.pseudo,
                'image':gravatar,
                'message':msg.message
            };
            io.emit('chat message', messageObjet );
        }
    });
});

//http
http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});
