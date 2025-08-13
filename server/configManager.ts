import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface AppConfig {
  app: {
    name: string;
  };
  window: {
    width: number;
    height: number;
  };
  artnet: {
    default_ip: string;
    default_port: number;
    default_universe: number;
  };
  dmx: {
    display_channels: {
      start: number;
      end: number;
    };
  };
  logging: {
    level: string;
    file_logging: boolean;
    log_file: string;
    max_file_size: string;
    max_files: number;
  };
}

class ConfigManager {
  private config: AppConfig | null = null;
  private configPath: string;

  constructor(configPath: string = 'config.yaml') {
    this.configPath = path.resolve(configPath);
  }

  /**
   * Load configuration from YAML file
   */
  public loadConfig(): AppConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Config file not found: ${this.configPath}`);
        return this.getDefaultConfig();
      }

      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      const config = yaml.load(fileContents) as AppConfig;
      
      // Validate and merge with defaults
      this.config = this.validateAndMergeConfig(config);
      console.log('Configuration loaded successfully');
      
      return this.config;
    } catch (error) {
      console.error('Error loading config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration to YAML file
   */
  public saveConfig(config: AppConfig): boolean {
    try {
      const yamlString = yaml.dump(config, {
        indent: 2,
        lineWidth: 80,
        noRefs: true,
        sortKeys: false
      });

      fs.writeFileSync(this.configPath, yamlString, 'utf8');
      this.config = config;
      console.log('Configuration saved successfully');
      
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): AppConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  /**
   * Get calculated default channel count from display range
   */
  public getDefaultChannelCount(): number {
    const config = this.getConfig();
    return config.dmx.display_channels.end - config.dmx.display_channels.start + 1;
  }

  /**
   * Update specific configuration section
   */
  public updateConfig(section: keyof AppConfig, data: any): boolean {
    try {
      const currentConfig = this.getConfig();
      currentConfig[section] = { ...currentConfig[section], ...data };
      return this.saveConfig(currentConfig);
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AppConfig {
    return {
      app: {
        name: "DMX Art-Net Checker"
      },
      window: {
        width: 1200,
        height: 800
      },
      artnet: {
        default_ip: "192.168.1.255",
        default_port: 6454,
        default_universe: 0
      },
      dmx: {
        display_channels: {
          start: 1,
          end: 16
        }
      },
      logging: {
        level: "info",
        file_logging: true,
        log_file: "dmx-artnet.log",
        max_file_size: "10MB",
        max_files: 5
      }
    };
  }

  /**
   * Validate and merge configuration with defaults
   */
  private validateAndMergeConfig(config: any): AppConfig {
    const defaultConfig = this.getDefaultConfig();
    
    // Deep merge configuration with defaults
    return this.deepMerge(defaultConfig, config);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

export default ConfigManager;
