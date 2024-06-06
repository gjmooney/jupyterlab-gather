import {
  HMSPeer,
  selectConnectionQualityByPeerID,
  selectDominantSpeaker,
  selectIsPeerVideoEnabled,
  useHMSStore,
  useVideo
} from '@100mslive/react-sdk';
import {
  faFaceSadCry,
  faFaceSmile,
  faFaceSmileBeam,
  faFaceTired
} from '@fortawesome/free-regular-svg-icons';
import { faHand } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import Avatar from './Avatar';

export type Location = 'grid' | 'sidepane' | 'preview';

interface IPeer {
  peer: HMSPeer;
  location: Location;
}

const Peer = ({ peer, location }: IPeer) => {
  // TODO: Use peer id instead of Peer
  const { videoRef } = useVideo({
    trackId: peer.videoTrack
  });
  const isPeerVideoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer.id));

  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  const downlinkQuality = useHMSStore(
    selectConnectionQualityByPeerID(peer.id)
  )?.downlinkQuality;

  const getInitials = (name: string) => {
    const nameSegments = name.split(/[_-\s]+/);
    const initials = nameSegments.map(word => word.charAt(0));

    return initials ? initials?.join('') : 'Woops';
  };

  const getConnectionQualityIcon = () => {
    if (!downlinkQuality || downlinkQuality === -1) {
      return null;
    }
    if (downlinkQuality === 0) {
      return (
        <FontAwesomeIcon
          icon={faFaceTired}
          className="jlab-gather-network-quality-icon"
          style={{ color: 'var(--jp-error-color1)' }}
        />
      );
    }
    if (downlinkQuality <= 2) {
      return (
        <FontAwesomeIcon
          icon={faFaceSadCry}
          className="jlab-gather-network-quality-icon"
          style={{ color: 'var(--jp-warn-color1)' }}
        />
      );
    }
    if (downlinkQuality === 3) {
      return (
        <FontAwesomeIcon
          icon={faFaceSmile}
          className="jlab-gather-network-quality-icon"
          style={{ color: 'var(--jp-success-color1)' }}
        />
      );
    }
    if (downlinkQuality >= 4) {
      return (
        <FontAwesomeIcon
          icon={faFaceSmileBeam}
          className="jlab-gather-network-quality-icon"
          style={{ color: 'var(--jp-success-color1)' }}
        />
      );
    }
  };

  return (
    <div className={`jlab-gather-peer-tile jlab-gather-peer-tile-${location}`}>
      {location === 'grid' && getConnectionQualityIcon()}
      {peer.isHandRaised ? (
        <FontAwesomeIcon
          icon={faHand}
          className="jlab-gather-peer-hand-raised-icon"
        />
      ) : (
        ''
      )}
      {isPeerVideoEnabled ? (
        <>
          <video
            ref={videoRef}
            className={`jlab-gather-peer-video jlab-gather-peer-video-${location} 
            ${peer.isHandRaised ? 'jlab-gather-peer-hand-raised' : ''}
            ${peer.isLocal ? 'jlab-gather-local' : ''}
            ${peer.id === dominantSpeaker?.id ? 'jlab-gather-active-speaker' : ''}
            `}
            autoPlay
            muted
            playsInline
          />
          <div className="jlab-gather-peer-name">{peer.name}</div>
        </>
      ) : (
        <Avatar
          location={location}
          className={`${peer.id === dominantSpeaker?.id ? 'jlab-gather-active-speaker' : ''}`}
        >
          {getInitials(peer.name)}
        </Avatar>
      )}
    </div>
  );
};

export default Peer;
