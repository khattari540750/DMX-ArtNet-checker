# DMX Art-Net Checker

A comprehensive DMX signal testing application built with **Vite + TypeScript + React + Node.js** that sends DMX signals via Art-Net protocol. Features advanced configuration management, real-time channel control, and multiple configuration file support.

## 🚀 Features

### Core Functionality
- **Real-time DMX Control**: Manipulate DMX values with intuitive channel sliders
- **Flexible Channel Range**: Set custom start/end channels (1-512) with Apply button
- **Art-Net Protocol**: Standard Art-Net over Ethernet transmission
- **Live Status Display**: Real-time connection status and configuration info

### Configuration Management
- **Multiple Config Files**: Switch between different YAML configuration files
- **Dynamic File Operations**: Save As, Overwrite, and Switch configurations
- **YAML-based Settings**: Human-readable configuration format
- **Environment Profiles**: Stage, Studio, and custom configuration variants

### User Interface
- **Responsive Design**: Modern, clean interface with organized sections
- **Batch Operations**: Set all channels to max (255) or zero (0)
- **Validation**: Real-time input validation with helpful error messages
- **File Operations Panel**: Dedicated section for configuration management

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite 5.4.19** - Lightning-fast build tool and dev server
- **CSS3** - Responsive design with grid layouts

### Backend
- **Node.js** - JavaScript runtime with ES modules
- **Express** - RESTful API framework
- **Art-Net 1.4.0** - DMX-512 over Ethernet protocol
- **js-yaml 4.1.0** - YAML configuration parsing

### Configuration System
- **YAML Configuration Files** - Human-readable settings format
- **Settings Manager** - Dynamic configuration discovery
- **Config Manager** - File switching and saving operations

## 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/khattari540750/DMX-ArtNet-checker.git
cd DMX-ArtNet-checker
```

2. **Install dependencies:**
```bash
npm install
```

## 🚀 Usage

### Development Mode
Start both frontend and backend simultaneously:
```bash
npm run dev    # Frontend (Vite)
npm run server # Backend (Express) - in another terminal
```

**Access Points:**
- **Frontend**: http://localhost:3002 (Vite dev server)
- **Backend API**: http://localhost:3003 (Express server)

### Individual Startup
**Frontend only:**
```bash
npm run dev
```

**Backend only:**
**Backend only:**
```bash
npm run server
```

## 🎛 Application Usage

### 1. Configuration Management
#### Setting Up Configuration Files
The application uses a YAML-based configuration system with multiple profiles:

**Main Settings File:** `settings/settings.yaml`
```yaml
default_file: config/config-stage.yaml
available_configs:
  - config/config.yaml
  - config/config-stage.yaml
  - config/config-studio.yaml
```

**Configuration Files:** Located in `settings/config/`
- `config.yaml` - Default configuration
- `config-stage.yaml` - Stage lighting setup
- `config-studio.yaml` - Studio recording setup

#### Switching Configurations
1. Use the **Config File dropdown** in the File Operations section
2. Select desired configuration file
3. Application automatically loads new settings

#### Saving Configurations
- **Save As**: Create new configuration file with custom name
- **Overwrite Save**: Update current configuration file with current settings

### 2. Channel Range Configuration
#### Setting Channel Range
1. **Start Channel**: Enter starting DMX channel (1-512)
2. **End Channel**: Enter ending DMX channel (1-512)
3. **Apply Range**: Click to apply the new channel range
4. **Validation**: Real-time validation ensures start ≤ end

#### Range Validation
- Valid range: 1-512 channels
- Start channel must be ≤ End channel
- Visual feedback for invalid ranges

### 3. Art-Net Connection
#### Connection Setup
1. **IP Address**: Enter Art-Net device IP or broadcast address
2. **Universe**: Set DMX universe number (0-15)
3. **Connect**: Click Connect button to establish connection
4. **Status**: Monitor connection status in header

#### Connection Settings
- **Broadcast**: 192.168.1.255 (typical LAN broadcast)
- **Direct**: Specific device IP address
- **Universe**: DMX universe (0-15)

### 4. DMX Channel Control
#### Individual Channel Control
- **Channel Sliders**: Adjust each channel value (0-255)
- **Real-time Transmission**: Values sent immediately when connected
- **Channel Labels**: Display as CH 1, CH 2, etc.

#### Batch Operations
- **Set All Max (255)**: Set all channels to maximum value
- **Set All Zero (0)**: Reset all channels to zero
- **Immediate Application**: Changes apply instantly when connected

## 🔌 API Endpoints

### Configuration Management
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration
- `GET /api/configs` - List available configuration files
- `POST /api/config/switch` - Switch to different configuration file
- `POST /api/config/save-as` - Save current configuration as new file
- `POST /api/config/overwrite` - Overwrite current configuration file

### Art-Net Connection
- `POST /api/artnet/connect` - Establish Art-Net connection
- `POST /api/artnet/disconnect` - Disconnect Art-Net connection

### DMX Control
- `POST /api/artnet/send` - Send all channel data
- `POST /api/artnet/channel` - Send individual channel value

## 📁 Project Structure

```
DMX-ArtNet-checker/
├── settings/                    # Configuration system
│   ├── settings.yaml           # Main settings file
│   └── config/                 # Configuration variants
│       ├── config.yaml         # Default configuration
│       ├── config-stage.yaml   # Stage lighting setup
│       └── config-studio.yaml  # Studio setup
├── src/                        # Frontend source
│   ├── App.tsx                # Main React component
│   ├── App.css                # Stylesheet
│   └── main.tsx               # Application entry point
├── server/                     # Backend source
│   ├── index.ts               # Express API server
│   ├── configManager.ts       # Configuration file management
│   └── settingsManager.ts     # Settings discovery and loading
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts            # Vite build configuration
```

## 🎨 Configuration Examples

### Basic Configuration (config.yaml)
```yaml
artnet:
  default_ip: "192.168.1.255"
  default_port: 6454
  default_universe: 0

dmx:
  display_channels:
    start: 1
    end: 16

app:
  name: "DMX Art-Net Checker"
  version: "1.0.0"
```

### Stage Configuration (config-stage.yaml)
```yaml
artnet:
  default_ip: "192.168.1.100"
  default_port: 6454
  default_universe: 1

dmx:
  display_channels:
    start: 1
    end: 32

app:
  name: "Stage Lighting Control"
  description: "Configuration for stage lighting setup"
```

## 🔧 Compatible Devices

- **Art-Net Lighting Consoles**: GrandMA, Chamsys MagicQ, etc.
- **Art-Net to DMX Converters**: Enttec, DMXking, etc.
- **Art-Net LED Fixtures**: RGBW strips, moving lights, etc.
- **Art-Net Software**: MadMapper, Resolume, TouchDesigner, etc.

## 🐛 Troubleshooting

### Connection Issues
1. **Network Configuration**:
   - Ensure device is on same network segment
   - Check firewall settings (Art-Net uses UDP port 6454)
   - Verify subnet mask and broadcast address

2. **Art-Net Device Issues**:
   - Confirm device supports Art-Net protocol
   - Check universe configuration matches
   - Verify device is powered and network-connected

### Configuration Problems
1. **File Loading Issues**:
   - Check YAML syntax validity
   - Ensure file permissions are correct
   - Verify file paths in settings.yaml

2. **Channel Range Issues**:
   - Confirm start ≤ end channel
   - Check channels are within 1-512 range
   - Use Apply Range button after changes

### Performance Issues
1. **High Channel Count**:
   - Reduce channel range for better performance
   - Consider using batch operations
   - Monitor network traffic

## 🏗 Build and Development

### Build for Production
```bash
npm run build
```

This command performs the following operations:
1. **TypeScript Compilation**: Compiles frontend TypeScript files
2. **Vite Build**: Builds optimized frontend assets
3. **Server Build**: Compiles server TypeScript files to JavaScript
4. **Settings Copy**: Copies `settings/` directory to `dist/settings/`

The production build creates a `dist/` directory with the following structure:
```
dist/
├── index.html                    # Frontend HTML entry point
├── assets/                       # Optimized frontend assets (CSS, JS)
├── index.js                      # Compiled server entry point
├── configManager.js              # Configuration management module
├── settingsManager.js            # Settings file management module
└── settings/                     # Configuration files (copied from source)
    ├── settings.yaml             # Main settings file
    └── config/                   # Configuration variants
        ├── config.yaml           # Default configuration
        ├── config-stage.yaml     # Stage lighting setup
        └── config-studio.yaml    # Studio setup
```

### Production Environment Settings
The application automatically detects the environment and adjusts file paths accordingly:

- **Development Mode**: Uses `settings/` directory in project root
- **Production Mode**: Uses `dist/settings/` directory for all configuration files

**Environment Detection Logic:**
- Production mode is detected when the server is running from the `dist/` directory
- Can also be forced by setting `NODE_ENV=production` environment variable

### Running in Production
```bash
# After building
npm run start:prod
```

This starts the compiled server from `dist/index.js` which will automatically use the configuration files from `dist/settings/`.

### TypeScript Type Checking
```bash
npm run type-check
```

### Code Linting
```bash
npm run lint
```

## 📜 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 Notes

- **Development Use**: Primarily designed for testing and development
- **Production Considerations**: Test thoroughly before production use
- **Equipment Compatibility**: Verify DMX device specifications
- **Network Security**: Consider network security when using broadcast addresses

## 🆕 Recent Updates

- ✅ **Production Build Enhancement**: Automatic settings directory copy to dist/ during build
- ✅ **Environment-aware Configuration**: Automatic path switching between development and production
- ✅ **Improved Build Process**: Unified build command with server compilation and asset copying
- ✅ **Apply Range Functionality**: Channel range changes require Apply button
- ✅ **Configuration File Management**: Full YAML configuration system
- ✅ **File Operations**: Save As, Overwrite, and Switch configurations
- ✅ **English UI**: Complete interface localization
- ✅ **Improved Validation**: Real-time input validation and error messages
