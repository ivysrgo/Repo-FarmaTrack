/**
 * tests/controllers/AuthController.test.js (async)
 */
'use strict';

const { mockReq, mockRes } = require('../helpers/http');
const auth = require('../../src/controllers/AuthController');

const VALID_DT = { email: 'juan.bahos@farmatrack.co', password: '1234' };
const VALID_OP = { email: 'sergio.velandia@farmatrack.co', password: '1234' };

describe('AuthController (async)', () => {
  describe('showLogin', () => {
    it('renderiza la vista si no hay sesion', () => {
      const req = mockReq();
      const res = mockRes();
      auth.showLogin(req, res);
      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({ layout: 'layouts/auth' }));
    });
    it('redirige a /bienvenida si ya hay usuario en sesion', () => {
      const req = mockReq({ session: { usuario: { id: 'u-001' } } });
      const res = mockRes();
      auth.showLogin(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/bienvenida');
      expect(res.render).not.toHaveBeenCalled();
    });
    it('pasa flash messages a la vista', () => {
      const req = mockReq();
      req.flash.mockImplementation(k => k === 'error' ? ['err'] : k === 'email' ? ['x@x.co'] : []);
      const res = mockRes();
      auth.showLogin(req, res);
      const args = res.render.mock.calls[0][1];
      expect(args.error).toEqual(['err']);
      expect(args.email).toEqual(['x@x.co']);
    });
  });

  describe('login - credenciales validas', () => {
    it('regenera sesion y redirige a /bienvenida (DT)', async () => {
      const req = mockReq({ body: VALID_DT });
      const res = mockRes();
      await auth.login(req, res);
      expect(req.session.usuario).toBeDefined();
      expect(req.session.usuario.email).toBe(VALID_DT.email);
      expect(req.session.usuario.rol).toBe('director_tecnico');
      expect(res.redirect).toHaveBeenCalledWith('/bienvenida');
    });
    it('NO guarda password en sesion', async () => {
      const req = mockReq({ body: VALID_DT });
      const res = mockRes();
      await auth.login(req, res);
      expect(req.session.usuario).not.toHaveProperty('password');
    });
    it('login operario guarda rol correcto', async () => {
      const req = mockReq({ body: VALID_OP });
      const res = mockRes();
      await auth.login(req, res);
      expect(req.session.usuario.rol).toBe('operario');
    });
    it('email case-insensitive', async () => {
      const req = mockReq({ body: { email: 'JUAN.BAHOS@FARMATRACK.CO', password: '1234' } });
      const res = mockRes();
      await auth.login(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/bienvenida');
    });
  });

  describe('login - credenciales invalidas', () => {
    it('correo inexistente -> flash error y redirect a /auth/login', async () => {
      const req = mockReq({ body: { email: 'fantasma@x.co', password: '1234' } });
      const res = mockRes();
      await auth.login(req, res);
      expect(req.flash).toHaveBeenCalledWith('error', expect.stringMatching(/incorrect/i));
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
      expect(req.session.usuario).toBeUndefined();
    });
    it('password incorrecta -> rechazo', async () => {
      const req = mockReq({ body: { email: VALID_DT.email, password: 'mal' } });
      const res = mockRes();
      await auth.login(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });
    it('body vacio no revienta', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await expect(auth.login(req, res)).resolves.not.toThrow();
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });
    it('no revela email-vs-password (mismo mensaje)', async () => {
      const r1 = mockReq({ body: { email: 'fantasma@x.co', password: 'x' } });
      const r2 = mockReq({ body: { email: VALID_DT.email, password: 'mal' } });
      await auth.login(r1, mockRes());
      await auth.login(r2, mockRes());
      const msg1 = r1.flash.mock.calls.find(c => c[0] === 'error')[1];
      const msg2 = r2.flash.mock.calls.find(c => c[0] === 'error')[1];
      expect(msg1).toBe(msg2);
    });
  });

  describe('signup', () => {
    it('body vacío → error de validación y redirige a /auth/login?tab=signup', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await auth.signup(req, res);
      expect(req.flash).toHaveBeenCalledWith('signupError', expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith('/auth/login?tab=signup');
    });
  });

  describe('logout', () => {
    it('destruye sesion y redirige', () => {
      const destroySpy = jest.fn(cb => cb());
      const req = mockReq({ session: { destroy: destroySpy } });
      const res = mockRes();
      auth.logout(req, res);
      expect(destroySpy).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });
  });
});
