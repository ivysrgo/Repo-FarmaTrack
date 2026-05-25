const { Builder, By } = require('selenium-webdriver');

async function pruebaCancelarNC() {

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

        // VALIDAR PANEL OPERARIO
        const misLotesUrl = await driver.getCurrentUrl();

        if (!misLotesUrl.includes('/mis-lotes')) {
            console.log('No llegó a Mis Lotes');
            return;
        }

        console.log('Panel operario cargado');

        // IR A REPORTAR NC
        await driver.findElement(
            By.css('a[href="/noconformidad/nueva"]')
        ).click();

        await driver.sleep(3000);

        // VALIDAR FORMULARIO NC
        const ncUrl = await driver.getCurrentUrl();

        if (!ncUrl.includes('/noconformidad/nueva')) {
            console.log('No llegó al formulario NC');
            return;
        }

        console.log('Formulario NC abierto');

        // CLICK EN CANCELAR
        const cancelarBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Cancelar')]")
        );

        await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            cancelarBtn
        );

        await driver.sleep(1000);

        await cancelarBtn.click();

        await driver.sleep(3000);

        // VALIDACIÓN FINAL
        const finalUrl = await driver.getCurrentUrl();

        if (finalUrl.includes('/mis-lotes')) {

            console.log('Cancelación de NC exitosa');

            // Mantener abierto para revisión
            await driver.sleep(10000);

        } else {

            console.log('Fallo al cancelar la NC');
        }

    } catch (error) {

        console.error('Error en prueba cancelar NC:', error);

    } finally {

        await driver.quit();
    }
}

pruebaCancelarNC();