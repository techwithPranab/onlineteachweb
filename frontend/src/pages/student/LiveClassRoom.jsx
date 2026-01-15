import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Hand,
  MessageSquare,
  Users,
  Settings,
  PhoneOff,
  Maximize,
  Minimize,
  PenTool,
  BookOpen,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { liveService } from '@/services/apiServices'
import Whiteboard from '../../components/whiteboard/TldrawWhiteboard'

export default function LiveClassRoom() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // State
  const [socket, setSocket] = useState(null)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [participants, setParticipants] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [activeView, setActiveView] = useState('video') // 'video', 'whiteboard', 'split'
  
  // Refs
  const localVideoRef = useRef(null)
  const socketRef = useRef(null)
  const localStreamRef = useRef(null)
  const peersRef = useRef({})

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'
    const newSocket = io(socketUrl, {
      auth: { token: useAuthStore.getState().token },
    })

    newSocket.on('connect', () => {
      console.log('Connected to live class server')
      // Join room
      newSocket.emit('join-class', {
        sessionId,
        userId: user._id,
        userName: user.name,
        userRole: user.role,
      })

      // Load existing whiteboard state
      newSocket.emit('whiteboard:load')
    })

    newSocket.on('user-joined', (data) => {
      setParticipants((prev) => [...prev, data])
      addSystemMessage(`${data.userName} joined the class`)
    })

    newSocket.on('user-left', (data) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId))
      addSystemMessage(`${data.userName} left the class`)
    })

    newSocket.on('chat-message', (message) => {
      setChatMessages((prev) => [...prev, message])
    })

    newSocket.on('hand-raised', (data) => {
      addSystemMessage(`${data.userName} raised their hand`)
    })

    newSocket.on('participants-update', (data) => {
      setParticipants(data)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [sessionId, user])

  // Initialize local media
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing media devices:', error)
        alert('Could not access camera/microphone. Please check permissions.')
      }
    }

    initMedia()

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const addSystemMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        type: 'system',
        text,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      videoTrack.enabled = !videoTrack.enabled
      setIsVideoOn(videoTrack.enabled)
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      audioTrack.enabled = !audioTrack.enabled
      setIsAudioOn(audioTrack.enabled)
    }
  }

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        })
        // Emit screen share start to other participants
        socketRef.current?.emit('screen-share-start', { sessionId })
        setIsScreenSharing(true)
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          socketRef.current?.emit('screen-share-stop', { sessionId })
        }
      } catch (error) {
        console.error('Error sharing screen:', error)
      }
    } else {
      setIsScreenSharing(false)
      socketRef.current?.emit('screen-share-stop', { sessionId })
    }
  }

  const toggleHandRaise = () => {
    const newState = !isHandRaised
    setIsHandRaised(newState)
    if (newState) {
      socketRef.current?.emit('raise-hand', {
        sessionId,
        userId: user._id,
        userName: user.name,
      })
    }
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim() && socketRef.current) {
      const message = {
        userId: user._id,
        userName: user.name,
        text: newMessage,
        timestamp: new Date().toISOString(),
      }
      socketRef.current.emit('chat-message', { sessionId, message })
      setChatMessages((prev) => [...prev, message])
      setNewMessage('')
    }
  }

  const leaveClass = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    socketRef.current?.disconnect()
    navigate('/student/dashboard')
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullScreen(true)
    } else {
      document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold">Live Class Session</h1>
          <p className="text-gray-400 text-sm">{participants.length} participants</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleFullScreen}
            className="p-2 hover:bg-gray-700 rounded-lg text-white"
          >
            {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
          >
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className={`relative bg-black transition-all duration-300 ${
          activeView === 'split' ? 'flex-1' : 
          activeView === 'whiteboard' ? 'w-0 overflow-hidden' : 'flex-1'
        }`}>
          {/* Main Video (Tutor or Screen Share) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Video className="w-16 h-16 mx-auto mb-4" />
                <p>Waiting for instructor to start video...</p>
              </div>
            </div>
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-20 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
              You {!isVideoOn && '(Video Off)'}
            </div>
          </div>

          {/* Hand Raised Indicator */}
          {isHandRaised && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
              <Hand className="w-5 h-5" />
              Hand Raised
            </div>
          )}
        </div>

        {/* Whiteboard Area */}
        {(activeView === 'whiteboard' || activeView === 'split') && (
          <div className={`bg-gray-100 transition-all duration-300 ${
            activeView === 'split' ? 'flex-1' : 'flex-1'
          }`}>
            <Whiteboard 
              socket={socket}
              sessionId={sessionId}
              userRole={user?.role}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-gray-400 text-sm py-2">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-primary-400 text-sm font-medium">
                          {msg.userName}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView(activeView === 'video' ? 'whiteboard' : 'video')}
            className={`p-3 rounded-lg ${
              activeView === 'whiteboard' ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Toggle Whiteboard"
          >
            <PenTool className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={() => setActiveView('split')}
            className={`p-3 rounded-lg ${
              activeView === 'split' ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Split View"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-lg ${
              isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isAudioOn ? (
              <Mic className="w-5 h-5 text-white" />
            ) : (
              <MicOff className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-lg ${
              isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-lg ${
              isScreenSharing ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-5 h-5 text-white" />
            ) : (
              <Monitor className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-lg ${
              isHandRaised ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Hand className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>

          <button className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600">
            <Settings className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={leaveClass}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white flex items-center gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
