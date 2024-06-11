import {
  selectPeerCount,
  selectPeers,
  useHMSStore
} from '@100mslive/react-sdk';
import React, { useEffect, useState } from 'react';
import Peer from '../components/Peer';
import {
  calculateWidthAndHeight,
  getColumnCount,
  getRowCount
} from '../utils/gridViewHelpers';

const GridView = () => {
  const peers = useHMSStore(selectPeers);
  const peerCount = useHMSStore(selectPeerCount);
  const [rootDimensions, setRootDimensions] = useState({
    height: 800,
    width: 1000
  });

  useEffect(() => {
    const root = document.getElementById('jlab-gather-rootId');

    if (root) {
      // console.log('height', rootHeight);
      setRootDimensions({
        height: root.clientHeight,
        width: root.clientWidth
      });
    }
  }, []);

  const { height, width } = calculateWidthAndHeight({
    clientHeight: rootDimensions.height,
    clientWidth: rootDimensions.width,
    columns: getColumnCount(peerCount),
    desiredNumberOfVisibleTiles: 25,
    minVisibleRows: getRowCount(peerCount),
    numberOfParticipants: peerCount
  });

  return (
    <div className="jlab-gather-main-grid-container" style={{ height: 900 }}>
      <div className="jlab-gather-main-grid-view">
        {peers.map(peer => (
          <>
            <Peer
              key={peer.id}
              peer={peer}
              location="grid"
              width={width}
              height={height}
            />
          </>
        ))}
      </div>
    </div>
  );
};

export default GridView;
