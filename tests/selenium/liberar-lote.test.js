const { Builder, By } = require('selenium-webdriver');

async function pruebaFlujoLoteCancelarLiberacion() {

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

        // 4. ABRIR DETALLE DEL LOTE
        const detalleBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Ver detalle')]")
        );

        await detalleBtn.click();

        await driver.sleep(3000);

        // 5. AVANZAR HASTA EL ÚLTIMO PASO
        // Ajusta la cantidad según tu workflow real

        for (let i = 0; i < 8; i++) {

            const siguienteBtn = await driver.findElement(
                By.xpath("//a[contains(text(),'Paso siguiente')]")
            );

            await siguienteBtn.click();

            await driver.sleep(2000);

            console.log(`Avanzó al siguiente paso ${i + 2}`);
        }

        // 6. VALIDAR ÚLTIMA PANTALLA
        const botonLiberar = await driver.findElement(
            By.xpath("//button[contains(text(),'Liberar lote')]")
        );

        console.log('Último paso alcanzado');

        // 7. ABRIR MODAL
        await botonLiberar.click();

        await driver.sleep(3000);

        console.log('Modal de liberación abierto');

        // 8. CANCELAR LIBERACIÓN
        const cancelarBtn = await driver.findElement(
            By.xpath("//button[contains(text(),'Cancelar')]")
        );

        await cancelarBtn.click();

        await driver.sleep(3000);

        console.log('Liberación cancelada correctamente');

        // 9. MANTENER ABIERTO PARA VERIFICACIÓN VISUAL
        await driver.sleep(10000);

    } catch (error) {

        console.error('Error en prueba liberación cancelada:', error);

    } finally {

        await driver.quit();
    }
}

pruebaFlujoLoteCancelarLiberacion();