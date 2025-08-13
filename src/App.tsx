import React, { useState, useEffect } from 'react';
import './App.css';

interface ArtNetConfig {
  ip: string;
  port: number;
  universe: number;
}

const App: React.FC = () => {
  const [channelCount, setChannelCount] = useState<number>(16);
  const [channels, setChannels] = useState<number[]>(new Array(16).fill(0));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [config, setConfig] = useState<ArtNetConfig>({
    ip: '192.168.1.255',
    port: 6454,
    universe: 0
  });

  // チャンネル数が変更されたときにチャンネル配列を更新
  useEffect(() => {
    setChannels(prev => {
      const newChannels = new Array(channelCount).fill(0);
      // 既存の値を保持
      for (let i = 0; i < Math.min(prev.length, channelCount); i++) {
        newChannels[i] = prev[i];
      }
      return newChannels;
    });
  }, [channelCount]);

  // 特定のチャンネルの値を更新
  const updateChannel = (index: number, value: number) => {
    setChannels(prev => {
      const newChannels = [...prev];
      newChannels[index] = value;
      return newChannels;
    });

    // Art-Net送信をシミュレート（実際の実装では backend API を呼び出し）
    if (isConnected) {
      sendArtNetData(index, value);
    }
  };

  // Art-Netデータ送信（実際のAPI呼び出し）
  const sendArtNetData = async (channel: number, value: number) => {
    try {
      const response = await fetch('http://localhost:3001/api/artnet/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channel,
          value: value,
          universe: config.universe
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('Art-Net送信エラー:', result.message);
      }
    } catch (error) {
      console.error('Art-Net送信エラー:', error);
    }
  };

  // 全チャンネルを最大値に設定
  const setAllMax = () => {
    const maxChannels = new Array(channelCount).fill(255);
    setChannels(maxChannels);
    if (isConnected) {
      sendAllChannels(maxChannels);
    }
  };

  // 全チャンネルをゼロに設定
  const setAllZero = () => {
    const zeroChannels = new Array(channelCount).fill(0);
    setChannels(zeroChannels);
    if (isConnected) {
      sendAllChannels(zeroChannels);
    }
  };

  // 全チャンネルデータを送信
  const sendAllChannels = async (channelsData: number[]) => {
    try {
      const response = await fetch('http://localhost:3001/api/artnet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: channelsData,
          universe: config.universe
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('全チャンネル送信エラー:', result.message);
      }
    } catch (error) {
      console.error('全チャンネル送信エラー:', error);
    }
  };

  // Art-Net接続の切り替え
  const toggleConnection = async () => {
    try {
      if (isConnected) {
        // 切断
        const response = await fetch('http://localhost:3001/api/artnet/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        if (result.success) {
          setIsConnected(false);
        } else {
          console.error('切断エラー:', result.message);
        }
      } else {
        // 接続
        const response = await fetch('http://localhost:3001/api/artnet/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        const result = await response.json();
        if (result.success) {
          setIsConnected(true);
        } else {
          console.error('接続エラー:', result.message);
        }
      }
    } catch (error) {
      console.error('接続エラー:', error);
      setIsConnected(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">DMX Art-Net チェッカー</h1>
        
        <div className="controls">
          <div className="control-group">
            <label>チャンネル数:</label>
            <input
              type="number"
              min="1"
              max="512"
              value={channelCount}
              onChange={(e) => setChannelCount(Math.max(1, Math.min(512, parseInt(e.target.value) || 1)))}
            />
          </div>
          
          <div className="control-group">
            <label>IP アドレス:</label>
            <input
              type="text"
              value={config.ip}
              onChange={(e) => setConfig(prev => ({ ...prev, ip: e.target.value }))}
            />
          </div>
          
          <div className="control-group">
            <label>ユニバース:</label>
            <input
              type="number"
              min="0"
              max="15"
              value={config.universe}
              onChange={(e) => setConfig(prev => ({ ...prev, universe: parseInt(e.target.value) || 0 }))}
            />
          </div>
          
          <div className="control-group">
            <button onClick={toggleConnection}>
              {isConnected ? '切断' : '接続'}
            </button>
          </div>
        </div>

        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          ステータス: {isConnected ? `接続中 (${config.ip}:${config.port}, Universe ${config.universe})` : '切断中'}
        </div>
      </header>

      <main>
        <div className="channels-grid">
          {channels.map((value, index) => (
            <div key={index} className="channel-control">
              <div className="channel-label">CH {index + 1}</div>
              <input
                type="range"
                min="0"
                max="255"
                value={value}
                onChange={(e) => updateChannel(index, parseInt(e.target.value))}
                className="channel-slider"
              />
              <div className="channel-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="actions">
          <button className="action-button primary" onClick={setAllMax}>
            全て最大 (255)
          </button>
          <button className="action-button secondary" onClick={setAllZero}>
            全てゼロ (0)
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
