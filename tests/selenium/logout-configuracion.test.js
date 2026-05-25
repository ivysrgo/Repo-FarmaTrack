const { Builder, By } = require('selenium-webdriver');

async function pruebaLogoutDesdeConfiguracion() {

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

        // 2. VALIDAR BIENVENIDA
        const urlBienvenida = await driver.getCurrentUrl();

        if (!urlBienvenida.includes('/bienvenida')) {
            console.log('Fallo: no llegó a bienvenida');
            return;
        }

        // 3. IR AL PANEL
        await driver.findElement(
            By.css('a[href="/panel"]')
        ).click();

        await driver.sleep(3000);

        const urlPanel = await driver.getCurrentUrl();

        if (!urlPanel.includes('/panel')) {
            console.log('Fallo: no llegó al panel');
            return;
        }

        // 4. IR A CONFIGURACIÓN
        await driver.findElement(
            By.css('a[href="/configuracion"]')
        ).click();

        await driver.sleep(3000);

        const urlConfiguracion = await driver.getCurrentUrl();

        if (!urlConfiguracion.includes('/configuracion')) {
            console.log('Fallo: no llegó a Configuración');
            return;
        }

        console.log('Configuración cargada');

        // 5. CERRAR SESIÓN
        const logoutBtn = await driver.findElement(
            By.css('button.reporte-card__btn')
        );

        await logoutBtn.click();

        await driver.sleep(3000);

        // 6. VALIDACIÓN FINAL
        const finalUrl = await driver.getCurrentUrl();

        if (
            finalUrl.includes('/login') ||
            finalUrl.includes('/auth/login')
        ) {
            console.log('Logout desde Configuración exitoso');
        } else {
            console.log('Fallo al cerrar sesión');
        }

    } catch (error) {

        console.error('Error en prueba logout Configuración:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaLogoutDesdeConfiguracion();