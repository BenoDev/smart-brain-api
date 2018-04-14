const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');

const appClarifai = new Clarifai.App({
 apiKey: 'dfcdf8d786de4e2bbe14a29f8b47f975'
});



const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'asd',
    database : 'smart-brain'
  }
});

db.select('*').from('users');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res)=>{
	res.send(database.users)
});

app.post('/signin', (req,res)=>{
	const {email,password} = req.body;
	if(!email || !password){
		return res.status(400).json('incorrect form submission')
	}
	db.select('email','hash').from('login')
	.where('email', '=', email)
	.then(data =>{
		const isValid = bcrypt.compareSync(password,data[0].hash);
		if(isValid){
			return db.select('*').from('users')
			.where('email', '=', email)
			.then(user =>{
				res.json(user[0])
			})
			.catch(err => res.status(400).json('Unable to get user'))
		}else{
			return res.status(400).json('Wrong credential')
		}
	})
	.catch((err)=>res.status(400).json('Wrong credential'))
})

app.post('/register', (req,res)=>{
	const {email,name,password} = req.body;
	if(!email || !name || ! password){
		return res.status(400).json('incorrect form submission')
	}
	const hash = bcrypt.hashSync(password);

	db.transaction(trx=>{
		trx.insert({
			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
		return trx('users')
			.returning('*')
			.insert({
				email:loginEmail[0],
				name:name,
				joined: new Date()
			}).then(user=>{
				res.send(user[0])
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err=>{
		res.status(400).json('Unable to register')
	})
	
})

app.get('/profile/:id',(req,res)=>{
	const {id} = req.params;
	db.select('*').from('users').where({id})
	.then(user =>{
		if(user.length){
			res.json(user[0])
		}else{
			res.status(400).json('Not found')
		}
		
	})
	.catch(err=>console.log('Error getting user'));
})

app.patch('/image', (req,res)=>{
	const {id} = req.body;
	db('users').where('id', '=' , id)
	.increment('entries',1)
	.returning('entries')
	.then(entries=>{
		res.json(entries[0])
	})
	.catch(err=> res.status(400).json('unable to get entries'))
})

app.post('/imageUrl', (req,res)=>{
	appClarifai.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
	.then(response=>res.json(response))
	.catch((err)=>res.status(400).json('Unable to work with API'))
})

app.listen(3000,()=>{
	console.log('app is running on port 3000')
})

