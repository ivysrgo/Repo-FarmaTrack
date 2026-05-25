const { Builder, By, until } = require('selenium-webdriver');

async function pruebaLogout() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // =========================
        // 1. LOGIN
        // =========================
        await driver.get('http://localhost:3000/auth/login');

        await driver.findElement(By.id('email'))
            .sendKeys('juan.bahos@farmatrack.co');

        await driver.findElement(By.id('password'))
            .sendKeys('1234');

        await driver.findElement(By.id('submitLoginBtn'))
            .click();

        await driver.sleep(3000);

        // =========================
        // 2. IR A PANEL DE LOTES
        // =========================
        await driver.findElement(By.css('a[href="/panel"]')).click();

        await driver.sleep(3000);

        const urlPanel = await driver.getCurrentUrl();
        console.log('Panel URL:', urlPanel);

        if (!urlPanel.includes('/panel')) {
            console.log('❌ No se pudo entrar al panel');
            return;
        }

        console.log('✅ Acceso al panel exitoso');

        // =========================
        // 3. CERRAR SESIÓN
        // =========================
        const logoutBtn = await driver.findElement(
            By.css('button.sidebar__logout')
        );

        await logoutBtn.click();

        await driver.sleep(3000);

        // =========================
        // 4. VALIDACIÓN CAJA NEGRA
        // =========================
        const finalUrl = await driver.getCurrentUrl();
        console.log('URL final:', finalUrl);

        if (
            finalUrl.includes('/login') ||
            finalUrl.includes('/auth/login')
        ) {
            console.log(' LOGOUT EXITOSO - SESIÓN CERRADA');
        } else {
            console.log(' ERROR: LA SESIÓN NO SE CERRÓ CORRECTAMENTE');
        }

    } catch (error) {

        console.error('ERROR EN PRUEBA LOGOUT:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaLogout();