const { Builder, By } = require('selenium-webdriver');

async function pruebaBatchRecords() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // 1. LOGIN
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('juan.bahos@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(3000);

        // 2. IR A BIENVENIDA
        const urlBienvenida = await driver.getCurrentUrl();

        if (!urlBienvenida.includes('/bienvenida')) {
            console.log('Fallo: no llegó a bienvenida');
            return;
        }

        // 3. IR AL PANEL PRINCIPAL
        await driver.findElement(
            By.css('a[href="/panel"]')
        ).click();

        await driver.sleep(3000);

        const urlPanel = await driver.getCurrentUrl();

        if (!urlPanel.includes('/panel')) {
            console.log('Fallo: no llegó al panel');
            return;
        }

        console.log('Panel principal cargado');

        // 4. IR A BATCH RECORDS
        const batchBtn = await driver.findElement(
            By.css('a[href="/batch-records"]')
        );

        await batchBtn.click();

        await driver.sleep(3000);

        // 5. VALIDACIÓN FINAL
        const urlBatch = await driver.getCurrentUrl();

        if (urlBatch.includes('/batch-records')) {
            console.log('Acceso a Batch Records exitoso');
        } else {
            console.log('Fallo al entrar a Batch Records');
        }

    } catch (error) {

        console.error('Error en prueba Batch Records:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaBatchRecords();