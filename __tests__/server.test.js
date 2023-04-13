'use strict';

const supertest = require('supertest');
const server = require('./../src/server.js');
const request = supertest(server.server);
const { db } = require('./../src/models');
const { expect } = require('@jest/globals');

beforeAll(async() => {
  await db.sync();
});
afterAll(async() => {
  await db.drop();
});

let testUser = {
    username: 'editor',
    password: 'editorpw',
    role: 'editor'
}

let admin = {
  username: 'admin',
  password: 'admin',
  role: 'admin'
}

let token;
let adminToken;

describe('Does the AUTH routes work', () => {

  test('Should post a success status if the user has signed up', 
  async() => {
    const response = await request
    .post('/signup')
    .send(testUser);

    const adminSignup = await request
    .post('/signup')
    .send(admin);
    adminToken = adminSignup.body.token;

    expect(response.status).toEqual(201);
    expect(adminSignup.status).toEqual(201)
    expect(response.body.token).toBeTruthy();
  })

  test('Should post a success status if the user successfully signs in', 
  async() => {
    const response = await request
    .post('/signin')
    .auth('editor', 'editorpw');
    token = response.body.token;
    expect(response.status).toEqual(200);
    expect(token).toBeTruthy();
  })
})

describe('Testing V1 - Unauthenticated API', () => {

  test('POST: Should add an item to the DB and returns an object with the added item', 
  async() => {
    const response = await request
    .post('/api/v1/clothes')
    .send({
      name: "test-dress",
      color: "red",
      size: "XL"
    });
    expect(response.status).toEqual(201);
    expect(response.body.name).toBe('test-dress');
  })

  test('GET: Should /api/v1/:model returns a list of :model items', 
  async() => {
    const response = await request
    .get('/api/v1/clothes');
    // console.log(response)
    expect(response.status).toEqual(200)
    expect(response._body[0].name).toBe('test-dress')
  })

  test('GET Should /api/v1/:model/ID returns a single item by ID.', 
  async() => {
    const response = await request
    .get('/api/v1/clothes/1');
    // console.log(response)
    expect(response.status).toEqual(200)
    expect(response._body.id).toEqual(1)
  })

  test('PUT Should /api/v1/:model/ID returns a single, updated item by ID', async()=> {
    const response = await request
    .put('/api/v1/clothes/1')
    .send({
      name: "test-dress-altered",
      color: "red",
      size: "XL"
    })
    // console.log(response._body);
    expect(response.status).toEqual(200)
    expect(response._body.name).toEqual('test-dress-altered');
    expect(response._body.id).toEqual(1);
  });

  test('DELETE /api/v1/:model/ID returns an empty object. Subsequent GET for the same ID should result in nothing found', async() => {
    const response = await request
    .delete('/api/v1/clothes/1')

    const getResponse = await request.get('/api/v1/clothes/1')

    // console.log(getResponse.body);
    expect(response.status).toEqual(200)
    expect(response.body).toBe(1);
    expect(getResponse.body).not.toBeTruthy
  })

})

describe('V2 (Authenticated API) routes', ()=>{

  test('POST /api/v2/:model which adds an item to the DB and returns an object with the added item', async ()=> {
    const response = await request
    .post('/api/v2/clothes')
    // .auth( testUser.username, testUser.password )
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: "test-dress-auth",
      color: "red",
      size: "XL"
    })

    // console.log(response.body)
    expect(response.status).toEqual(201)
    expect(response.body.name).toBe('test-dress-auth')
  })

  test('GET /api/v2/:model with a bearer token that has read permissions returns a list of :model items', async ()=> {
    // console.log(token)
    const response = await request
    .get('/api/v2/clothes')
    // .auth( testUser.username, testUser.password )
    .set('Authorization', `Bearer ${token}`)

    // console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.body[0]).toBeTruthy
  })

  test('GET /api/v2/:model/ID with a bearer token that has read permissions returns a single item by ID.', async ()=> {
    // console.log(token)
    const response = await request
    .get('/api/v2/clothes/2')
    .set('Authorization', `Bearer ${token}`)

    // console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.body.id).toBe(2)
  })

  test('PUT /api/v2/:model/ID with a bearer token that has update permissions returns a single, updated item by ID', async () => {
    const response = await request
    .put('/api/v2/clothes/2')
    .set('Authorization',  `Bearer ${token}`)
    .send({
      name: "test-dress-auth-altered",
      color: "red",
      size: "XL"
    })
    expect(response.status).toEqual(200)
    expect(response.body.id).toBe(2)
    expect(response.body.name).toEqual('test-dress-auth-altered');
  })

  test('DELETE /api/v2/:model/ID with a bearer token that has delete permissions returns an empty object. Subsequent GET for the same ID should result in nothing found.', async () => {
    const editorResponse = await request
    .delete('/api/v2/clothes/2')
    .set('Authorization',  `Bearer ${token}`)

    const adminReponse = await request
    .delete('/api/v2/clothes/2')
    .set('Authorization', `Bearer ${adminToken}`)

    console.log(adminReponse)

    expect(editorResponse.status).toEqual(500)
    expect(adminReponse.status).toEqual(200)
  })

})