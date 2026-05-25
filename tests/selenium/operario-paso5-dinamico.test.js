const { Builder, By } = require('selenium-webdriver');

async function pruebaPaso5Dinamico() {

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

        // =====================================================
        // BIENVENIDA
        // =====================================================
        let url = await driver.getCurrentUrl();

        if (!url.includes('/bienvenida')) {
            console.log('No llegó a bienvenida');
            return;
        }

        // =====================================================
        // MIS LOTES
        // =====================================================
        await driver.findElement(By.css('a[href="/mis-lotes"]')).click();
        await driver.sleep(3000);

        // ENTRAR LOTE
        await driver.findElement(By.xpath("//a[contains(text(),'Continuar paso')]")).click();
        await driver.sleep(4000);

        let currentUrl = await driver.getCurrentUrl();

        console.log('Inicio workflow:', currentUrl);

        // =====================================================
        // PASO 1 (si aplica)
        // =====================================================
        if (currentUrl.includes('/paso/1')) {

            await driver.findElement(By.css('input[name="chk_orden_recibida"]')).click();
            await driver.findElement(By.css('input[name="chk_responsable"]')).click();
            await driver.findElement(By.css('input[name="chk_datos_coinciden"]')).click();
            await driver.findElement(By.css('input[name="chk_observaciones"]')).click();

            await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            ).click();

            await driver.sleep(3000);

            currentUrl = await driver.getCurrentUrl();
        }

        // =====================================================
        // PASO 2
        // =====================================================
        if (currentUrl.includes('/paso/2')) {

            await driver.findElement(By.css('input[name="mp_0_recibida"]')).sendKeys('8500');
            await driver.findElement(By.css('input[name="mp_1_recibida"]')).sendKeys('1500');
            await driver.findElement(By.css('input[name="mp_2_recibida"]')).sendKeys('200');
            await driver.findElement(By.css('input[name="mp_3_recibida"]')).sendKeys('30');
            await driver.findElement(By.css('input[name="mp_4_recibida"]')).sendKeys('25');

            await driver.findElement(By.css('input[name="chk_mp_laboratorio"]')).click();
            await driver.findElement(By.css('input[name="chk_embalajes"]')).click();
            await driver.findElement(By.css('input[name="chk_transporte"]')).click();
            await driver.findElement(By.css('input[name="chk_temperatura"]')).click();

            await driver.findElement(By.id('observaciones'))
                .sendKeys('Recepción conforme.');

            await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            ).click();

            await driver.sleep(3000);

            currentUrl = await driver.getCurrentUrl();
        }

        // =====================================================
        // PASO 3
        // =====================================================
        if (currentUrl.includes('/paso/3')) {

            await driver.findElement(By.css('input[name="peso_0"]')).sendKeys('8500');
            await driver.findElement(By.css('input[name="peso_1"]')).sendKeys('1500');
            await driver.findElement(By.css('input[name="peso_2"]')).sendKeys('200');
            await driver.findElement(By.css('input[name="peso_3"]')).sendKeys('30');
            await driver.findElement(By.css('input[name="peso_4"]')).sendKeys('25');

            await driver.findElement(By.css('input[name="chk_balanza"]')).click();
            await driver.findElement(By.css('input[name="chk_bpm"]')).click();
            await driver.findElement(By.css('input[name="chk_pesos_reg"]')).click();
            await driver.findElement(By.css('input[name="chk_area_limpia"]')).click();

            await driver.findElement(By.id('observaciones'))
                .sendKeys('Pesajes correctos.');

            await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            ).click();

            await driver.sleep(3000);

            currentUrl = await driver.getCurrentUrl();
        }

        // =====================================================
        // PASO 4
        // =====================================================
        if (currentUrl.includes('/paso/4')) {

            await driver.findElement(By.id('temp_mezcla')).sendKeys('24');
            await driver.findElement(By.id('vel_baja')).sendKeys('20');
            await driver.findElement(By.id('vel_media')).sendKeys('50');

            const hora = new Date().toTimeString().slice(0,5);
            await driver.findElement(By.id('hora_inicio')).sendKeys(hora);

            await driver.findElement(By.id('temp_amasado')).sendKeys('27');
            await driver.findElement(By.id('homogeneidad')).sendKeys('Confirmada');

            await driver.findElement(By.css('input[name="chk_mezclador"]')).click();
            await driver.findElement(By.css('input[name="chk_pasos_seguidos"]')).click();
            await driver.findElement(By.css('input[name="chk_temp_ok"]')).click();
            await driver.findElement(By.css('input[name="chk_homogeneidad"]')).click();

            await driver.findElement(By.id('observaciones'))
                .sendKeys('Mezcla dentro de parámetros.');

            await driver.findElement(
                By.xpath("//button[contains(text(),'Guardar y continuar')]")
            ).click();

            await driver.sleep(3000);

            currentUrl = await driver.getCurrentUrl();
        }

        // =====================================================
        // PASO 5
        // =====================================================
        if (!currentUrl.includes('/paso/5')) {

            console.log('No llegó al Paso 5');
            console.log('URL actual:', currentUrl);
            return;
        }

        console.log('Paso 5 detectado');

        // =====================================================
        // CONTROLES
        // =====================================================
        await driver.findElement(By.css('input[name="control_0_valor"]')).sendKeys('12.5');
        await driver.findElement(By.css('input[name="control_1_valor"]')).sendKeys('13.1');
        await driver.findElement(By.css('input[name="control_2_valor"]')).sendKeys('12.9');
        await driver.findElement(By.css('input[name="control_3_valor"]')).sendKeys('13.0');

        // =====================================================
        // CHECKLIST
        // =====================================================
        await driver.findElement(By.css('input[name="chk_controles"]')).click();
        await driver.findElement(By.css('input[name="chk_dentro_espec"]')).click();
        await driver.findElement(By.css('input[name="chk_lab"]')).click();
        await driver.findElement(By.css('input[name="chk_desviaciones"]')).click();

        // =====================================================
        // OBSERVACIONES (robusto contra HTML roto)
        // =====================================================
        const obs = await driver.findElement(By.id('observaciones'));
        await driver.executeScript("arguments[0].value = 'Controles en rango y dentro de especificación.';", obs);

        console.log('Formulario Paso 5 completado');

        // =====================================================
        // GUARDAR
        // =====================================================
        const btn = await driver.findElement(
            By.xpath("//button[contains(text(),'Guardar y continuar')]")
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", btn);
        await driver.sleep(1000);

        await btn.click();

        await driver.sleep(5000);

        // =====================================================
        // VALIDACIÓN FINAL
        // =====================================================
        const finalUrl = await driver.getCurrentUrl();

        if (finalUrl.includes('/paso/6')) {
            console.log('Paso 5 completado correctamente');
        } else {
            console.log('Error avanzando desde Paso 5');
            console.log('URL final:', finalUrl);
        }

        await driver.sleep(10000);

    } catch (error) {
        console.error('Error en Paso 5:', error);
    } finally {
        await driver.quit();
    }
}

pruebaPaso5Dinamico();