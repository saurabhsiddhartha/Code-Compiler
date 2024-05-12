import React, { useEffect, useRef, useState } from 'react';
import Avatar from 'react-avatar';
import { initSocket } from '../Socket';

const Client = ({ username }) => {
  const [muted, setMuted] = useState(false);
  const [numClients, setNumClients] = useState(0);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      // Get user media
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }
        // Send audio stream to server
        socketRef.current.emit('audioStream', stream);
      });

      // Listen for incoming audio streams from other clients
      socketRef.current.on('audioStream', (stream) => {
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }
      });

      // Listen for updates to the number of clients
      socketRef.current.on('clientCount', (count) => {
        setNumClients(count);
      });
    };
    init();

    // Cleanup function to disconnect socket
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Function to toggle mute/unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setMuted(audio.muted);
    }
  };

  return (
    <div className="d-flex align-items-center mb-3">
      <Avatar name={username.toString()} size={50} round="14px" className="mr-3" />
      <span className='mx-2'>{username.toString()} 
        {/* {numClients >0 && audioRef.current && ( */}
          <>
            <audio ref={audioRef} autoPlay controls={false} />
            <span onClick={toggleMute}>{muted ? <i class="fa-solid fa-microphone-slash"></i> : <i class="fa-solid fa-microphone"></i>}</span>
          </>
        {/* )} */}
      </span>
    </div>
  );
}

export default Client;
