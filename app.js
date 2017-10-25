var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var queuing = require('./routes/queuing');
var fs = require("fs");
var FCM = require('fcm-push');
var serverKey = 'AIzaSyCHcTh-dPy_HFQCZQ4Se-wS45ABUrCZSws';
var fcm = new FCM(serverKey);
var azure = require('azure');
var notificationHubService = azure.createNotificationHubService('Test-Laybare-Hub','Endpoint=sb://test-laybare-hub.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=wXcb4hwKEpoDIYVUGn0ndM3MbtVRyIGnAGyY5igqVmo=');   
var app = express();
var __dirData ='/home/systemlaybare/public_html/node/apis/public/data/';
app.io = require('socket.io')();
app.io.set('origins', '*:*');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//start listen with socket.io
app.io.on('connection', function(socket){
  //callAppointment Event
  socket.on('callAppointment', function(branch_id, appointment_id,cusid,clname,device){
    
    if(cusid != 0 && clname != undefined){

      if(device == 'Android'){
        var message = {
            to: '/topics/'+cusid, // required fill with device token or topics
            // collapse_key: 'your_collapse_key', 
            data: {
            //     // your_custom_data_key: 'your_custom_data_value'
                title:"Appointment Booking",
                body :"",
                message     : "Hi "+ clname +", please proceed to the branch counter and we are ready to serve you",
                subtitle    : '',
                pageUrl     : 'queuing.php?id='+branch_id,
                tickerText  : 'We are ready to serve you.',
                sounds      : 1,
                vibrate     : 1
            
            },
            notification: {
                
            }
        };

        //callback style
        fcm.send(message, function(err, response){
            if (err) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });

        // //promise style
        // fcm.send(message)
        //     .then(function(response){
        //       console.log("Successfully sent with response: ", response);
        //   })
        //   .catch(function(err){
        //       console.log("Something has gone wrong!");
        //       console.error(err);
        //   });

      }
      else if(device == 'IOS'){
        var payload={
          aps: {
            alert : {
              title:"Appointment Booking",
              body :"Hi "+ clname +", please proceed to the branch counter and we are ready to serve you"
            },
            badge : 1,
            sound : "chime.aiff",    
          },
          data:{
              isCalled:"yes",
              appointment_id:appointment_id,
              branch_id:branch_id,
              isType:'call'
          }
        };

        notificationHubService.apns.send(cusid, payload, function(error){
          if(!error){
             console.log("called");
          }
          else{
            console.log(error);
          }
        });
      }
    }



    fs.readFile(__dirData +branch_id+'.txt' , (err, data) => {
      if (err) return console.log('error read ' + err);
    
      try {
          JSON.parse(data);
      } catch (e) {
        return console.log('invalid json.');
      }

      var content = JSON.parse(data);
      var xtra = { reserve_id:appointment_id, time_added: Date.now(), readable_time_added: Date() };

      for(var x=0;x<content.user_calling.length;x++){
        if(content.user_calling[x].reserve_id == appointment_id){
          content.user_calling.splice(x,1);
        }
      }

      content.user_calling.push(xtra);

        
      fs.writeFile('/home/systemlaybare/public_html/node/apis/public/data/'+branch_id+'.txt', JSON.stringify(content), (err2) => {
        if (err2) return console.log('error write ' + err2);

        app.io.emit('callAppointment', branch_id,appointment_id,xtra);
      });//end writeFile
    });//end readFile
  });//end event

  //unCallAppointment Event
  socket.on('unCallAppointment', function(branch_id, appointment_id){
    fs.readFile(__dirData +branch_id+'.txt' , (err, data) => {
      if (err) return console.log('error read ' + err);
      
      try {
          JSON.parse(data);
      } catch (e) {
        return console.log('invalid json.');
      }

      var content = JSON.parse(data);

      for(var x =0; x<content.user_calling.length;x++){
        if(appointment_id == content.user_calling[x].reserve_id){
          content.user_calling.splice(x,1);
        }
      }
      
      fs.writeFile(__dirData +branch_id+'.txt', JSON.stringify(content), (err2) => {
        if (err2) return console.log('error write ' + err2);

        app.io.emit('unCallAppointment', branch_id,appointment_id);
      });//end writeFile
    });//end readFile
  });//end event
  //serveAppointment Event
  socket.on('serveAppointment', function(branch_id, appointment_id){
    fs.readFile(__dirData +branch_id+'.txt' , (err, data) => {
      if (err) return console.log('error read ' + err);
      try {
          JSON.parse(data);
      } catch (e) {
        return console.log('invalid json.');
      }

      var content = JSON.parse(data);
      var xtra = { reserve_id:appointment_id, time_added: Date.now(), readable_time_added: Date() };
      content.user_serving.push(xtra);
      var exists = false;

      for(var x =0; x<content.user_calling.length;x++){
        if(appointment_id == content.user_calling[x].reserve_id){
          content.user_calling.splice(x,1);
        }
      }

      for(var x=0;x<content.user_serving.length;x++){
        if(content.user_serving[x].reserve_id == appointment_id){
          exists = true;
        }
      }

      if(!exists)
        content.user_serving.push(xtra);

      
      fs.writeFile('/home/systemlaybare/public_html/node/apis/public/data/'+branch_id+'.txt', JSON.stringify(content), (err2) => {
        if (err2) return console.log('error write ' + err2);

        app.io.emit('serveAppointment', branch_id,appointment_id,xtra);
      });//end writeFile
    });//end readFile
  });//end event

  //unCallAppointment Event
  socket.on('unServeAppointment', function(branch_id, appointment_id){
    fs.readFile(__dirData +branch_id+'.txt' , (err, data) => {
      if (err) return console.log('error read ' + err);
      try {
          JSON.parse(data);
      } catch (e) {
        return console.log('invalid json.');
      }
      var content = JSON.parse(data);

      for(var x =0; x<content.user_serving.length;x++){
        if(appointment_id == content.user_serving[x].reserve_id){
          content.user_serving.splice(x,1);
        }
      }
      
      fs.writeFile(__dirData +branch_id+'.txt', JSON.stringify(content), (err2) => {
        if (err2) return console.log('error write ' + err2);

        app.io.emit('unServeAppointment', branch_id,appointment_id);
      });//end writeFile
    });//end readFile
  });//end event

  //playSound Event
  socket.on('playSound', function(branch_id){
        app.io.emit('playSound', branch_id);
  });//end event

  //refreshQueue Event
  socket.on('refreshQueue', function(branch_id){
        app.io.emit('refreshQueue', branch_id);
  });//end event

  //refreshQueue Event
  socket.on('refreshTechnicians', function(branch_id){
        app.io.emit('refreshTechnicians', branch_id);
  });//end event

});//end connection

app.use('/', index);
app.use('/queuing', queuing);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
