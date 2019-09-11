$(function(){
    if(!('getContext' in document.createElement('canvas'))){
        alert('Looks like your browser does not support canvas');
        return false;
    }

    //variables
   // var line_thickness = 7;
   // var line_colour = "blue";
    var canvas = $('#paper'),
    //This is because the canvas variable actually holds a jQuery object,
    // which doesn't have the getContext() method. 
    //By using canvas[0] I get the real canvas DOM object that does. 
    //You can alternatively do it like this: canvas.get(0)
    ctx = canvas[0].getContext('2d'), 
    instructions = $('#instructions');
  
    // Generate an unique ID
    var id = Math.round($.now()*Math.random());

    // A flag for drawing activity
    var drawing = false;

    // A flag to figure out if touch was used
    var touchUsed = false; 

    var clients = {};
    var cursors = {};

    const socket = io();

    socket.on('moving',(data)=>{
      
        if(!(data.id in clients)){
            // a new user has come online. create a cursor for them
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        // Move the mouse pointer
        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

        // Set the starting point to where the user first touched
        if (data.drawing && clients[data.id] && data.touch)
        {
            clients[data.id].x = data.startX;
            clients[data.id].y = data.startY;
        }


        // Is the user drawing?
        if(data.drawing && clients[data.id]){

            // Draw a line on the canvas. 
            //clients[data.id] holds the previous position of this user's mouse pointer

            drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
        }

        // Saving the current client state
        clients[data.id] = data;
        clients[data.id].updated = $.now();

    });

        // Previous coordinates container
        var prev = {};

        //on Mouse down   
    canvas.on('mousedown',function(e){
        e.preventDefault();
        drawing = true;
        prev.x = e.pageX;
        prev.y = e.pageY;

        // Hide the instructions
        instructions.fadeOut();
    });

        //On touch start
    canvas.on('touchestart',(e)=>{
        e.preventDefault();
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        drawing = true;
        prev.x = touch.pageX;
        prev.y = touch.pageY; 

    });


    var lastEmit = $.now();

    //On mouse move
    canvas.on('mousemove', function(e) {

    //rate-limiting it to one packet every 30 ms 
    if($.now() - lastEmit > 30){
        socket.emit('mousemove',{      
            'x': e.pageX,
            'y': e.pageY,
            'touch' : false,
            'drawing': drawing,
            'id': id
        });
        lastEmit = $.now();
      }

    // Draw a line for the current user's movement, as it is
    // not received in the socket.on('moving') event above

    if(drawing){

          drawLine(prev.x, prev.y, e.pageX, e.pageY);

            prev.x = e.pageX;
            prev.y = e.pageY;
        }

    });


    //On touch move
    canvas.on('touchmove', function(e) {
        e.preventDefault();
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
       
        //rate-limiting it to one packet every 30 ms 
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{      
                'x': touch.pageX,
                'y': touch.pageY,
                'touch':true,
                'startX' : prev.x,
                'startY' : prev.y,
                'drawing': drawing,
                'id': id
            });
            lastEmit = $.now();
          }
    
        // Draw a line for the current user's movement, as it is
        // not received in the socket.on('moving') event above
    
        if(drawing){
    
              drawLine(prev.x, prev.y, touch.pageX, touch.pageY);
    
                prev.x = touch.pageX;
                prev.y = touch.pageY;
            }
    
        });

        
     // On mouse up
     canvas.on('mouseup mouseleave', function(e) {
        drawing = false;
    });

    // On touch end
    canvas.on('touchend touchleave touchcancel', function(e) {
        drawing = false;
    
    })

    


    // Remove inactive clients after 10 seconds of inactivity
    setInterval(()=>{

        for(ident in clients){
            if($.now() - clients[ident].updated > 10000){

                // Last update was more than 10 seconds ago.
                // This user has probably closed the page

                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
        }

    },10000);

    function drawLine(fromx, fromy, tox, toy){
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
      //  ctx.lineWidth = line_thickness;
       // ctx.strokeStyle = line_colour;

        lineWidth = document.getElementById('lineWidth').value;
        if (lineWidth)
        {
            ctx.lineWidth=lineWidth;
        }
        lineColor = document.getElementById('lineColor').value;
        if (lineColor)
        {
            ctx.strokeStyle=lineColor;
        }
        ctx.lineCap ="round";
        ctx.beginPath();
        
    }
    
})

