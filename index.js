const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
var md5 = require('md5');
let names=[];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('userName', name => {
        console.log('marche js', name);
        name.image='https://www.gravatar.com/avatar/'+md5(name.email.toLowerCase());
        names.push(name);
        console.log(names);
        io.emit('userName', name);
    });

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

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});
