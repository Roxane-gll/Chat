//varables
const express = require('express');
const app=express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const md5 = require('md5');
const ogs = require('open-graph-scraper');
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
        let emailFree=1
        for (let i=0;i<names.length;i++){
            if(name.email===names[i].email){
                emailFree=0
                names.splice(i,1);
                names.push(name);
            }
        }
        if(emailFree===1){
            names.push(name);
        }
        io.emit('login', name);
        socket.on('disconnect', () => {
            name.online=false;
            io.emit('login', name);
        });
    });

    //message du chat
    socket.on('chat message', msg => {
        let web={};
        let gravatar='';
        let idRoom='';
        let type='';
        names.forEach(whoIs=>{
            if(msg.pseudo===whoIs.nameCurrentlyUsed){
                gravatar=whoIs.image;
                idRoom=whoIs.socketId;
            }
        })

        //Permet de poster des images, des fichiers mp3, des vidéos Youtube ou Viméo et des pages internets
        if(msg.message.includes('image')||msg.message.includes('jpg')||msg.message.includes('jpeg')){
            type='img';
        }else if(msg.message.includes('mp3')){
            type='musique';
        }else if(msg.message.includes('youtube')){
            type='youtube';
        }else if(msg.message.includes('vimeo')){
            type='vimeo';
        }else if(msg.message.includes('https')){
            type='web';
            const options = { url: msg.message };
            ogs(options, (error, results, response) => {
                if(results.ogImage!==undefined && results.ogSiteName!==undefined){
                    web={
                        'siteName':results.ogSiteName,
                        'url':msg.message,
                        'title':results.ogTitle,
                        'description':results.ogDescription,
                        'image':results.ogImage.url
                    }
                }else{
                    web={
                        'siteName':'',
                        'url':msg.message,
                        'title':results.ogTitle,
                        'description':results.ogDescription,
                        'image':'',
                        'card':results.ogTitle,
                    }
                }

                let messageObjet={
                    'name':msg.pseudo,
                    'image':gravatar,
                    'message':web,
                    'type':type
                };
                io.emit('chat message', messageObjet );
            });

         }else{
            type='message';
        }
        //Permet d'écrire des messages privée à un autre utilisateur avec "@"
        if(msg.message.includes('@')){
            names.forEach(searchValue=>{
                if(msg.message.includes('@'+searchValue.nameCurrentlyUsed)){
                    console.log('private');
                    let messageObjet={
                        'name':msg.pseudo,
                        'image':gravatar,
                        'message':msg.message,
                        'type':type
                    };
                    io.to(searchValue.socketId).to(idRoom).emit('chat message', messageObjet );
                }
            })
        }else{

            if(type!=='web'){
                let messageObjet={
                    'name':msg.pseudo,
                    'image':gravatar,
                    'message':msg.message,
                    'type':type
                };
                io.emit('chat message', messageObjet );
            }
        }
    });
});

//http
http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});