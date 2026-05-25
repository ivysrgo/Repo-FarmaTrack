const { Builder, By } = require('selenium-webdriver');

async function pruebaLogin() {

    let driver;

    try {

        // Abrir Chrome
        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // Entrar al login
        await driver.get('http://localhost:3000/auth/login');

        // Esperar un poco para visualizar
        await driver.sleep(2000);

        // Buscar campos
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));
        const loginButton = await driver.findElement(By.id('submitLoginBtn'));

        // Escribir credenciales
        await emailInput.sendKeys('juan.bahos@farmatrack.co');
        await passwordInput.sendKeys('1234');

        // Esperar para ver escritura
        await driver.sleep(1000);

        // Click login
        await loginButton.click();

        // Esperar carga
        await driver.sleep(5000);

        // Mostrar URL actual
        const currentUrl = await driver.getCurrentUrl();

        console.log('URL actual:', currentUrl);

        // Validación básica
        if (currentUrl !== 'http://localhost:3000/auth/login') {

            console.log('✅ LOGIN EXITOSO');

        } else {

            console.log('❌ LOGIN FALLIDO');
        }

    } catch (error) {

        console.error('ERROR EN LA PRUEBA:', error);

    } finally {

        // Cerrar navegador
        if (driver) {
            await driver.quit();
        }
    }
}

pruebaLogin();