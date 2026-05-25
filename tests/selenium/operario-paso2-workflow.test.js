const { Builder, By } = require('selenium-webdriver');

async function pruebaPaso2Dinamico() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // LOGIN
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

        // ABRIR LOTE
        const continuarBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Continuar paso')]")
        );

        await continuarBtn.click();

        await driver.sleep(4000);

        // DETECTAR PASO ACTUAL
        const currentUrl = await driver.getCurrentUrl();

        console.log('URL actual:', currentUrl);

        // =====================================================
        // SI ESTÁ EN PASO 1
        // =====================================================

        if (currentUrl.includes('/paso/1')) {

            console.log('Paso 1 detectado');

            await driver.findElement(
                By.css('input[name="chk_orden_recibida"]')
            ).click();

            await driver.findElement(
                By.css('input[name="chk_responsable"]')
            ).click();

            await driver.findElement(
                By.css('input[name="chk_datos_coinciden"]')
            ).click();

            await driver.findElement(
                By.css('input[name="chk_observaciones"]')
            ).click();

            const guardarPaso1 = await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            );

            await guardarPaso1.click();

            console.log('Paso 1 completado');

            await driver.sleep(5000);
        }

        // =====================================================
        // VALIDAR QUE YA ESTÁ EN PASO 2
        // =====================================================

        const paso2Url = await driver.getCurrentUrl();

        if (!paso2Url.includes('/paso/2')) {
            console.log('No llegó al Paso 2');
            console.log('URL actual:', paso2Url);
            return;
        }

        console.log('Paso 2 detectado');

        // =====================================================
        // LLENAR MATERIAS PRIMAS
        // =====================================================

        await driver.findElement(
            By.css('input[name="mp_0_recibida"]')
        ).sendKeys('8500');

        await driver.findElement(
            By.css('input[name="mp_1_recibida"]')
        ).sendKeys('1500');

        await driver.findElement(
            By.css('input[name="mp_2_recibida"]')
        ).sendKeys('200');

        await driver.findElement(
            By.css('input[name="mp_3_recibida"]')
        ).sendKeys('30');

        await driver.findElement(
            By.css('input[name="mp_4_recibida"]')
        ).sendKeys('25');

        console.log('Cantidades ingresadas');

        // =====================================================
        // ESTADOS
        // =====================================================

        await driver.findElement(
            By.css('select[name="mp_0_estado"]')
        ).sendKeys('Conforme');

        await driver.findElement(
            By.css('select[name="mp_1_estado"]')
        ).sendKeys('Conforme');

        await driver.findElement(
            By.css('select[name="mp_2_estado"]')
        ).sendKeys('Conforme');

        await driver.findElement(
            By.css('select[name="mp_3_estado"]')
        ).sendKeys('Conforme');

        await driver.findElement(
            By.css('select[name="mp_4_estado"]')
        ).sendKeys('Conforme');

        console.log('Estados diligenciados');

        // =====================================================
        // CHECKLIST
        // =====================================================

        await driver.findElement(
            By.css('input[name="chk_mp_laboratorio"]')
        ).click();

        await driver.findElement(
            By.css('input[name="chk_embalajes"]')
        ).click();

        await driver.findElement(
            By.css('input[name="chk_transporte"]')
        ).click();

        await driver.findElement(
            By.css('input[name="chk_temperatura"]')
        ).click();

        console.log('Checklist completado');

        // =====================================================
        // OBSERVACIONES
        // =====================================================

        await driver.findElement(By.id('observaciones'))
            .sendKeys(
                'Materias primas recibidas en condiciones conformes y embalajes íntegros.'
            );

        console.log('Observaciones registradas');

        // =====================================================
        // GUARDAR Y CONTINUAR
        // =====================================================

        const guardarBtn = await driver.findElement(
            By.xpath("//button[contains(text(),'Guardar y continuar')]")
        );

        await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            guardarBtn
        );

        await driver.sleep(1000);

        await guardarBtn.click();

        console.log('Paso 2 enviado');

        await driver.sleep(5000);

        // =====================================================
        // VALIDACIÓN FINAL
        // =====================================================

        const finalUrl = await driver.getCurrentUrl();

        if (finalUrl.includes('/paso/3')) {

            console.log('Avance al Paso 3 exitoso');

            await driver.sleep(15000);

        } else {

            console.log('Fallo al avanzar al Paso 3');
            console.log('URL final:', finalUrl);
        }

    } catch (error) {

        console.error('Error en prueba dinámica Paso 2:', error);

    } finally {

        await driver.quit();
    }
}

pruebaPaso2Dinamico();