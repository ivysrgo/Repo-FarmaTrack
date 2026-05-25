const { Builder, By, until } = require('selenium-webdriver');

async function pruebaAccesoPanelLotes() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // 1. Login
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('juan.bahos@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        // 2. Esperar bienvenida
        await driver.sleep(3000);

        const currentUrl1 = await driver.getCurrentUrl();
        console.log('Después del login:', currentUrl1);

        // 3. Validar que llegó a bienvenida
        if (!currentUrl1.includes('/bienvenida')) {
            console.log('❌ No llegó a bienvenida');
            return;
        }

        console.log('✅ Llegó a pantalla de bienvenida');

        // 4. Click en "Ir al panel de lotes"
        const panelBtn = await driver.findElement(
            By.css('a[href="/panel"]')
        );

        await panelBtn.click();

        // 5. Esperar navegación
        await driver.sleep(3000);

        const currentUrl2 = await driver.getCurrentUrl();
        console.log('Después de ir al panel:', currentUrl2);

        // 6. Validación caja negra
        if (currentUrl2.includes('/panel')) {
            console.log(' ACCESO AL PANEL DE LOTES EXITOSO');
        } else {
            console.log(' FALLA AL INGRESAR AL PANEL');
        }

    } catch (error) {

        console.error('ERROR EN PRUEBA DASHBOARD:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaAccesoPanelLotes();