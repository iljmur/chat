const client = require('socket.io').listen(4000).sockets
const mongo = require('mongodb').MongoClient

mongo.connect(process.env.DATABASE_HOST, (err, db) => {
  if (err) {
    throw err
  }

  console.log('MongoDB connected...')
  // Connect to Socket.io
  client.on('connection', (socket) => {
    let messages = db.db(process.env.DATABASE_NAME).collection(process.env.DATABASE_COLLECTION_NAME)

    // Create function to send status
    sendStatus = function (s) {
      socket.emit('status', s)
    }

    //Get chats from mongo collection
    messages.find({}).limit(100).sort({ _id: 1 }).toArray((err, res) => {
      if (err) {
        throw err
      }

      // Emit the messages
      socket.emit('output', res)
    })

    // Handle input events
    socket.on('input', (data) => {
      let name = data.name
      let userId = data.userId
      let message = data.message

      // Check for name and message
      if (name == '' || message == '') {
        // Send error status
        sendStatus('Please enter a name and message')
      } else {
        console.log('[' + name + '] ', message)
        // Insert message
        messages.insert({ name: name, message: message }, function () {
          client.emit('output', [data])

          // Send status object
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });

        // Send status object
        sendStatus({
          message: 'Message sent',
          clear: true
        });
      }
    });

    // Handle clear
    socket.on('clear', (data) => {
      // Remove all chats from collection
      messages.remove({}, function () {
        // Emit cleared
        socket.emit('cleared');
      });
    });
  });

})