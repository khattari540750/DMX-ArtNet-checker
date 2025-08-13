import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import artnet from 'artnet';
import ConfigManager from './configManager.ts';
import type { AppConfig } from './configManager.ts';

interface ArtNetController {
  client?: any;
  isConnected: boolean;
  config: {
    ip: string;
    port: number;
    universe: number;
  };
}

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Initialize configuration manager
const configManager = new ConfigManager();
const appConfig = configManager.loadConfig();

const controller: ArtNetController = {
  client: null,
  isConnected: false,
  config: {
    ip: appConfig.artnet.default_ip,
    port: appConfig.artnet.default_port,
    universe: appConfig.artnet.default_universe
  }
};

// 設定管理API
// 設定全体を取得
app.get('/api/config', (req, res) => {
  try {
    const config = configManager.getConfig();
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('設定取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '設定の取得に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 設定を更新
app.put('/api/config', (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: '設定データが提供されていません'
      });
    }

    const saved = configManager.saveConfig(config);
    
    if (saved) {
      // Art-Net設定が変更された場合、コントローラー設定も更新
      if (config.artnet) {
        controller.config.ip = config.artnet.default_ip;
        controller.config.port = config.artnet.default_port;
        controller.config.universe = config.artnet.default_universe;
      }

      res.json({
        success: true,
        message: '設定が保存されました'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '設定の保存に失敗しました'
      });
    }
  } catch (error) {
    console.error('設定保存エラー:', error);
    res.status(500).json({
      success: false,
      message: '設定の保存に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 特定セクションの設定を更新
app.put('/api/config/:section', (req, res) => {
  try {
    const { section } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: '設定データが提供されていません'
      });
    }

    const updated = configManager.updateConfig(section as keyof AppConfig, data);
    
    if (updated) {
      res.json({
        success: true,
        message: `${section}設定が更新されました`
      });
    } else {
      res.status(500).json({
        success: false,
        message: '設定の更新に失敗しました'
      });
    }
  } catch (error) {
    console.error('設定更新エラー:', error);
    res.status(500).json({
      success: false,
      message: '設定の更新に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 利用可能な設定ファイル一覧を取得
app.get('/api/configs', (req, res) => {
  try {
    const settingsManager = configManager.getSettingsManager();
    const availableFiles = settingsManager.getAvailableConfigFiles();
    const currentSettings = settingsManager.getSettings();
    
    res.json({
      success: true,
      configs: availableFiles,
      current: currentSettings.config.default_file
    });
  } catch (error) {
    console.error('設定一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: '設定一覧の取得に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 設定を再読み込み
app.post('/api/config/reload', (req, res) => {
  try {
    configManager.reloadSettings();
    const config = configManager.getConfig();
    res.json({
      success: true,
      message: '設定を再読み込みしました',
      config: config
    });
  } catch (error) {
    console.error('設定再読み込みエラー:', error);
    res.status(500).json({
      success: false,
      message: '設定の再読み込みに失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 設定ファイルを切り替え
app.post('/api/config/switch', (req, res) => {
  try {
    const { configFile } = req.body;
    
    if (!configFile) {
      return res.status(400).json({
        success: false,
        message: '設定ファイル名が指定されていません'
      });
    }

    // settings.yamlを更新
    const settingsManager = configManager.getSettingsManager();
    const currentSettings = settingsManager.getSettings();
    
    const updatedSettings = {
      ...currentSettings,
      config: {
        ...currentSettings.config,
        default_file: configFile
      }
    };

    const saved = settingsManager.saveSettings(updatedSettings);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'settings.yamlの更新に失敗しました'
      });
    }

    // 設定を再読み込み
    configManager.reloadSettings();
    const newConfig = configManager.getConfig();

    res.json({
      success: true,
      message: `設定ファイルを ${configFile} に切り替えました`,
      config: newConfig
    });
  } catch (error) {
    console.error('設定ファイル切り替えエラー:', error);
    res.status(500).json({
      success: false,
      message: '設定ファイルの切り替えに失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 現在の設定を別名で保存
app.post('/api/config/save-as', (req, res) => {
  try {
    const { filename, name, description } = req.body;
    
    if (!filename || !filename.trim()) {
      return res.status(400).json({
        success: false,
        message: 'ファイル名が指定されていません'
      });
    }

    // ファイル名の検証（危険な文字を除外）
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-_]/g, '');
    if (!sanitizedFilename) {
      return res.status(400).json({
        success: false,
        message: '無効なファイル名です'
      });
    }

    const newConfigFile = `config/${sanitizedFilename}.yaml`;
    const newConfigPath = path.resolve('settings', newConfigFile);
    
    // ファイルが既に存在するかチェック
    if (fs.existsSync(newConfigPath)) {
      return res.status(409).json({
        success: false,
        message: 'ファイルが既に存在します'
      });
    }

    // 現在の設定を取得
    const currentConfig = configManager.getConfig();
    
    // 設定ファイルを保存
    const yamlString = yaml.dump(currentConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    
    const configDir = path.dirname(newConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(newConfigPath, yamlString, 'utf8');

    // settings.yamlの利用可能な設定リストを更新
    const settingsManager = configManager.getSettingsManager();
    const currentSettings = settingsManager.getSettings();
    
    const newConfigEntry = {
      name: name || sanitizedFilename,
      file: newConfigFile,
      description: description || `Saved configuration: ${sanitizedFilename}`
    };

    const updatedSettings = {
      ...currentSettings,
      available_configs: [...currentSettings.available_configs, newConfigEntry]
    };

    settingsManager.saveSettings(updatedSettings);

    res.json({
      success: true,
      message: `設定を ${newConfigFile} として保存しました`,
      file: newConfigFile,
      config: currentConfig
    });
  } catch (error) {
    console.error('設定別名保存エラー:', error);
    res.status(500).json({
      success: false,
      message: '設定の保存に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Art-Net接続
app.post('/api/artnet/connect', (req, res) => {
  try {
    const { ip, port, universe } = req.body;
    
    // 既存の接続がある場合は切断
    if (controller.client) {
      controller.client.close();
    }

    // 新しい接続を作成 (タイムアウト: 5000ms)
    controller.client = artnet({
      host: ip || controller.config.ip,
      port: port || controller.config.port
    });

    controller.config = {
      ip: ip || controller.config.ip,
      port: port || controller.config.port,
      universe: universe !== undefined ? universe : controller.config.universe
    };

    controller.isConnected = true;

    res.json({
      success: true,
      message: 'Art-Net接続が確立されました',
      config: controller.config
    });
  } catch (error) {
    console.error('Art-Net接続エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Art-Net接続に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Art-Net切断
app.post('/api/artnet/disconnect', (req, res) => {
  try {
    if (controller.client) {
      controller.client.close();
      controller.client = null;
    }
    controller.isConnected = false;

    res.json({
      success: true,
      message: 'Art-Net接続が切断されました'
    });
  } catch (error) {
    console.error('Art-Net切断エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Art-Net切断に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 接続状態確認
app.get('/api/artnet/status', (req, res) => {
  res.json({
    isConnected: controller.isConnected,
    config: controller.config
  });
});

// DMXデータ送信
app.post('/api/artnet/send', (req, res) => {
  try {
    if (!controller.isConnected || !controller.client) {
      return res.status(400).json({
        success: false,
        message: 'Art-Netに接続されていません'
      });
    }

    const { channels, universe } = req.body;
    
    if (!Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        message: 'チャンネルデータが無効です'
      });
    }

    const targetUniverse = universe !== undefined ? universe : controller.config.universe;

    // DMXデータを送信
    controller.client.set(targetUniverse, channels, (err: any) => {
      if (err) {
        console.error('DMX送信エラー:', err);
        return res.status(500).json({
          success: false,
          message: 'DMXデータの送信に失敗しました',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: 'DMXデータが送信されました',
        universe: targetUniverse,
        channelCount: channels.length
      });
    });
  } catch (error) {
    console.error('DMX送信エラー:', error);
    res.status(500).json({
      success: false,
      message: 'DMXデータの送信に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 特定チャンネルの値を送信
app.post('/api/artnet/channel', (req, res) => {
  try {
    if (!controller.isConnected || !controller.client) {
      return res.status(400).json({
        success: false,
        message: 'Art-Netに接続されていません'
      });
    }

    const { channel, value, universe } = req.body;
    
    if (channel === undefined || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'チャンネルまたは値が指定されていません'
      });
    }

    if (channel < 0 || channel > 511 || value < 0 || value > 255) {
      return res.status(400).json({
        success: false,
        message: 'チャンネルまたは値の範囲が無効です'
      });
    }

    const targetUniverse = universe !== undefined ? universe : controller.config.universe;

    // 単一チャンネルの値を設定
    controller.client.set(targetUniverse, channel, value, (err: any) => {
      if (err) {
        console.error('チャンネル送信エラー:', err);
        return res.status(500).json({
          success: false,
          message: 'チャンネルデータの送信に失敗しました',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: `チャンネル ${channel + 1} の値が ${value} に設定されました`,
        channel: channel,
        value: value,
        universe: targetUniverse
      });
    });
  } catch (error) {
    console.error('チャンネル送信エラー:', error);
    res.status(500).json({
      success: false,
      message: 'チャンネルデータの送信に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`DMX Art-Net APIサーバーがポート ${PORT} で起動しました`);
});

// プロセス終了時のクリーンアップ
process.on('SIGTERM', () => {
  if (controller.client) {
    controller.client.close();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (controller.client) {
    controller.client.close();
  }
  process.exit(0);
});
