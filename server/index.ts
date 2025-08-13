import express from 'express';
import cors from 'cors';
import artnet from 'artnet';

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
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const controller: ArtNetController = {
  client: null,
  isConnected: false,
  config: {
    ip: '192.168.1.255',
    port: 6454,
    universe: 0
  }
};

// Art-Net接続
app.post('/api/artnet/connect', (req, res) => {
  try {
    const { ip, port, universe } = req.body;
    
    // 既存の接続がある場合は切断
    if (controller.client) {
      controller.client.close();
    }

    // 新しい接続を作成
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
