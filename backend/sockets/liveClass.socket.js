const jwt = require('jsonwebtoken');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');

module.exports = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Handle joining a class session
    socket.on('join-class', async (data) => {
      const { sessionId, userId, userName, userRole } = data;
      
      // Store session info on socket
      socket.sessionId = sessionId;
      socket.roomId = `session_${sessionId}`;
      socket.userRole = userRole;
      socket.userName = userName;
      
      // Join room
      socket.join(socket.roomId);
      
      // Notify others in room
      socket.to(socket.roomId).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        role: socket.userRole
      });
      
      // Track attendance
      if (socket.userRole === 'student') {
        trackAttendance(socket.sessionId, socket.userId, 'join');
      }

      console.log(`${userName} (${userRole}) joined session ${sessionId}`);
    });
    
    // Handle leaving
    socket.on('disconnect', () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName
        });
        
        // Track attendance
        if (socket.userRole === 'student' && socket.sessionId) {
          trackAttendance(socket.sessionId, socket.userId, 'leave');
        }
      }
      console.log('User disconnected:', socket.userId);
    });
    
    // Handle chat messages
    socket.on('chat-message', async (data) => {
      const { message } = data;
      
      // Save to session chat log
      await Session.findByIdAndUpdate(socket.sessionId, {
        $push: {
          chatLog: {
            user: socket.userId,
            message,
            timestamp: new Date()
          }
        }
      });
      
      // Broadcast to room
      io.to(socket.roomId).emit('chat-message', {
        userId: socket.userId,
        userName: socket.userName,
        text: message,
        timestamp: new Date()
      });
    });
    
    // Handle whiteboard updates
    socket.on('whiteboard:update', (data) => {
      // Broadcast to room except sender
      socket.to(socket.roomId).emit('whiteboard:update', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
    
    // Save whiteboard state
    socket.on('whiteboard:save', async (data) => {
      if (socket.userRole === 'host' || socket.userRole === 'tutor') {
        await Session.findByIdAndUpdate(socket.sessionId, {
          whiteboardData: JSON.stringify(data.canvasData)
        });
      }
    });

    // Handle whiteboard clear
    socket.on('whiteboard:clear', (data) => {
      socket.to(socket.roomId).emit('whiteboard:clear', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle whiteboard undo/redo
    socket.on('whiteboard:undo', (data) => {
      socket.to(socket.roomId).emit('whiteboard:undo', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    socket.on('whiteboard:redo', (data) => {
      socket.to(socket.roomId).emit('whiteboard:redo', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Load existing whiteboard state for new joiners
    socket.on('whiteboard:load', async () => {
      try {
        const session = await Session.findById(socket.sessionId);
        if (session && session.whiteboardData) {
          socket.emit('whiteboard:loaded', {
            data: JSON.parse(session.whiteboardData)
          });
        }
      } catch (error) {
        console.error('Error loading whiteboard data:', error);
      }
    });
    
    // Handle screen sharing
    socket.on('screen-share-start', () => {
      socket.to(socket.roomId).emit('screen-share-started', {
        userId: socket.userId,
        userName: socket.userName
      });
    });
    
    socket.on('screen-share-stop', () => {
      socket.to(socket.roomId).emit('screen-share-stopped', {
        userId: socket.userId,
        userName: socket.userName
      });
    });
    
    // Handle raise hand
    socket.on('raise-hand', () => {
      io.to(socket.roomId).emit('hand-raised', {
        userId: socket.userId,
        userName: socket.userName
      });
    });
    
    socket.on('hand:lower', () => {
      io.to(socket.roomId).emit('hand:lowered', {
        userId: socket.userId
      });
    });
    
    // WebRTC signaling (original format)
    socket.on('webrtc:offer', (data) => {
      socket.to(data.to).emit('webrtc:offer', {
        from: socket.id,
        offer: data.offer
      });
    });
    
    socket.on('webrtc:answer', (data) => {
      socket.to(data.to).emit('webrtc:answer', {
        from: socket.id,
        answer: data.answer
      });
    });
    
    socket.on('webrtc:ice-candidate', (data) => {
      socket.to(data.to).emit('webrtc:ice-candidate', {
        from: socket.id,
        candidate: data.candidate
      });
    });

    // Simple-Peer signaling (for LiveClassRoom component)
    socket.on('sending-signal', ({ userToSignal, callerID, signal }) => {
      io.to(userToSignal).emit('user-joined', {
        signal,
        callerID
      });
    });

    socket.on('returning-signal', ({ signal, callerID }) => {
      io.to(callerID).emit('receiving-returned-signal', {
        signal,
        id: socket.id
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      
      // Track attendance
      if (socket.userRole === 'participant') {
        trackAttendance(socket.sessionId, socket.userId, 'leave');
      }
      
      // Notify room
      socket.to(socket.roomId).emit('user:left', {
        userId: socket.userId
      });
    });
  });
};

// Helper function to track attendance
async function trackAttendance(sessionId, userId, action) {
  try {
    const session = await Session.findById(sessionId);
    if (!session) return;
    
    if (action === 'join') {
      // Find or create attendance record
      let attendance = await Attendance.findOne({
        session: sessionId,
        student: userId
      });
      
      if (!attendance) {
        attendance = await Attendance.create({
          session: sessionId,
          student: userId,
          course: session.course,
          joinedAt: new Date(),
          status: 'present'
        });
      } else {
        attendance.joinedAt = new Date();
        attendance.status = 'present';
        await attendance.save();
      }
      
      // Add to session attendees if not already there
      const attendeeIndex = session.attendees.findIndex(
        a => a.student.toString() === userId.toString()
      );
      
      if (attendeeIndex === -1) {
        session.attendees.push({
          student: userId,
          joinedAt: new Date(),
          attended: true
        });
      } else {
        session.attendees[attendeeIndex].joinedAt = new Date();
        session.attendees[attendeeIndex].attended = true;
      }
      
      await session.save();
    } else if (action === 'leave') {
      // Update leave time
      const attendance = await Attendance.findOne({
        session: sessionId,
        student: userId
      });
      
      if (attendance) {
        attendance.leftAt = new Date();
        if (attendance.joinedAt) {
          attendance.duration = Math.round(
            (attendance.leftAt - attendance.joinedAt) / (1000 * 60)
          );
        }
        await attendance.save();
      }
      
      // Update session attendees
      const attendeeIndex = session.attendees.findIndex(
        a => a.student.toString() === userId.toString()
      );
      
      if (attendeeIndex !== -1) {
        session.attendees[attendeeIndex].leftAt = new Date();
        await session.save();
      }
    }
  } catch (error) {
    console.error('Error tracking attendance:', error);
  }
}
