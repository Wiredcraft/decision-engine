/**
 * Created by anandrajneesh
 */
'use strict'
const ruleEngine = require('../src/index.js')
const assert = require('assert')

describe('order system rule engine', function () {
  // fact : order from some user
  let fact

  describe('should work for simple rules like discount.json', function () {
    before(function () {
      ruleEngine.addRule(require('./orderSystem/discount.json'))
    })

    beforeEach(function () {
      delete require.cache[require.resolve('./orderSystem/order.json')]
      fact = require('./orderSystem/order.json')
    })

    after(function () {
      ruleEngine.deleteRule('10', 'discount')
    })

    it('should return 10% discount for order of length more than 2 and price gte 500', function (done) {
      fact.order.items.push({
        name: 'coffee mug',
        id: 'skuid1'
      })
      fact.order.items.push({
        name: 'nodejs book',
        id: 'skuid2'
      })
      fact.order.items.push({
        name: 'java book',
        id: 'skuid3'
      })
      fact.order.price = 600

      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('10') > -1)
          setTimeout(() => {
            done()
          }, 1800)
        }
      })
    })

    it('should return 10% discount for order of price gte 2000', function (done) {
      fact.order.price = 2000
      fact.order.items.push({
        name: 'coffee mug',
        id: 'skuid5'
      })
      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('10') > -1)
          done()
        }
      })
    })

    it('should not return any discount values for order of price lower than 500', function (done) {
      fact.order.price = 400
      fact.order.items.push({
        name: 'coffee mug',
        id: 'skuid6'
      })
      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.length === 0)
          done()
        }
      })
    })

    it('should return 10% discount for users with name starting with A', function (done) {
      fact.user.name = 'Adam'
      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('10') > -1)
          done()
        }
      })
    })
  })

  describe('should work for complex rules like expressShipping.json', function () {
    before(function () {
      ruleEngine.addRule(require('./orderSystem/expressShipping.json'))
    })

    beforeEach(function () {
      delete require.cache[require.resolve('./orderSystem/order.json')]
      fact = require('./orderSystem/order.json')
      fact.order.items.push({
        name: 'coffee mug',
        id: 'skuid1'
      })
      fact.order.items.push({
        name: 'nodejs book',
        id: 'skuid2'
      })
      fact.order.items.push({
        name: 'java book',
        id: 'skuid3'
      })
      fact.order.price = 5000
    })

    after(function () {
      ruleEngine.deleteRule('express', 'shipping')
    })

    it('should allow express shipping for prime users with express cities', function (done) {
      fact.user.subs.prime = true
      fact.user.address.express.available = true
      ruleEngine.run(fact, 'shipping', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('express') > -1)
          done()
        }
      })
    })

    it('should allow express shipping for users who opted for express and is not cash on delivery', function (done) {
      fact.user.subs.prime = false
      fact.user.address.express.available = false
      fact.order.cashOnDelivery = false
      fact.order.express = true
      ruleEngine.run(fact, 'shipping', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('express') > -1)
          done()
        }
      })
    })

    it('should not allow express shipping for non prime and non express orders', function (done) {
      fact.user.subs.prime = false
      fact.user.address.express.available = false
      fact.order.cashOnDelivery = false
      fact.order.express = false
      ruleEngine.run(fact, 'shipping', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.length === 0)
          done()
        }
      })
    })

    it('should not allow express shipping for facts which have missing data', function (done) {
      delete fact.user.subs.prime
      fact.user.address.express.available = false
      fact.order.cashOnDelivery = false
      delete fact.order.express
      ruleEngine.run(fact, 'shipping', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.length === 0)
          done()
        }
      })
    })
  })
  describe('rule manager', function () {
    after(function () {
      ruleEngine.deleteRule('10', 'discount')
    })
    it('only remove specific rule', function (done) {
      const rule1 = require('./orderSystem/discount.json')
      const rule2 = JSON.parse(JSON.stringify(rule1))
      rule2.name = '11'
      ruleEngine.addRule(rule1)
      ruleEngine.addRule(rule2)
      fact.order.price = 2000
      fact.order.items.push({
        name: 'coffee mug',
        id: 'skuid5'
      })
      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('10') > -1)
        }
      })
      ruleEngine.deleteRule(rule2.name, rule2.group)
      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.ok(result.indexOf('10') > -1)
          done()
        }
      })
    })
    it('one rule can be added only once', function (done) {
      const rule = require('./orderSystem/discount.json')
      ruleEngine.addRule(rule)
      fact.order.price = 2000
      fact.order.items.push({
        name: 'coffee mug',
        id: 'skuid5'
      })
      ruleEngine.run(fact, 'discount', function (err, result) {
        if (err) done(err)
        else {
          assert.deepEqual(result, ['10'])
          done()
        }
      })
    })

    it('should return specific group rules', function () {
      assert.ok(ruleEngine.getRules('discount').length > 0)
      assert.ok(ruleEngine.getRules('no existed').length === 0)
    })
  })
})
