const { Builder, By } = require('selenium-webdriver');

async function pruebaPaso3Dinamico() {

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

        // ENTRAR AL LOTE
        const continuarBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Continuar paso')]")
        );

        await continuarBtn.click();

        await driver.sleep(4000);

        // =====================================================
        // DETECTAR PASO ACTUAL
        // =====================================================

        let currentUrl = await driver.getCurrentUrl();

        console.log('URL actual:', currentUrl);

        // =====================================================
        // SI ESTÁ EN PASO 1
        // =====================================================

        if (currentUrl.includes('/paso/1')) {

            console.log('Completando Paso 1');

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

            await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            ).click();

            await driver.sleep(4000);

            currentUrl = await driver.getCurrentUrl();
        }

        // =====================================================
        // SI ESTÁ EN PASO 2
        // =====================================================

        if (currentUrl.includes('/paso/2')) {

            console.log('Completando Paso 2');

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

            await driver.findElement(By.id('observaciones'))
                .sendKeys(
                    'Recepción correcta de materias primas.'
                );

            await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            ).click();

            await driver.sleep(5000);

            currentUrl = await driver.getCurrentUrl();
        }

        // =====================================================
        // VALIDAR PASO 3
        // =====================================================

        if (!currentUrl.includes('/paso/3')) {

            console.log('No llegó al Paso 3');
            console.log('URL actual:', currentUrl);
            return;
        }

        console.log('Paso 3 detectado');

        // =====================================================
        // LLENAR PESOS
        // =====================================================

        await driver.findElement(
            By.css('input[name="peso_0"]')
        ).sendKeys('8500');

        await driver.findElement(
            By.css('input[name="peso_1"]')
        ).sendKeys('1500');

        await driver.findElement(
            By.css('input[name="peso_2"]')
        ).sendKeys('200');

        await driver.findElement(
            By.css('input[name="peso_3"]')
        ).sendKeys('30');

        await driver.findElement(
            By.css('input[name="peso_4"]')
        ).sendKeys('25');

        console.log('Pesos registrados');

        // =====================================================
        // CHECKLIST
        // =====================================================

        await driver.findElement(
            By.css('input[name="chk_balanza"]')
        ).click();

        await driver.findElement(
            By.css('input[name="chk_bpm"]')
        ).click();

        await driver.findElement(
            By.css('input[name="chk_pesos_reg"]')
        ).click();

        await driver.findElement(
            By.css('input[name="chk_area_limpia"]')
        ).click();

        console.log('Checklist BPM completado');

        // =====================================================
        // OBSERVACIONES
        // =====================================================

        await driver.findElement(By.id('observaciones'))
            .sendKeys(
                'Pesajes verificados y registrados correctamente.'
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

        console.log('Paso 3 enviado');

        await driver.sleep(5000);

        // =====================================================
        // VALIDACIÓN FINAL
        // =====================================================

        const finalUrl = await driver.getCurrentUrl();

        if (finalUrl.includes('/paso/4')) {

            console.log('Avance al Paso 4 exitoso');

            await driver.sleep(15000);

        } else {

            console.log('Fallo al avanzar al Paso 4');
            console.log('URL final:', finalUrl);
        }

    } catch (error) {

        console.error('Error en prueba Paso 3:', error);

    } finally {

        await driver.quit();
    }
}

pruebaPaso3Dinamico();