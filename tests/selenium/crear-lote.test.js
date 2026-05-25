const { Builder, By, until } = require('selenium-webdriver');

async function pruebaCrearLote() {

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
            .sendKeys('OP-2026-001');

        await driver.findElement(By.id('codigoLote'))
            .sendKeys('LT-2026-090');

        await driver.findElement(By.id('producto'))
            .sendKeys('Amoxicilina 500 mg');

        await driver.findElement(By.id('cantidad'))
            .sendKeys('5000');

        await driver.findElement(By.id('formaFarmaceutica'))
            .sendKeys('Tabletas');

        await driver.findElement(By.id('concentracion'))
            .sendKeys('500mg');

        // Fechas (formato YYYY-MM-DD)
        await driver.findElement(By.id('fechaInicio'))
            .sendKeys('2026-05-24');

        await driver.findElement(By.id('fechaFin'))
            .sendKeys('2026-06-10');

        await driver.findElement(By.id('directorTecnico'))
            .sendKeys('Juan Bahos');

        // =========================
        // 5. SELECTS
        // =========================

        await driver.findElement(By.id('operario'))
            .sendKeys('Sergio Velandia');

        await driver.findElement(By.id('jefeCalidad'))
            .sendKeys('Patricia Henao');

        await driver.findElement(By.id('area'))
            .sendKeys('Sólidos — Línea 1');

        await driver.findElement(By.id('formulaId'))
            .sendKeys('Amoxicilina 500 mg');

        // =========================
        // 6. OBSERVACIONES
        // =========================

        await driver.findElement(By.id('observaciones'))
            .sendKeys('Lote de prueba automatizada con Selenium');

        // =========================
        // 7. CHECKBOXES
        // =========================

        await driver.findElement(By.name('confirmFormula')).click();
        await driver.findElement(By.name('confirmMaterias')).click();
        await driver.findElement(By.name('confirmEquipos')).click();

        // =========================
        // 8. VALIDACIÓN PRE-ENVÍO
        // =========================

        await driver.sleep(1000);

        console.log('Formulario de lote diligenciado correctamente');

        // =========================
        // 9. CANCELAR (opcional test de flujo)
        // =========================

        await driver.findElement(By.css('.btn-accion--cancel')).click();

        await driver.sleep(2000);

        const urlFinal = await driver.getCurrentUrl();
        console.log('URL final:', urlFinal);

        if (urlFinal.includes('/panel')) {
            console.log(' FLUJO DE CREACIÓN DE LOTE COMPLETADO (CANCELADO CORRECTAMENTE)');
        } else {
            console.log(' ERROR EN FLUJO DE LOTE');
        }

    } catch (error) {

        console.error('ERROR EN PRUEBA CREAR LOTE:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaCrearLote();