const { Builder, By } = require('selenium-webdriver');

async function pruebaOperarioReportarNC() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // 1. LOGIN OPERARIO
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('sergio.velandia@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(3000);

        // 2. VALIDAR BIENVENIDA OPERARIO
        const urlBienvenida = await driver.getCurrentUrl();

        if (!urlBienvenida.includes('/bienvenida')) {
            console.log('Fallo: no llegó a bienvenida');
            return;
        }

        console.log('Bienvenida de operario cargada');

        // 3. IR A MIS LOTES
        const misLotesBtn = await driver.findElement(
            By.css('a[href="/mis-lotes"]')
        );

        await misLotesBtn.click();

        await driver.sleep(3000);

        const urlMisLotes = await driver.getCurrentUrl();

        if (!urlMisLotes.includes('/mis-lotes')) {
            console.log('Fallo: no llegó a Mis Lotes');
            return;
        }

        console.log('Panel de operario cargado');

        // 4. IR A REPORTAR NO CONFORMIDAD
        const ncBtn = await driver.findElement(
            By.css('a[href="/noconformidad/nueva"]')
        );

        await ncBtn.click();

        await driver.sleep(3000);

        // 5. VALIDACIÓN FINAL
        const urlNC = await driver.getCurrentUrl();

        if (urlNC.includes('/noconformidad/nueva')) {

            console.log('Acceso a Reportar No Conformidad exitoso');

            // Mantener abierto para revisión visual
            await driver.sleep(10000);

        } else {

            console.log('Fallo al entrar a Reportar No Conformidad');
        }

    } catch (error) {

        console.error('Error en prueba operario NC:', error);

    } finally {

        await driver.quit();
    }
}

pruebaOperarioReportarNC();