const { Builder, By } = require('selenium-webdriver');

async function pruebaPaso8Dinamico() {

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

        // BIENVENIDA
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
        // PASO 1 → 7 (RESUMIDO IGUAL QUE ANTERIORES)
        // =====================================================
        // Para no repetir 300+ líneas, asumimos que ya tienes
        // la lógica completa de pasos anteriores funcionando.
        //
        // IMPORTANTE:
        // este test depende del flujo previo ya probado.
        // =====================================================

        // Simulación de avance hasta paso 7
        // (en tu suite real reutilizas el script anterior)

        while (!currentUrl.includes('/paso/8') && currentUrl.includes('/paso/')) {

            await driver.sleep(1000);
            currentUrl = await driver.getCurrentUrl();

            if (currentUrl.includes('/paso/7')) {

                console.log('En paso 7, avanzando...');

                await driver.findElement(By.xpath("//button[contains(text(),'Guardar y continuar')]"))
                    .click();

                await driver.sleep(3000);
            }
        }

        // =====================================================
        // VALIDACIÓN PASO 8
        // =====================================================
        if (!currentUrl.includes('/paso/8')) {

            console.log('No llegó al Paso 8');
            console.log('URL actual:', currentUrl);
            return;
        }

        console.log('Paso 8 detectado');

        // =====================================================
        // CAMPOS PASO 8
        // =====================================================

        const horaIngreso = new Date().toTimeString().slice(0, 5);
        await driver.findElement(By.id('hora_ingreso')).sendKeys(horaIngreso);

        await driver.findElement(By.id('codigo_area'))
            .sendKeys('AREA-S01');

        await driver.findElement(By.id('temp_area'))
            .sendKeys('22');

        await driver.findElement(By.id('humedad_area'))
            .sendKeys('50');

        await driver.findElement(By.id('condicion_area'))
            .sendKeys('Habilitada — Todo conforme');

        // CHECKS BPM
        await driver.findElement(By.css('input[name="chk_hora_ingreso"]')).click();
        await driver.findElement(By.css('input[name="chk_temp_bpm"]')).click();
        await driver.findElement(By.css('input[name="chk_hum_bpm"]')).click();
        await driver.findElement(By.css('input[name="chk_area_habilitada"]')).click();

        // OBSERVACIONES (robusto)
        await driver.executeScript(
            "document.getElementById('observaciones').value='Condiciones ambientales dentro de rango BPM.';"
        );

        console.log('Paso 8 completado');

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

        if (finalUrl.includes('/paso/9') || finalUrl.includes('/final')) {

            console.log('Paso 8 completado correctamente');

        } else {

            console.log('Error avanzando desde Paso 8');
            console.log('URL final:', finalUrl);
        }

        await driver.sleep(10000);

    } catch (error) {

        console.error('Error en Paso 8:', error);

    } finally {

        await driver.quit();
    }
}

pruebaPaso8Dinamico();