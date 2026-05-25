const { Builder, By } = require('selenium-webdriver');

async function pruebaLoginFallido() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // Ir al login
        await driver.get('http://localhost:3000/auth/login');

        await driver.sleep(1500);

        // Elementos
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));
        const loginButton = await driver.findElement(By.id('submitLoginBtn'));

        // ❌ Credenciales incorrectas
        await emailInput.sendKeys('usuario.invalido@farmatrack.co');
        await passwordInput.sendKeys('claveincorrecta');

        await driver.sleep(1000);

        await loginButton.click();

        await driver.sleep(3000);

        // 🔍 Intentar detectar mensaje de error
        let mensajeError;

        try {
            mensajeError = await driver.findElement(By.css('.error, .alert, .ft-error'));
            console.log('⚠️ Mensaje de error mostrado');
        } catch (e) {
            console.log('❌ No se encontró mensaje de error visible');
        }

        const currentUrl = await driver.getCurrentUrl();
        console.log('URL actual:', currentUrl);

        // Validación caja negra
        if (currentUrl.includes('/auth/login')) {
            console.log(' LOGIN FALLIDO CORRECTAMENTE BLOQUEADO');
        } else {
            console.log(' ERROR: EL SISTEMA PERMITIÓ ACCESO');
        }

    } catch (error) {

        console.error('ERROR EN LA PRUEBA:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaLoginFallido();