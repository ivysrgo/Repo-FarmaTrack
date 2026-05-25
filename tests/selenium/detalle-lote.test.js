const { Builder, By } = require('selenium-webdriver');

async function pruebaDetalleLote() {

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

        // 2. IR AL PANEL
        await driver.findElement(By.css('a[href="/panel"]')).click();

        await driver.sleep(3000);

        const urlPanel = await driver.getCurrentUrl();

        if (!urlPanel.includes('/panel')) {
            console.log('Fallo: no se llegó al panel');
            return;
        }

        // 3. ABRIR DETALLE DE LOTE
        const detalleBtn = await driver.findElement(
            By.css('a[href^="/lotes/"]')
        );

        await detalleBtn.click();

        await driver.sleep(3000);

        const urlDetalle = await driver.getCurrentUrl();

        if (urlDetalle.includes('/lotes/')) {
            console.log('Acceso a detalle de lote exitoso');
        } else {
            console.log('Fallo al abrir detalle de lote');
            return;
        }

        // 4. VOLVER AL PANEL
        const volverPanelBtn = await driver.findElement(
            By.css('a[href="/panel"]')
        );

        await volverPanelBtn.click();

        await driver.sleep(3000);

        const urlFinal = await driver.getCurrentUrl();

        if (urlFinal.includes('/panel')) {
            console.log('Retorno al panel exitoso');
        } else {
            console.log('Fallo al volver al panel');
        }

    } catch (error) {

        console.error('Error en prueba detalle lote:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaDetalleLote();