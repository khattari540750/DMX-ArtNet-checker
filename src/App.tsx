import React, { useState, useEffect } from 'react';
import './App.css';

interface ArtNetConfig {
  ip: string;
  port: number;
  universe: number;
}

const App: React.FC = () => {
  const API_BASE_URL = 'http://localhost:3003';
  
  const [channelCount, setChannelCount] = useState<number>(16);
  const [channels, setChannels] = useState<number[]>(new Array(16).fill(0));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [channelStart, setChannelStart] = useState<number>(1);
  const [channelEnd, setChannelEnd] = useState<number>(16);
  
  // 一時的なチャンネル設定（Apply前）
  const [tempChannelStart, setTempChannelStart] = useState<number>(1);
  const [tempChannelEnd, setTempChannelEnd] = useState<number>(16);
  
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
        const response = await fetch(`${API_BASE_URL}/api/config`);
        if (response.ok) {
          const configData = await response.json();
          if (configData.success) {
            const start = configData.config.dmx.display_channels.start;
            const end = configData.config.dmx.display_channels.end;
            const channelCount = end - start + 1;
            
            setChannelStart(start);
            setChannelEnd(end);
            setChannelCount(channelCount);
            
            // 一時変数も同期
            setTempChannelStart(start);
            setTempChannelEnd(end);
          }
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
      }
    };
    
    loadConfig();
  }, []);

  // 利用可能な設定ファイル一覧を読み込み
  useEffect(() => {
    const loadAvailableConfigs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/configs`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAvailableConfigs(data.configs);
            setCurrentConfig(data.current);
          }
        }
      } catch (error) {
        console.error('Failed to load config file list:', error);
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

  // Apply channel range function (for Apply button)
  const applyChannelRange = async () => {
    const start = tempChannelStart;
    const end = tempChannelEnd;
    
    if (start < 1 || end > 512 || start > end) {
      alert('Invalid channel range (1-512, start ≤ end)');
      return;
    }

    try {
      // Update configuration
      const response = await fetch(`${API_BASE_URL}/api/config`, {
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
        
        // Resize channel array
        const newChannels = new Array(newChannelCount).fill(0);
        setChannels(newChannels);
        
        alert('Channel range applied successfully');
      } else {
        alert('Failed to update configuration');
      }
    } catch (error) {
      console.error('Configuration update error:', error);
      alert('Failed to update configuration');
    }
  };

  // 設定ファイルを切り替え
  const switchConfigFile = async (configFile: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/switch`, {
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
          
          // Sync temporary variables
          setTempChannelStart(start);
          setTempChannelEnd(end);
          
          alert(`Switched to config file: ${configFile}`);
        } else {
          alert(`Failed to switch config: ${data.message}`);
        }
      } else {
        alert('Failed to switch configuration');
      }
    } catch (error) {
      console.error('Configuration switch error:', error);
      alert('Failed to switch configuration');
    }
  };

  // Save configuration as new file
  const saveConfigAs = async () => {
    if (!saveAsName.trim()) {
      alert('Please enter a file name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/config/save-as`, {
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
          alert(`Configuration saved as ${data.file}`);
          setShowSaveDialog(false);
          setSaveAsName('');
          setSaveAsDescription('');
          
          // Update available config files list
          const configResponse = await fetch(`${API_BASE_URL}/api/configs`);
          if (configResponse.ok) {
            const configData = await configResponse.json();
            if (configData.success) {
              setAvailableConfigs(configData.configs);
            }
          }
        } else {
          alert(`Save failed: ${data.message}`);
        }
      } else {
        alert('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Save failed');
    }
  };

  // Overwrite current config file
  const overwriteCurrentConfig = async () => {
    const confirmed = window.confirm(`Overwrite current configuration to ${currentConfig}?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/config/overwrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`Configuration overwritten to ${data.file}`);
        } else {
          alert(`Overwrite failed: ${data.message}`);
        }
      } else {
        alert('Overwrite failed');
      }
    } catch (error) {
      console.error('Overwrite error:', error);
      alert('Overwrite failed');
    }
  };

  // Update specific channel value
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

  // Send Art-Net data (actual API call)
  const sendArtNetData = async (channel: number, value: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artnet/channel`, {
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
        console.error('Art-Net send error:', result.message);
      }
    } catch (error) {
      console.error('Art-Net send error:', error);
    }
  };

  // Set all channels to maximum value
  const setAllMax = () => {
    const maxChannels = new Array(channelCount).fill(255);
    setChannels(maxChannels);
    if (isConnected) {
      sendAllChannels(maxChannels);
    }
  };

  // Set all channels to zero
  const setAllZero = () => {
    const zeroChannels = new Array(channelCount).fill(0);
    setChannels(zeroChannels);
    if (isConnected) {
      sendAllChannels(zeroChannels);
    }
  };

  // Send all channel data
  const sendAllChannels = async (channelsData: number[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artnet/send`, {
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
        // Disconnect
        const response = await fetch(`${API_BASE_URL}/api/artnet/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        if (result.success) {
          setIsConnected(false);
        } else {
          console.error('Disconnect error:', result.message);
        }
      } else {
        // Connect
        const response = await fetch(`${API_BASE_URL}/api/artnet/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        const result = await response.json();
        if (result.success) {
          setIsConnected(true);
        } else {
          console.error('Connect error:', result.message);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">DMX Art-Net Checker</h1>
        
        <div className="controls">
          <div className="control-group">
            <label>Start Channel:</label>
            <input
              type="number"
              min="1"
              max="512"
              value={tempChannelStart}
              onChange={(e) => {
                const start = Math.max(1, Math.min(512, parseInt(e.target.value) || 1));
                setTempChannelStart(start);
              }}
            />
          </div>
          
          <div className="control-group">
            <label>End Channel:</label>
            <input
              type="number"
              min="1"
              max="512"
              value={tempChannelEnd}
              onChange={(e) => {
                const end = Math.max(1, Math.min(512, parseInt(e.target.value) || 1));
                setTempChannelEnd(end);
              }}
            />
          </div>
          
          <div className="control-group">
            <button 
              className="action-button primary"
              onClick={applyChannelRange}
              disabled={tempChannelStart > tempChannelEnd || tempChannelStart < 1 || tempChannelEnd > 512}
            >
              Apply Range
            </button>
            {(tempChannelStart > tempChannelEnd || tempChannelStart < 1 || tempChannelEnd > 512) && (
              <div className="validation-message">
                Valid range: 1-512, start ≤ end
              </div>
            )}
          </div>
          
          <div className="control-group">
            <label>IP Address:</label>
            <input
              type="text"
              value={config.ip}
              onChange={(e) => setConfig(prev => ({ ...prev, ip: e.target.value }))}
            />
          </div>
          
          <div className="control-group">
            <label>Universe:</label>
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
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>

        {/* File Operations Section */}
        <section className="file-operations">
          <h2>File Operations</h2>
          <div className="file-controls">
            <div className="control-group">
              <label>Config File:</label>
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
                className="action-button primary"
                onClick={overwriteCurrentConfig}
              >
                Overwrite Save
              </button>
            </div>
            
            <div className="control-group">
              <button 
                className="action-button secondary"
                onClick={() => setShowSaveDialog(true)}
              >
                Save As
              </button>
            </div>
          </div>
        </section>

        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          Status: {isConnected ? `Connected (${config.ip}:${config.port}, Universe ${config.universe})` : 'Disconnected'}
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
            Set All Max (255)
          </button>
          <button className="action-button secondary" onClick={setAllZero}>
            Set All Zero (0)
          </button>
        </div>
      </main>

      {/* Save As Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Save Configuration As</h3>
            <div className="form-group">
              <label>File Name:</label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="config-new"
                autoFocus
              />
              <small>※ .yaml will be added automatically</small>
            </div>
            <div className="form-group">
              <label>Description (Optional):</label>
              <input
                type="text"
                value={saveAsDescription}
                onChange={(e) => setSaveAsDescription(e.target.value)}
                placeholder="Enter description for this configuration"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button onClick={saveConfigAs} className="primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
