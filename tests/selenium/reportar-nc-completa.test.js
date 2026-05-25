const { Builder, By } = require('selenium-webdriver');

async function pruebaReportarNCCompleta() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // LOGIN OPERARIO
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('sergio.velandia@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(3000);

        // VALIDAR BIENVENIDA
        const bienvenidaUrl = await driver.getCurrentUrl();

        if (!bienvenidaUrl.includes('/bienvenida')) {
            console.log('No llegó a bienvenida');
            return;
        }

        // IR A MIS LOTES
        await driver.findElement(
            By.css('a[href="/mis-lotes"]')
        ).click();

        await driver.sleep(3000);

        // IR A NO CONFORMIDAD
        await driver.findElement(
            By.css('a[href="/noconformidad/nueva"]')
        ).click();

        await driver.sleep(3000);

        console.log('Formulario NC abierto');

        // 1. TIPO
        const tipo = await driver.findElement(By.id('tipo'));
        await tipo.sendKeys('Falla de equipo');

        // 2. LOTE
        const lote = await driver.findElement(By.id('loteId'));
        await lote.sendKeys('FT-2026-0045');

        // 3. PASO
        const paso = await driver.findElement(By.id('pasoLote'));
        await paso.sendKeys('Paso 6');

        // 4. DESCRIPCIÓN
        await driver.findElement(By.id('descripcion'))
            .sendKeys(
                'Se detectó una vibración anormal durante el retiro de marmita y se pausó temporalmente el proceso.'
            );

        // 5. IMPACTO
        const impacto = await driver.findElement(By.id('impacto'));
        await impacto.sendKeys('Alto');

        // 6. BLOQUEANTE
        const bloqueante = await driver.findElement(By.id('bloqueante'));
        await bloqueante.sendKeys('Sí');

        console.log('Formulario completado');

        await driver.sleep(2000);

        // 7. BOTÓN EXACTO ENVIAR REPORTE
        const enviarBtn = await driver.findElement(
            By.xpath("//button[contains(text(),'Enviar reporte')]")
        );

        // Scroll por si está fuera de pantalla
        await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            enviarBtn
        );

        await driver.sleep(1000);

        // CLICK
        await enviarBtn.click();

        console.log('Botón enviar presionado');

        await driver.sleep(5000);

        // VALIDACIÓN
        const finalUrl = await driver.getCurrentUrl();

        console.log('URL final:', finalUrl);

        // Mantener abierto para inspección
        await driver.sleep(15000);

    } catch (error) {

        console.error('Error en prueba NC:', error);

    } finally {

        await driver.quit();
    }
}

pruebaReportarNCCompleta();