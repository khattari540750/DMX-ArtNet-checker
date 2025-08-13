# DMX Art-Net Checker

A DMX signal testing application built with Vite + TypeScript + React + Node.js that sends DMX signals via Art-Net protocol.

## Features

- **Real-time Control**: Manipulate DMX values in real-time with channel sliders
- **Customizable**: Specify channel count from 1-512
- **Art-Net Compatible**: Standard Art-Net protocol transmission
- **Intuitive UI**: Visual control with horizontal sliders
- **Batch Operations**: Bulk setting for all channels

## Tech Stack

### Frontend
- **React 18** - User Interface
- **TypeScript** - Type Safety
- **Vite** - Fast Build Tool
- **CSS3** - Responsive Design

### Backend
- **Node.js** - Server-side Runtime
- **Express** - RESTful API
- **Art-Net Library** - DMX-512 over Ethernet

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode
Start both frontend and backend simultaneously:
```bash
npm run start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Individual Startup
Frontend only:
```bash
npm run dev
```

Backend only:
```bash
npm run server
```

## Application Usage

### 1. Connection Settings
- **IP Address**: Art-Net device or broadcast address (e.g., 192.168.1.255)
- **Universe**: DMX universe number (0-15)
- **Channel Count**: Number of channels to display (1-512)

### 2. Art-Net Connection
1. Configure IP address and universe
2. Click "Connect" button
3. Verify status shows "Connected"

### 3. DMX Control
- **Individual Control**: Adjust each channel slider (0-255)
- **Batch Control**: 
  - "All Max (255)": Set all channels to 255
  - "All Zero (0)": Set all channels to 0

## API Endpoints

### Connection Management
- `POST /api/artnet/connect` - Establish Art-Net connection
- `POST /api/artnet/disconnect` - Disconnect Art-Net
- `GET /api/artnet/status` - Check connection status

### DMX Control
- `POST /api/artnet/send` - Send all channel data
- `POST /api/artnet/channel` - Send individual channel data

## Compatible Devices

- Art-Net compatible lighting consoles
- Art-Net to DMX converters
- Art-Net compatible LED lights
- Art-Net compatible software

## Troubleshooting

### Connection Issues
1. Check network settings
2. Verify firewall configuration
3. Confirm Art-Net device power and network connection

### DMX Signal Not Transmitting
1. Verify correct universe number
2. Ensure IP address is within device network segment
3. Check browser developer tools for errors

## License

MIT License

## Developer Information

### Project Structure
```
├── src/                 # Frontend source
│   ├── App.tsx         # Main React component
│   ├── App.css         # Stylesheet
│   └── main.tsx        # Application entry point
├── server/             # Backend source
│   └── index.ts        # Express API server
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## Contributing

Pull requests and issue reports are welcome.

## Notes

- This application is designed for development and testing purposes
- Please test thoroughly before using in production environments
- Check DMX equipment specifications before use
