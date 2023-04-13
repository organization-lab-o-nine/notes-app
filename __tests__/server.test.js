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
    username: 'user',
    password: 'user',
    role: 'user'
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
    expect(adminSignup.status).toEqual(201);
    expect(response.body.token).toBeTruthy();
  })

  test('Should post a success status if the user successfully signs in', 
  async() => {
    const response = await request
    .post('/signin')
    .auth('user', 'user');
    token = response.body.token;
    expect(response.status).toEqual(200);
    expect(token).toBeTruthy();
  })
})

describe('Testing V1 - Unauthenticated API', () => {

  test('POST: An unauthenticated user should NOT be able to do anything more than read contents', 
  async() => {
    const response = await request
    .post('/api/v1/note')
    .send({
      title: "TEST",
      content: "This is a test"
    });
    expect(response.status).toEqual(404);
  })

  test('GET: an unauthenticated user should be able to read published vents', 
  async() => {
    const response = await request
    .get('/api/v1/note')
    expect(response.status).toEqual(200);
    });

});

describe('V2 (Authenticated API) routes', ()=>{

  test('POST /api/v2/:model which adds an item to the DB and returns an object with the added item', async ()=> {
    const response = await request
    .post('/api/v2/note')
    // .auth( testUser.username, testUser.password )
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: "TEST",
      content: "this is a test string"
    })

    // console.log(response.body)
    expect(response.status).toEqual(201)
    expect(response.body.title).toBe('TEST')
  })

  test('GET /api/v2/:model with a bearer token that has read permissions returns a list of :model items', async ()=> {
    // console.log(token)
    const response = await request
    .get('/api/v2/note')
    // .auth( testUser.username, testUser.password )
    .set('Authorization', `Bearer ${adminToken}`)

    // console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.body[0]).toBeTruthy
  })

  test('GET /api/v2/:model/ID with a bearer token that has read permissions returns a single item by ID.', async ()=> {
    // console.log(token)
    const response = await request
    .get('/api/v2/note/1')
    .set('Authorization', `Bearer ${adminToken}`)

    console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.body.id).toBe(1)
  })

  test('PUT /api/v2/:model/ID with a bearer token that has update permissions returns a single, updated item by ID', async () => {
    const response = await request
    .put('/api/v2/note/1')
    .set('Authorization',  `Bearer ${adminToken}`)
    .send({
      title: "TEST",
      subtitle: 'this is a subtitle',
      content: "this is a test string"
    })
    expect(response.status).toEqual(200)
    expect(response.body.id).toBe(1)
    expect(response.body.title).toEqual('TEST');
  })

  test('DELETE /api/v2/:model/ID with a bearer token that has delete permissions returns an empty object. Subsequent GET for the same ID should result in nothing found.', async () => {
    const editorResponse = await request
    .delete('/api/v2/note/1')
    .set('Authorization',  `Bearer ${token}`)

    const adminReponse = await request
    .delete('/api/v2/note/1')
    .set('Authorization', `Bearer ${adminToken}`)

    // console.log(adminReponse)
    expect(editorResponse.status).toEqual(500)
    expect(adminReponse.status).toEqual(200)
  })

})