const { Builder, By } = require('selenium-webdriver');

async function pruebaConfiguracion() {

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

        // 4. IR A CONFIGURACIÓN
        const configuracionBtn = await driver.findElement(
            By.css('a[href="/configuracion"]')
        );

        await configuracionBtn.click();

        await driver.sleep(3000);

        // 5. VALIDACIÓN FINAL
        const urlConfiguracion = await driver.getCurrentUrl();

        if (urlConfiguracion.includes('/configuracion')) {
            console.log('Acceso a Configuración exitoso');
        } else {
            console.log('Fallo al entrar a Configuración');
        }

    } catch (error) {

        console.error('Error en prueba Configuración:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaConfiguracion();