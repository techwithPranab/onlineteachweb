import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare,
  Hand,
  X,
  Settings,
  PhoneOff
} from 'lucide-react'
import { sessionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import Whiteboard from '@/components/whiteboard/Whiteboard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'

export default function LiveClassRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Socket and WebRTC refs
  const socketRef = useRef()
  const peersRef = useRef([])
  const userVideoRef = useRef()
  const screenStreamRef = useRef()

  // State
  const [localStream, setLocalStream] = useState(null)
  const [peers, setPeers] = useState([])
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [raisedHands, setRaisedHands] = useState([])

  // Fetch session details
  const { data: sessionData, isLoading, error } = useQuery(
    ['session', sessionId],
    () => sessionService.getSessionById(sessionId),
    { enabled: !!sessionId }
  )

  const session = sessionData?.data

  // End session mutation
  const endSessionMutation = useMutation(
    () => sessionService.endSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['session', sessionId])
        navigate('/tutor/sessions')
      }
    }
  )

  // Initialize media and socket connection
  useEffect(() => {
    if (!session || !user) return

    // Initialize socket
    socketRef.current = io(SOCKET_URL, {
      query: { sessionId, userId: user._id, userName: user.name }
    })

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream)
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream
        }

        // Join room
        socketRef.current.emit('join-room', { sessionId, userId: user._id })

        // Handle existing users
        socketRef.current.on('all-users', users => {
          const peers = []
          users.forEach(userId => {
            const peer = createPeer(userId, socketRef.current.id, stream)
            peersRef.current.push({
              peerID: userId,
              peer
            })
            peers.push({ peerID: userId, peer })
          })
          setPeers(peers)
        })

        // Handle new user joining
        socketRef.current.on('user-joined', payload => {
          const peer = addPeer(payload.signal, payload.callerID, stream)
          peersRef.current.push({
            peerID: payload.callerID,
            peer
          })
          setPeers(users => [...users, { peerID: payload.callerID, peer }])
        })

        // Handle receiving signal
        socketRef.current.on('receiving-returned-signal', payload => {
          const item = peersRef.current.find(p => p.peerID === payload.id)
          if (item) {
            item.peer.signal(payload.signal)
          }
        })

        // Handle user left
        socketRef.current.on('user-left', userId => {
          const peerObj = peersRef.current.find(p => p.peerID === userId)
          if (peerObj) {
            peerObj.peer.destroy()
          }
          const peers = peersRef.current.filter(p => p.peerID !== userId)
          peersRef.current = peers
          setPeers(peers)
        })

        // Handle participants update
        socketRef.current.on('participants-update', participants => {
          setParticipants(participants)
        })

        // Handle chat messages
        socketRef.current.on('chat-message', message => {
          setMessages(prev => [...prev, message])
        })

        // Handle raised hands
        socketRef.current.on('hand-raised', ({ userId, userName }) => {
          setRaisedHands(prev => [...prev, { userId, userName }])
        })

        socketRef.current.on('hand-lowered', ({ userId }) => {
          setRaisedHands(prev => prev.filter(h => h.userId !== userId))
        })
      })
      .catch(err => {
        console.error('Error accessing media devices:', err)
        alert('Please allow camera and microphone access to join the class')
      })

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      }
      peersRef.current.forEach(({ peer }) => peer.destroy())
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [session, user, sessionId])

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    })

    peer.on('signal', signal => {
      socketRef.current.emit('sending-signal', {
        userToSignal,
        callerID,
        signal
      })
    })

    return peer
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    })

    peer.on('signal', signal => {
      socketRef.current.emit('returning-signal', { signal, callerID })
    })

    peer.signal(incomingSignal)

    return peer
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioOn(audioTrack.enabled)
      }
    }
  }

  // Share screen
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
        screenStreamRef.current = null
      }
      
      // Switch back to camera
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0]
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(
            peer.streams[0].getVideoTracks()[0],
            videoTrack,
            peer.streams[0]
          )
        })
      }
      setIsScreenSharing(false)
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        })

        screenStreamRef.current = screenStream
        const screenTrack = screenStream.getVideoTracks()[0]

        // Replace video track with screen track
        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenTrack)
          }
        })

        screenTrack.onended = () => {
          toggleScreenShare()
        }

        setIsScreenSharing(true)
      } catch (err) {
        console.error('Error sharing screen:', err)
      }
    }
  }

  // Send chat message
  const sendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const message = {
        userId: user._id,
        userName: user.name,
        text: newMessage.trim(),
        timestamp: new Date()
      }
      socketRef.current.emit('chat-message', message)
      setNewMessage('')
    }
  }

  // Raise hand
  const toggleRaiseHand = () => {
    const isHandRaised = raisedHands.some(h => h.userId === user._id)
    if (isHandRaised) {
      socketRef.current.emit('lower-hand', { userId: user._id })
    } else {
      socketRef.current.emit('raise-hand', { userId: user._id, userName: user.name })
    }
  }

  // End session
  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      endSessionMutation.mutate()
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message="Failed to load session" />

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-lg">{session?.title}</h1>
          <p className="text-gray-400 text-sm">{participants.length} participants</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm bg-red-600 px-3 py-1 rounded-full">
            ● LIVE
          </span>
          <button
            onClick={handleEndSession}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                You {user.role === 'tutor' && '(Host)'}
              </div>
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <VideoOff className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Peer Videos */}
            {peers.map((peer, index) => (
              <Video
                key={peer.peerID}
                peer={peer.peer}
                participantName={`Participant ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Panels */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Chat</h3>
              <button onClick={() => setIsChatOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <div className="text-gray-400 text-xs">{msg.userName}</div>
                  <div className="text-white">{msg.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </form>
          </div>
        )}

        {isParticipantsOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Participants ({participants.length})</h3>
              <button onClick={() => setIsParticipantsOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {participants.map((participant) => (
                <div key={participant.userId} className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm">
                    {participant.userName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{participant.userName}</div>
                    {participant.isHost && (
                      <div className="text-xs text-gray-400">Host</div>
                    )}
                  </div>
                  {raisedHands.some(h => h.userId === participant.userId) && (
                    <Hand className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isWhiteboardOpen && (
          <div className="absolute inset-0 bg-white z-50">
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold">Whiteboard</h3>
                <button onClick={() => setIsWhiteboardOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <Whiteboard sessionId={sessionId} socket={socketRef.current} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'}`}
        >
          {isAudioOn ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}
        >
          {isVideoOn ? (
            <Video className="w-6 h-6 text-white" />
          ) : (
            <VideoOff className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full ${isScreenSharing ? 'bg-primary-600' : 'bg-gray-700'}`}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-6 h-6 text-white" />
          ) : (
            <Monitor className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          className="p-4 rounded-full bg-gray-700"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={toggleRaiseHand}
          className={`p-4 rounded-full ${
            raisedHands.some(h => h.userId === user._id) ? 'bg-yellow-600' : 'bg-gray-700'
          }`}
        >
          <Hand className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-4 rounded-full bg-gray-700 relative"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
          className="p-4 rounded-full bg-gray-700"
        >
          <Users className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}

// Peer video component
function Video({ peer, participantName }) {
  const ref = useRef()

  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) {
        ref.current.srcObject = stream
      }
    })
  }, [peer])

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
        {participantName}
      </div>
    </div>
  )
}
