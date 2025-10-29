const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'GenerativeOS',
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        background: undefined,
      },
    },
  ],
  plugins: [],
};
