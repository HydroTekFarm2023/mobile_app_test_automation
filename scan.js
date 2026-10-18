const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'appium_results');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function saveScreen(driver, name) {
    const xml = await driver.getPageSource();

    fs.writeFileSync(
        path.join(OUTPUT_DIR, `${name}.xml`),
        xml
    );

    await driver.saveScreenshot(
        path.join(OUTPUT_DIR, `${name}.png`)
    );

    console.log(`Saved ${name}.xml and ${name}.png`);
}

async function findVisibleElement(driver, selectors, timeout = 5000) {
    for (const selector of selectors) {
        try {
            const element = await driver.$(selector);

            await element.waitForDisplayed({ timeout });

            if (await element.isDisplayed()) {
                console.log(`Element found: ${selector}`);
                return element;
            }
        } catch (error) {
            console.log(`Locator not matched: ${selector}`);
        }
    }

    return null;
}

async function clickElement(driver, selectors, description) {
    console.log(`\nLooking for: ${description}`);

    const element = await findVisibleElement(
        driver,
        selectors,
        5000
    );

    if (!element) {
        await saveScreen(driver, 'element_not_found');

        throw new Error(
            `${description} not found. Check appium_results/element_not_found.xml`
        );
    }

    await element.click();

    console.log(`Clicked: ${description}`);

    await driver.pause(2000);

    return element;
}

async function main() {
    let driver;

    try {
        // ==========================================
        // STEP 1: CONNECT TO HYDROTEK APP
        // ==========================================

        driver = await remote({
            hostname: '127.0.0.1',
            port: 4723,
            path: '/',
            capabilities: {
                platformName: 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:deviceName': 'emulator-5554',
                'appium:appPackage': 'com.example.hydrotek_flutter',
                'appium:appActivity': '.MainActivity',
                'appium:noReset': true,
                'appium:newCommandTimeout': 120
            }
        });

        console.log('Connected to HydroTek app.');

        await driver.pause(4000);

        await saveScreen(driver, '01_dashboard');

        // ==========================================
        // STEP 2: OPEN SCAN TAB FROM DASHBOARD
        // ==========================================

        await clickElement(
            driver,
            [
                '~Camera\nTab 4 of 4',
                '~Scan',
                'android=new UiSelector().text("Scan")',
                'android=new UiSelector().descriptionContains("Scan")'
            ],
            'Scan tab'
        );

        await saveScreen(driver, '02_scan_screen');

        // ==========================================
        // STEP 3: OPEN GALLERY
        // ==========================================

        await clickElement(
            driver,
            [
                '~Gallery',
                'android=new UiSelector().text("Gallery")',
                'android=new UiSelector().description("Gallery")',
                'android=new UiSelector().textContains("Gallery")'
            ],
            'Gallery button'
        );

        await driver.pause(3000);

        await saveScreen(driver, '03_gallery');

        // ==========================================
        // STEP 4: SELECT STRAWBERRY IMAGE
        // ==========================================

        console.log('\nLooking for strawberry image...');

        // This resource ID is taken from your original code.
        // It may match the first thumbnail rather than the strawberry.
        let strawberryImage = await findVisibleElement(
            driver,
            [
                'id=com.google.android.providers.media.module:id/icon_thumbnail',
                'id=com.google.android.providers.media:id/icon_thumbnail'
            ],
            5000
        );

        if (!strawberryImage) {
            await saveScreen(driver, 'gallery_image_not_found');

            throw new Error(
                'Gallery thumbnail not found. Inspect gallery_image_not_found.xml'
            );
        }

        await strawberryImage.click();

        console.log('Gallery thumbnail clicked.');

        await driver.pause(3000);

        await saveScreen(driver, '04_after_image_selection');

        // ==========================================
        // STEP 5: FIND UPLOAD & DIAGNOSE BUTTON
        // ==========================================

        console.log('\nLooking for Upload & Diagnose...');

        const uploadSelectors = [
            'android=new UiSelector().text("Upload & Diagnose")',
            'android=new UiSelector().textContains("Upload")',
            'android=new UiSelector().textContains("Diagnose")',
            'android=new UiSelector().descriptionContains("Diagnose")',
            '~Upload & Diagnose',
            '~Upload and Diagnose'
        ];

        let uploadButton = await findVisibleElement(
            driver,
            uploadSelectors,
            4000
        );

        if (!uploadButton) {
            console.log(
                'Button not found using text or accessibility selectors.'
            );

            console.log(
                'Saving screen information for locator troubleshooting.'
            );

            await saveScreen(driver, '05_upload_button_not_found');

            throw new Error(
                'Upload & Diagnose was not detected. Inspect 05_upload_button_not_found.xml and .png'
            );
        }

        // ==========================================
        // STEP 6: CLICK UPLOAD & DIAGNOSE
        // ==========================================

        if (!(await uploadButton.isEnabled())) {
            throw new Error(
                'Upload & Diagnose button is visible but disabled.'
            );
        }

        await uploadButton.click();

        console.log('Upload & Diagnose clicked.');

        await driver.pause(5000);

        // ==========================================
        // STEP 7: CAPTURE DIAGNOSIS SCREEN
        // ==========================================

        await saveScreen(driver, '06_diagnosis_screen');

        console.log('\nAutomation completed successfully.');
        console.log(`Results folder: ${OUTPUT_DIR}`);

    } catch (error) {
        console.error('\nAUTOMATION FAILED:', error.message);

        if (driver) {
            try {
                await saveScreen(driver, 'failure_screen');
            } catch (captureError) {
                console.error(
                    'Could not capture failure screen:',
                    captureError.message
                );
            }
        }
    } finally {
        if (driver) {
            try {
                await driver.deleteSession();
                console.log('\nAppium session closed.');
            } catch (error) {
                console.log(
                    'Could not close Appium session:',
                    error.message
                );
            }
        }
    }
}
main();