const { Builder, By } = require('selenium-webdriver');

async function pruebaControlCalidad() {

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

        // 3. IR AL PANEL
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

        // 4. IR A CONTROL CALIDAD
        const calidadBtn = await driver.findElement(
            By.css('a[href="/calidad"]')
        );

        await calidadBtn.click();

        await driver.sleep(3000);

        // 5. VALIDACIÓN FINAL
        const urlCalidad = await driver.getCurrentUrl();

        if (urlCalidad.includes('/calidad')) {
            console.log('Acceso a Control Calidad exitoso');
        } else {
            console.log('Fallo al entrar a Control Calidad');
        }

    } catch (error) {

        console.error('Error en prueba Control Calidad:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaControlCalidad();