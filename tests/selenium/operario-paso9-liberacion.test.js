const { Builder, By, until } = require('selenium-webdriver');

async function pruebaPaso9Liberacion() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // =====================================================
        // LOGIN
        // =====================================================
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('sergio.velandia@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(3000);

        let currentUrl = await driver.getCurrentUrl();

        if (!currentUrl.includes('/bienvenida')) {
            console.log('No llegó a bienvenida');
            return;
        }

        // =====================================================
        // MIS LOTES
        // =====================================================
        await driver.findElement(By.css('a[href="/mis-lotes"]')).click();
        await driver.sleep(3000);

        await driver.findElement(By.xpath("//a[contains(text(),'Continuar paso')]")).click();
        await driver.sleep(4000);

        currentUrl = await driver.getCurrentUrl();

        console.log('Inicio flujo:', currentUrl);

        // =====================================================
        // SUPONEMOS PASOS 1 → 8 YA EJECUTADOS
        // (reutilizas tu suite anterior)
        // =====================================================

        while (!currentUrl.includes('/paso/9') && currentUrl.includes('/paso/')) {

            await driver.sleep(1000);
            currentUrl = await driver.getCurrentUrl();

            const btnNext = await driver.findElements(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            );

            if (btnNext.length > 0) {
                await btnNext[0].click();
                await driver.sleep(3000);
            }
        }

        // =====================================================
        // PASO 9
        // =====================================================
        if (!currentUrl.includes('/paso/9')) {

            console.log('No llegó al Paso 9');
            console.log('URL actual:', currentUrl);
            return;
        }

        console.log('Paso 9 detectado');

        // =====================================================
        // CAMPOS ETIQUETADO
        // =====================================================

        await driver.findElement(By.id('numero_lote_etq'))
            .sendKeys('FT-2026-0043');

        await driver.findElement(By.id('nombre_producto_etq'))
            .sendKeys('Metformina 850 mg');

        const fechaFab = new Date().toISOString().split('T')[0];
        const fechaVenc = new Date(Date.now() + 365*24*60*60*1000)
            .toISOString().split('T')[0];

        await driver.findElement(By.id('fecha_fab'))
            .sendKeys(fechaFab);

        await driver.findElement(By.id('fecha_venc'))
            .sendKeys(fechaVenc);

        await driver.findElement(By.id('unidades_etiquetadas'))
            .sendKeys('4950');

        await driver.findElement(By.id('registro_sanitario'))
            .sendKeys('INVIMA 2026-XYZ-001');

        // CHECKS
        await driver.findElement(By.css('input[name="chk_numero_lote"]')).click();
        await driver.findElement(By.css('input[name="chk_fecha_venc"]')).click();
        await driver.findElement(By.css('input[name="chk_concentracion"]')).click();
        await driver.findElement(By.css('input[name="chk_fecha_fab"]')).click();
        await driver.findElement(By.css('input[name="chk_nombre"]')).click();
        await driver.findElement(By.css('input[name="chk_registro"]')).click();

        // OBSERVACIONES
        await driver.executeScript(
            "document.getElementById('observaciones').value='Etiquetado completo sin inconsistencias.';"
        );

        console.log('Paso 9 completado');

        // =====================================================
        // BOTÓN DE LIBERACIÓN (CON CONFIRM)
        // =====================================================

        const btn = await driver.findElement(
            By.xpath("//button[contains(text(),'Notificar al DT')]")
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", btn);
        await driver.sleep(1000);

        await btn.click();

        // =====================================================
        // MANEJO DEL CONFIRM DIALOG
        // =====================================================
        try {
            await driver.wait(until.alertIsPresent(), 3000);
            const alert = await driver.switchTo().alert();
            await alert.accept();
            console.log('Liberación confirmada');
        } catch (e) {
            console.log('No apareció confirm, continuando...');
        }

        await driver.sleep(5000);

        // =====================================================
        // VALIDACIÓN FINAL
        // =====================================================

        const finalUrl = await driver.getCurrentUrl();

        if (finalUrl.includes('/panel') || finalUrl.includes('/lotes')) {

            console.log('LOTE LIBERADO EXITOSAMENTE (FLUJO COMPLETO)');

        } else {

            console.log('Posible error en liberación');
            console.log('URL final:', finalUrl);
        }

        await driver.sleep(10000);

    } catch (error) {

        console.error('Error en Paso 9 / Liberación:', error);

    } finally {

        await driver.quit();
    }
}

pruebaPaso9Liberacion();