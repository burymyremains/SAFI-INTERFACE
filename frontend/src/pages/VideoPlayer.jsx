// VideoPlayer.js
import React from 'react';
import ReactPlayer from 'react-player';

// Usamos React.memo para evitar el re-renderizado innecesario
const VideoPlayer = React.memo(({ url, isPlaying }) => {
  return (
    <ReactPlayer
      url={url}
      playing={isPlaying}
      controls
      width="1120px"
      height="576px"
    />
  );
});

export default VideoPlayer;