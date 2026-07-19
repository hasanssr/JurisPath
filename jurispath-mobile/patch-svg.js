const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'node_modules', 'react-native-svg', 'package.json');

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg['react-native']) {
      delete pkg['react-native'];
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
      console.log('Successfully patched react-native-svg/package.json (removed react-native field)');
    } else {
      console.log('react-native-svg/package.json is already patched.');
    }
  } catch (error) {
    console.error('Failed to patch react-native-svg:', error);
  }
} else {
  console.log('react-native-svg package.json not found.');
}
