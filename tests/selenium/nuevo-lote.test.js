const { Builder, By } = require('selenium-webdriver');

async function pruebaNuevoLoteFlujoCompleto() {

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

        // 2. BIENVENIDA
        const urlBienvenida = await driver.getCurrentUrl();
        console.log('Bienvenida:', urlBienvenida);

        if (!urlBienvenida.includes('/bienvenida')) {
            console.log('❌ No llegó a bienvenida');
            return;
        }

        console.log('✅ Llegó a bienvenida');

        // 3. IR AL PANEL
        const panelBtn = await driver.findElement(
            By.css('a[href="/panel"]')
        );

        await panelBtn.click();

        await driver.sleep(3000);

        const urlPanel = await driver.getCurrentUrl();
        console.log('Panel:', urlPanel);

        if (!urlPanel.includes('/panel')) {
            console.log('❌ No llegó al panel');
            return;
        }

        console.log('✅ Llegó al panel');

        // 4. NUEVO LOTE
        const nuevoLoteBtn = await driver.findElement(
            By.css('a[href="/lotes/nuevo"]')
        );

        await nuevoLoteBtn.click();

        await driver.sleep(3000);

        const urlLote = await driver.getCurrentUrl();
        console.log('Nuevo lote:', urlLote);

        // 5. VALIDACIÓN FINAL
        if (urlLote.includes('/lotes/nuevo')) {
            console.log('✅ FLUJO COMPLETO EXITOSO (BIENVENIDA → PANEL → NUEVO LOTE)');
        } else {
            console.log('❌ ERROR EN FLUJO DE CREACIÓN DE LOTE');
        }

    } catch (error) {

        console.error('ERROR EN FLUJO NUEVO LOTE:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaNuevoLoteFlujoCompleto();