const aws = require('aws-sdk')
const event01 = require('../events/event01.json')
const event02 = require('../events/event02.json')
const event03 = require('../events/event03.json')

describe('Test AWS Lambda: arv-auth-pre-signup', () => {

  let lambda = new aws.Lambda({
    apiVersion: '2015-03-31',
    region: 'us-east-1',
    endpoint: 'http://127.0.0.1:3001',
    sslEnabled: false
  })

  let params = {
    FunctionName: 'arv-auth-pre-signup'
  }

  test('Respuesta desde AWS: Usuario Google (fjbarrientosg@gmail.com)', (done) => {

    params.Payload = JSON.stringify(event01)

    lambda.invoke(params, function(err, data) {
      if (err) {
        console.log(err)
        expect(err.StatusCode).toBe(400)
      } else {
        let response = JSON.parse(data.Payload)

        expect(data.StatusCode).toBe(200)
        expect(response.region).toBe('us-east-1')
        expect(response.triggerSource).toBe('PreSignUp_ExternalProvider')
        expect(response.userName).toBe('Google_115619098971084199595')
        expect(response.request.userAttributes.email).toBe('fjbarrientosg@gmail.com')
        expect(response.request.userAttributes.name).toBe('Franco')
        expect(response.request.userAttributes.family_name).toBe('Barrientos')
      }

      done()
    })
  }, 60000)

  test('Respuesta desde AWS: Usuario Facebook (fjbarrientosg@gmail.com)', (done) => {

    params.Payload = JSON.stringify(event02)

    lambda.invoke(params, function(err, data) {
      if (err) {
        console.log(err)
        expect(err.StatusCode).toBe(400)
      } else {
        let response = JSON.parse(data.Payload)

        expect(data.StatusCode).toBe(200)
        expect(response.region).toBe('us-east-1')
        expect(response.triggerSource).toBe('PreSignUp_ExternalProvider')
        expect(response.userName).toBe('Facebook_10217846363663521')
        expect(response.request.userAttributes.email).toBe('fjbarrientosg@gmail.com')
        expect(response.request.userAttributes.name).toBe('Franco')
        expect(response.request.userAttributes.family_name).toBe('Barrientos')
      }

      done()
    })
  }, 60000)

  test('Respuesta desde AWS: Usuario Cognito (fjbarrientosg@gmail.com)', (done) => {

    params.Payload = JSON.stringify(event03)

    lambda.invoke(params, function(err, data) {
      if (err) {
        console.log(err)
        expect(err.StatusCode).toBe(400)
      } else {
        let response = JSON.parse(data.Payload)

        expect(data.StatusCode).toBe(200)
        expect(response.errorMessage).toBe('#¡El email ya se ha registrado con Facebook y Google!#')
        expect(response.errorType).toBe('Error')
      }

      done()
    })
  }, 60000)

})