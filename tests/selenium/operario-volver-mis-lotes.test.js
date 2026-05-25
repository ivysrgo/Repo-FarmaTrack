const { Builder, By } = require('selenium-webdriver');

async function pruebaOperarioVolverMisLotes() {

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

        // VALIDAR INGRESO AL LOTE
        const loteUrl = await driver.getCurrentUrl();

        if (!loteUrl.includes('/paso/1')) {
            console.log('No llegó al lote');
            return;
        }

        console.log('Pantalla del lote cargada');

        // CLICK EN VOLVER A MIS LOTES
        const volverBtn = await driver.findElement(
            By.xpath("//a[contains(text(),'Volver a mis lotes')]")
        );

        await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            volverBtn
        );

        await driver.sleep(1000);

        await volverBtn.click();

        await driver.sleep(3000);

        // VALIDACIÓN FINAL
        const finalUrl = await driver.getCurrentUrl();

        if (finalUrl.includes('/mis-lotes')) {

            console.log('Retorno a Mis Lotes exitoso');

            // Mantener abierto para revisión visual
            await driver.sleep(10000);

        } else {

            console.log('Fallo al volver a Mis Lotes');
        }

    } catch (error) {

        console.error('Error en prueba volver Mis Lotes:', error);

    } finally {

        await driver.quit();
    }
}

pruebaOperarioVolverMisLotes();