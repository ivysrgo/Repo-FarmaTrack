const { Builder, By } = require('selenium-webdriver');

async function pruebaGuardarContinuarPaso1() {

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

        console.log('Bienvenida operario cargada');

        // IR A MIS LOTES
        await driver.findElement(
            By.css('a[href="/mis-lotes"]')
        ).click();

        await driver.sleep(3000);

        // VALIDAR DASHBOARD
        const misLotesUrl = await driver.getCurrentUrl();

        if (!misLotesUrl.includes('/mis-lotes')) {
            console.log('No llegó a Mis Lotes');
            return;
        }

        console.log('Dashboard operario cargado');

        // ENTRAR AL LOTE
        const continuarBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Continuar paso')]")
        );

        await continuarBtn.click();

        await driver.sleep(4000);

        // VALIDAR PASO 1
        const paso1Url = await driver.getCurrentUrl();

        if (!paso1Url.includes('/paso/1')) {
            console.log('No llegó al Paso 1');
            return;
        }

        console.log('Paso 1 cargado');

        // CHECKBOX 1
        await driver.findElement(
            By.css('input[name="chk_orden_recibida"]')
        ).click();

        // CHECKBOX 2
        await driver.findElement(
            By.css('input[name="chk_responsable"]')
        ).click();

        // CHECKBOX 3
        await driver.findElement(
            By.css('input[name="chk_datos_coinciden"]')
        ).click();

        // CHECKBOX 4
        await driver.findElement(
            By.css('input[name="chk_observaciones"]')
        ).click();

        console.log('Checklist completado');

        await driver.sleep(1000);

        // BOTÓN GUARDAR Y CONTINUAR
        const guardarBtn = await driver.findElement(
            By.xpath("//button[contains(text(),'Guardar y continuar')]")
        );

        await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            guardarBtn
        );

        await driver.sleep(1000);

        await guardarBtn.click();

        console.log('Formulario enviado');

        await driver.sleep(5000);

        // VALIDACIÓN FINAL
        const finalUrl = await driver.getCurrentUrl();

        if (
            finalUrl.includes('/paso/2')
        ) {

            console.log('Avance al Paso 2 exitoso');

            // Mantener abierto para revisión visual
            await driver.sleep(10000);

        } else {

            console.log('Fallo al avanzar al Paso 2');
            console.log('URL actual:', finalUrl);
        }

    } catch (error) {

        console.error('Error en prueba Guardar y Continuar:', error);

    } finally {

        await driver.quit();
    }
}

pruebaGuardarContinuarPaso1();