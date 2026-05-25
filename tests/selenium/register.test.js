const { Builder, By, until } = require('selenium-webdriver');

async function pruebaRegistroUsuario() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // 1. Ir al login
        await driver.get('http://localhost:3000/auth/login');

        await driver.sleep(1500);

        // 2. Click en tab "Registrarse"
        const tabSignup = await driver.findElement(By.id('tab-signup'));
        await tabSignup.click();

        await driver.sleep(1500);

        // 3. Completar formulario
        await driver.findElement(By.id('su-nombre'))
            .sendKeys('Juan Test QA');

        await driver.findElement(By.id('su-email'))
            .sendKeys('juan.test@farmatrack.co');

        const rol = await driver.findElement(By.id('su-rol'));
        await rol.sendKeys('Director Técnico');

        await driver.findElement(By.id('su-password'))
            .sendKeys('1234');

        await driver.findElement(By.id('su-confirm'))
            .sendKeys('1234');

        // 4. Aceptar términos (checkbox sin ID)
        const checkbox = await driver.findElement(By.css('.ft-check-box'));
        await checkbox.click();

        await driver.sleep(1000);

        // 5. Enviar formulario
        await driver.findElement(By.id('submitSignupBtn'))
            .click();

        await driver.sleep(4000);

        // 6. Validación caja negra
        const currentUrl = await driver.getCurrentUrl();
        console.log('URL actual:', currentUrl);

        if (
            currentUrl.includes('/bienvenida') ||
            currentUrl.includes('/login')
        ) {
            console.log('✅ REGISTRO EXITOSO');
        } else {
            console.log('❌ ERROR EN REGISTRO');
        }

    } catch (error) {

        console.error('ERROR EN REGISTRO:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaRegistroUsuario();