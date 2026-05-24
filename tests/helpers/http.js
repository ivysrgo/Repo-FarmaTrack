/**
 * tests/helpers/http.js
 *
 * Fábricas de objetos `req` y `res` falsos para testear controllers Express
 * sin levantar el servidor.
 *
 * Idea: cada handler de controller recibe (req, res, next). Si simulamos esos
 * tres objetos con jest.fn(), podemos verificar:
 *   - Qué vista se renderizó:  expect(res.render).toHaveBeenCalledWith(...)
 *   - A dónde redirigió:       expect(res.redirect).toHaveBeenCalledWith('/panel')
 *   - Qué flash se emitió:     expect(req.flash).toHaveBeenCalledWith('ok', '...')
 *   - Qué error pasó a next:   expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }))
 *
 * Sin esto, cada test tendría que reescribir 20 líneas de boilerplate.
 */
'use strict';

function mockReq(overrides = {}) {
  return {
    body:    {},
    params:  {},
    query:   {},
    session: {
      regenerate: (cb) => cb(),
      destroy:    (cb) => cb(),
    },
    flash:   jest.fn(() => []), // devuelve [] por defecto cuando se lee
    ...overrides,
  };
}

function mockRes(overrides = {}) {
  const res = {
    locals: {},
    statusCode: 200,
  };
  res.status   = jest.fn(function (code) { res.statusCode = code; return res; });
  res.render   = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.json     = jest.fn().mockReturnValue(res);
  res.send     = jest.fn().mockReturnValue(res);
  Object.assign(res, overrides);
  return res;
}

const mockNext = () => jest.fn();

module.exports = { mockReq, mockRes, mockNext };
