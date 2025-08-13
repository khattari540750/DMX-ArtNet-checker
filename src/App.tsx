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
  const [channelStart, setChannelStart] = useState<number>(1);
  const [channelEnd, setChannelEnd] = useState<number>(16);
  const [config, setConfig] = useState<ArtNetConfig>({
    ip: '192.168.1.255',
    port: 6454,
    universe: 0
  });

  // 設定を読み込んで初期チャンネル数を設定
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          if (configData.success) {
            const start = configData.config.dmx.display_channels.start;
            const end = configData.config.dmx.display_channels.end;
            const channelCount = end - start + 1;
            
            setChannelStart(start);
            setChannelEnd(end);
            setChannelCount(channelCount);
          }
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };
    
    loadConfig();
  }, []);

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

  // チャンネル範囲が変更されたときの処理
  const updateChannelRange = async (start: number, end: number) => {
    if (start < 1 || end > 512 || start > end) {
      alert('チャンネル範囲が無効です (1-512, start ≤ end)');
      return;
    }

    try {
      // 設定を更新
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dmx: {
            display_channels: {
              start: start,
              end: end
            }
          }
        }),
      });

      if (response.ok) {
        setChannelStart(start);
        setChannelEnd(end);
        const newChannelCount = end - start + 1;
        setChannelCount(newChannelCount);
      } else {
        alert('設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('設定更新エラー:', error);
      alert('設定の更新に失敗しました');
    }
  };

  // 特定のチャンネルの値を更新
  const updateChannel = (index: number, value: number) => {
    setChannels(prev => {
      const newChannels = [...prev];
      newChannels[index] = value;
      return newChannels;
    });

    // Art-Net送信をシミュレート（実際の実装では backend API を呼び出し）
    if (isConnected) {
      sendArtNetData(channelStart + index, value);
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
            <label>開始チャンネル:</label>
            <input
              type="number"
              min="1"
              max="512"
              value={channelStart}
              onChange={(e) => {
                const start = Math.max(1, Math.min(512, parseInt(e.target.value) || 1));
                if (start <= channelEnd) {
                  updateChannelRange(start, channelEnd);
                }
              }}
            />
          </div>
          
          <div className="control-group">
            <label>終了チャンネル:</label>
            <input
              type="number"
              min="1"
              max="512"
              value={channelEnd}
              onChange={(e) => {
                const end = Math.max(1, Math.min(512, parseInt(e.target.value) || 1));
                if (channelStart <= end) {
                  updateChannelRange(channelStart, end);
                }
              }}
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
              <div className="channel-label">CH {channelStart + index}</div>
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
