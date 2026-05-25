const { Builder, By } = require('selenium-webdriver');

async function pruebaPasoSiguienteLote() {

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

        console.log('Panel cargado');

        // 4. ABRIR DETALLE DE LOTE
        const detalleBtn = await driver.findElement(
    By.xpath("//a[contains(text(),'Ver detalle')]")
);

        await detalleBtn.click();

        await driver.sleep(3000);

        const urlDetalle = await driver.getCurrentUrl();

        if (!urlDetalle.includes('/lotes/')) {
            console.log('Fallo al abrir detalle del lote');
            return;
        }

        console.log('Detalle de lote cargado');

        // 5. CLICK EN PASO SIGUIENTE
        const pasoSiguienteBtn = await driver.findElement(
            By.css('a[href*="/paso/2"]')
        );

        await pasoSiguienteBtn.click();

        await driver.sleep(3000);

        // 6. VALIDACIÓN FINAL
        const urlPaso2 = await driver.getCurrentUrl();

        if (urlPaso2.includes('/paso/2')) {

    console.log('Acceso a Paso 2 exitoso');

    // Mantener pantalla abierta
    await driver.sleep(10000);

} else {

    console.log('Fallo al avanzar al Paso 2');
}

    } catch (error) {

        console.error('Error en prueba Paso Siguiente:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaPasoSiguienteLote();