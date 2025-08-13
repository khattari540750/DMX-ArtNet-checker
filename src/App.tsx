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
  const [availableConfigs, setAvailableConfigs] = useState<string[]>([]);
  const [currentConfig, setCurrentConfig] = useState<string>('config/config.yaml');
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveAsName, setSaveAsName] = useState<string>('');
  const [saveAsDescription, setSaveAsDescription] = useState<string>('');
  const [config, setConfig] = useState<ArtNetConfig>({
    ip: '192.168.1.255',
    port: 6454,
    universe: 0
  });

  // 設定を読み込んで初期チャンネル数を設定
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/config');
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

  // 利用可能な設定ファイル一覧を読み込み
  useEffect(() => {
    const loadAvailableConfigs = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/configs');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAvailableConfigs(data.configs);
            setCurrentConfig(data.current);
          }
        }
      } catch (error) {
        console.error('設定ファイル一覧の読み込みに失敗しました:', error);
      }
    };
    
    loadAvailableConfigs();
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
      const response = await fetch('http://localhost:3002/api/config', {
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

  // 設定ファイルを切り替え
  const switchConfigFile = async (configFile: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/config/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configFile }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentConfig(configFile);
          
          // 設定が更新されたので、アプリケーション状態も更新
          const config = data.config;
          const start = config.dmx.display_channels.start;
          const end = config.dmx.display_channels.end;
          const channelCount = end - start + 1;
          
          setChannelStart(start);
          setChannelEnd(end);
          setChannelCount(channelCount);
          
          alert(`設定ファイルを ${configFile} に切り替えました`);
        } else {
          alert(`設定切り替えに失敗しました: ${data.message}`);
        }
      } else {
        alert('設定切り替えに失敗しました');
      }
    } catch (error) {
      console.error('設定切り替えエラー:', error);
      alert('設定切り替えに失敗しました');
    }
  };

  // 設定を別名で保存
  const saveConfigAs = async () => {
    if (!saveAsName.trim()) {
      alert('ファイル名を入力してください');
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/config/save-as', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: saveAsName.trim(),
          name: saveAsName.trim(),
          description: saveAsDescription.trim() || `Saved configuration: ${saveAsName.trim()}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`設定を ${data.file} として保存しました`);
          setShowSaveDialog(false);
          setSaveAsName('');
          setSaveAsDescription('');
          
          // 利用可能な設定ファイル一覧を更新
          const configResponse = await fetch('http://localhost:3002/api/configs');
          if (configResponse.ok) {
            const configData = await configResponse.json();
            if (configData.success) {
              setAvailableConfigs(configData.configs);
            }
          }
        } else {
          alert(`保存に失敗しました: ${data.message}`);
        }
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
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
      const response = await fetch('http://localhost:3002/api/artnet/channel', {
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
      const response = await fetch('http://localhost:3002/api/artnet/send', {
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
        const response = await fetch('http://localhost:3002/api/artnet/disconnect', {
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
        const response = await fetch('http://localhost:3002/api/artnet/connect', {
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

        {/* ファイル操作セクション */}
        <section className="file-operations">
          <h2>ファイル操作</h2>
          <div className="file-controls">
            <div className="control-group">
              <label>設定ファイル:</label>
              <select
                value={currentConfig}
                onChange={(e) => switchConfigFile(e.target.value)}
              >
                {availableConfigs.map((configFile) => (
                  <option key={configFile} value={configFile}>
                    {configFile}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="control-group">
              <button 
                className="action-button secondary"
                onClick={() => setShowSaveDialog(true)}
              >
                別名で保存
              </button>
            </div>
          </div>
        </section>

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

      {/* 別名保存ダイアログ */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>設定を別名で保存</h3>
            <div className="form-group">
              <label>ファイル名:</label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="config-new"
                autoFocus
              />
              <small>※ .yamlは自動で付与されます</small>
            </div>
            <div className="form-group">
              <label>説明 (オプション):</label>
              <input
                type="text"
                value={saveAsDescription}
                onChange={(e) => setSaveAsDescription(e.target.value)}
                placeholder="設定の説明を入力"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSaveDialog(false)}>キャンセル</button>
              <button onClick={saveConfigAs} className="primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
