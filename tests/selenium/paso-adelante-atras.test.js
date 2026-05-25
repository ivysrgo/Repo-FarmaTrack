const { Builder, By } = require('selenium-webdriver');

async function pruebaPasoAdelanteAtras() {

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

        // 4. ABRIR DETALLE DE LOTE
        const detalleBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Ver detalle')]")
        );

        await detalleBtn.click();

        await driver.sleep(3000);

        const urlDetalle = await driver.getCurrentUrl();

        if (!urlDetalle.includes('/lotes/')) {
            console.log('Fallo al abrir detalle');
            return;
        }

        console.log('Detalle de lote cargado');

        // 5. IR A PASO 2
        const pasoSiguienteBtn = await driver.findElement(
            By.css('a[href*="/paso/2"]')
        );

        await pasoSiguienteBtn.click();

        await driver.sleep(3000);

        const urlPaso2 = await driver.getCurrentUrl();

        if (!urlPaso2.includes('/paso/2')) {
            console.log('Fallo al avanzar al Paso 2');
            return;
        }

        console.log('Avance a Paso 2 exitoso');

        // 6. VOLVER A PASO 1
        const pasoAnteriorBtn = await driver.findElement(
            By.css('a[href*="/paso/1"]')
        );

        await pasoAnteriorBtn.click();

        await driver.sleep(3000);

        // 7. VALIDACIÓN FINAL
        const urlPaso1 = await driver.getCurrentUrl();

        if (urlPaso1.includes('/paso/1')) {

            console.log('Retorno a Paso 1 exitoso');

            // Mantener abierto para verificar visualmente
            await driver.sleep(10000);

        } else {

            console.log('Fallo al regresar al Paso 1');
        }

    } catch (error) {

        console.error('Error en prueba avance y retroceso:', error);

    } finally {

        await driver.quit();
    }
}

pruebaPasoAdelanteAtras();