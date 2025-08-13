import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface SettingsConfig {
  config: {
    default_file: string;
  };
  available_configs: Array<{
    name: string;
    file: string;
    description: string;
  }>;
}

class SettingsManager {
  private settings: SettingsConfig | null = null;
  private settingsPath: string;

  constructor(settingsPath: string = 'settings/settings.yaml') {
    this.settingsPath = path.resolve(settingsPath);
  }

  /**
   * Load settings configuration
   */
  public loadSettings(): SettingsConfig {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        console.log('Settings file not found, creating default...');
        const defaultSettings = this.getDefaultSettings();
        this.saveSettings(defaultSettings);
        return defaultSettings;
      }

      const fileContents = fs.readFileSync(this.settingsPath, 'utf8');
      const parsedSettings = yaml.load(fileContents) as SettingsConfig;
      
      this.settings = { ...this.getDefaultSettings(), ...parsedSettings };
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save settings configuration
   */
  public saveSettings(settings: SettingsConfig): boolean {
    try {
      const yamlString = yaml.dump(settings, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.settingsPath, yamlString, 'utf8');
      this.settings = settings;
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): SettingsConfig {
    if (!this.settings) {
      return this.loadSettings();
    }
    return this.settings;
  }

  /**
   * Get the path to the default config file
   */
  public getDefaultConfigPath(): string {
    const settings = this.getSettings();
    return path.resolve('settings', settings.config.default_file);
  }

  /**
   * Get available config files in the config directory
   */
  public getAvailableConfigFiles(): string[] {
    try {
      const configDir = path.resolve('settings/config');
      if (!fs.existsSync(configDir)) {
        return [];
      }
      
      const files = fs.readdirSync(configDir);
      return files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => `config/${file}`);
    } catch (error) {
      console.error('Error reading config directory:', error);
      return [];
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SettingsConfig {
    return {
      config: {
        default_file: "config/config.yaml"
      },
      available_configs: [
        {
          name: "Default Configuration",
          file: "config/config.yaml",
          description: "Standard DMX Art-Net configuration"
        }
      ]
    };
  }
}

export default SettingsManager;
