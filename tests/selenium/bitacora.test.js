const { Builder, By } = require('selenium-webdriver');

async function pruebaBitacora() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // 1. LOGIN
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('juan.bahos@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(3000);

        // 2. VALIDAR BIENVENIDA
        const urlBienvenida = await driver.getCurrentUrl();

        if (!urlBienvenida.includes('/bienvenida')) {
            console.log('Fallo: no llegó a bienvenida');
            return;
        }

        // 3. IR AL PANEL PRINCIPAL
        await driver.findElement(
            By.css('a[href="/panel"]')
        ).click();

        await driver.sleep(3000);

        const urlPanel = await driver.getCurrentUrl();

        if (!urlPanel.includes('/panel')) {
            console.log('Fallo: no llegó al panel');
            return;
        }

        console.log('Panel principal cargado');

        // 4. IR A BITÁCORA
        const bitacoraBtn = await driver.findElement(
            By.css('a[href="/bitacora"]')
        );

        await bitacoraBtn.click();

        await driver.sleep(3000);

        // 5. VALIDACIÓN FINAL
        const urlBitacora = await driver.getCurrentUrl();

        if (urlBitacora.includes('/bitacora')) {
            console.log('Acceso a Bitácora exitoso');
        } else {
            console.log('Fallo al entrar a Bitácora');
        }

    } catch (error) {

        console.error('Error en prueba Bitácora:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaBitacora();