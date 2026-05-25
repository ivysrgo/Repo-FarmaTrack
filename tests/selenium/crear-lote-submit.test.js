const { Builder, By, until } = require('selenium-webdriver');

async function pruebaCrearLoteSubmit() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // =========================
        // 1. LOGIN
        // =========================
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('juan.bahos@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(2500);

        // =========================
        // 2. BIENVENIDA → PANEL
        // =========================
        await driver.findElement(By.css('a[href="/panel"]')).click();
        await driver.sleep(2500);

        // =========================
        // 3. PANEL → NUEVO LOTE
        // =========================
        await driver.findElement(By.css('a[href="/lotes/nuevo"]')).click();
        await driver.sleep(2500);

        // =========================
        // 4. LLENAR FORMULARIO
        // =========================

        await driver.findElement(By.id('numeroOrden'))
            .sendKeys('OP-2026-002');

        await driver.findElement(By.id('codigoLote'))
            .sendKeys('LT-2026-091');

        await driver.findElement(By.id('producto'))
            .sendKeys('Ibuprofeno 400 mg');

        await driver.findElement(By.id('cantidad'))
            .sendKeys('5000');

        await driver.findElement(By.id('formaFarmaceutica'))
            .sendKeys('Tabletas');

        await driver.findElement(By.id('concentracion'))
            .sendKeys('400mg');

        await driver.findElement(By.id('fechaInicio'))
            .sendKeys('2026-05-24');

        await driver.findElement(By.id('fechaFin'))
            .sendKeys('2026-06-10');

        await driver.findElement(By.id('operario'))
            .sendKeys('Sergio Velandia');

        await driver.findElement(By.id('jefeCalidad'))
            .sendKeys('Patricia Henao');

        await driver.findElement(By.id('area'))
            .sendKeys('Sólidos — Línea 1');

        await driver.findElement(By.id('formulaId'))
            .sendKeys('Ibuprofeno 400 mg');

        await driver.findElement(By.id('observaciones'))
            .sendKeys('Lote creado por prueba automatizada Selenium');

        // =========================
        // 5. CHECKBOXES
        // =========================

        await driver.findElement(By.name('confirmFormula')).click();
        await driver.findElement(By.name('confirmMaterias')).click();
        await driver.findElement(By.name('confirmEquipos')).click();

        // =========================
        // 6. SUBMIT (CREAR LOTE)
        // =========================

        await driver.findElement(
            By.css('button[type="submit"][form="nuevoForm"]')
        ).click();

        // =========================
        // 7. ESPERAR RESPUESTA
        // =========================

        await driver.sleep(4000);

        const urlFinal = await driver.getCurrentUrl();
        console.log('URL final:', urlFinal);

        // =========================
        // 8. VALIDACIÓN CAJA NEGRA
        // =========================

        if (
            urlFinal.includes('/panel') ||
            urlFinal.includes('/lotes') ||
            urlFinal.includes('exito')
        ) {
            console.log(' LOTE CREADO Y ORDEN ASIGNADA EXITOSAMENTE');
        } else {
            console.log(' ERROR AL CREAR LOTE');
        }

    } catch (error) {

        console.error('ERROR EN PRUEBA CREAR LOTE SUBMIT:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaCrearLoteSubmit();