/* global describe, it, before */

var expect = require('chai').expect
var mockService = require('../')
var popsicle = require('popsicle')
var server = require('popsicle-server')
var finalhandler = require('finalhandler')
var httpes = require('http')
var path = require('path')

describe('osprey mock service v0.8', function () {
  var http

  before(function () {
    this.timeout(3000)
    return mockService.loadFile(path.join(__dirname, '/fixtures/example08.raml'), { server: { cors: true, compression: true } })
      .then(function (raml) {
        http = httpes.createServer(function (req, res) {
          return raml(req, res, finalhandler(req, res))
        })
      })
  })

  describe('routes', function () {
    it('should expose a function', function () {
      expect(mockService).to.be.a('function')
    })

    it('should respond with example parameter', function () {
      return popsicle.default('/api/test')
        .use(server(http))
        .then(function (res) {
          expect(JSON.parse(res.body)).to.deep.equal({ success: true })
          expect(res.status).to.equal(200)
        })
    })

    it('should reject undefined route', function () {
      return popsicle.default('/api/unknown')
        .use(server(http))
        .then(function (res) {
          expect(res.status).to.equal(404)
        })
    })

    it('should have empty body when there are no example property', function () {
      return popsicle.default('/api/noexample')
        .use(server(http))
        .then(function (res) {
          expect(res.status).to.equal(200)
          expect(res.body).to.equal('')
        })
    })

    it('should respect mediaTypeExtensions (application/json)', function () {
      return popsicle.default(
        {
          method: 'GET',
          url: '/api/mediatypeextension.json'
        }
      )
        .use(server(http))
        .then(function (res) {
          expect(JSON.parse(res.body)).to.deep.equal({ foo: 'bar' })
        })
    })

    it('should respect mediaTypeExtensions (application/xml)', function () {
      return popsicle.default(
        {
          method: 'GET',
          url: '/api/mediatypeextension.xml'
        }
      )
        .use(server(http))
        .then(function (res) {
          expect(res.body).to.contain('<resource>', '<stringProperty>', '<numberProperty>')
        })
    })
  })
})
