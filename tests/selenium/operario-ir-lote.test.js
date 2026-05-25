const { Builder, By } = require('selenium-webdriver');

async function pruebaOperarioIrALote() {

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

        // VALIDAR DASHBOARD OPERARIO
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

        await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            continuarBtn
        );

        await driver.sleep(1000);

        await continuarBtn.click();

        await driver.sleep(4000);

        // VALIDACIÓN FINAL
        const loteUrl = await driver.getCurrentUrl();

        if (
            loteUrl.includes('/mis-lotes/') &&
            loteUrl.includes('/paso/1')
        ) {

            console.log('Ingreso al lote exitoso');

            // Mantener abierto para revisión visual
            await driver.sleep(10000);

        } else {

            console.log('Fallo al entrar al lote');
        }

    } catch (error) {

        console.error('Error en prueba ingreso lote operario:', error);

    } finally {

        await driver.quit();
    }
}

pruebaOperarioIrALote();