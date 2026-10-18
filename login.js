const { remote } = require('webdriverio');

(async () => {
  // Step 1: Connect to Appium and launch Hydrotek app
  const d = await remote({
    protocol: 'http', hostname: '127.0.0.1', port: 4723, path: '/',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android',
      'appium:appPackage': 'com.example.hydrotek_flutter',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': true
    }
  });

  await d.pause(3000);
  await d.activateApp('com.example.hydrotek_flutter');
  await d.pause(1000);

  // Step 2: Fill email field
  const e1 = await d.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
  await e1.click(); await d.pause(400);
  await e1.setValue('YOUR_EMAIL_HERE');

  // Step 3: Fill password field
  const e2 = await d.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
  await e2.click(); await d.pause(400);
  await e2.setValue('YOUR_PASSWORD_HERE');

  // Step 4: Hide keyboard to reveal login button
  await d.pause(500);
  try { await d.hideKeyboard(); } catch {}
  await d.pause(1500);

  // Step 5: Tap on Login button 
  const s = await d.getWindowSize();
  const x = s.width * 0.5;
  const y = s.height * 0.68;

  console.log(`Tapping Login at ${x}, ${y}`);
  await d.performActions([{
    type: 'pointer', id: 'f1',
    parameters: { pointerType: 'touch' },
    actions: [
      { type: 'pointerMove', duration: 0, x: x, y: y },
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration: 250 },
      { type: 'pointerUp', button: 0 }
    ]
  }]);

  // Step 6: Wait for dashboard to load
  await d.pause(8000);
  console.log('Check - Dashboard should be open now');
})();