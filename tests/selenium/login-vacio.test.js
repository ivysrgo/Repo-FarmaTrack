const { Builder, By } = require('selenium-webdriver');

async function pruebaLoginCamposVacios() {

    let driver;

    try {

        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // Ir al login
        await driver.get('http://localhost:3000/auth/login');

        await driver.sleep(1500);

        // Buscar elementos
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));
        const loginButton = await driver.findElement(By.id('submitLoginBtn'));

        // ❌ NO escribir nada (campos vacíos)

        await driver.sleep(1000);

        // Intentar login vacío
        await loginButton.click();

        await driver.sleep(2000);

        // 🔍 Validación 1: URL no debe cambiar
        const currentUrl = await driver.getCurrentUrl();
        console.log('URL actual:', currentUrl);

        // 🔍 Validación 2: detectar mensaje de error si existe
        let errorVisible = false;

        try {
            await driver.findElement(By.css('.error, .alert, .ft-error, .invalid-feedback'));
            errorVisible = true;
            console.log(' Mensaje de validación mostrado');
        } catch (e) {
            console.log(' No se mostró mensaje de validación');
        }

        // 🧪 Resultado caja negra
        if (currentUrl.includes('/auth/login') && errorVisible) {
            console.log(' CAMPOS VACÍOS BLOQUEADOS CORRECTAMENTE');
        } else {
            console.log(' FALLA: EL SISTEMA PERMITE O NO VALIDA CAMPOS VACÍOS');
        }

    } catch (error) {

        console.error('ERROR EN LA PRUEBA:', error);

    } finally {

        if (driver) {
            await driver.quit();
        }
    }
}

pruebaLoginCamposVacios();