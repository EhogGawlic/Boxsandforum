const express = require('express')
//const serverless = require("serverless-http")
//const router = express.Router()
const bodyParser = require('body-parser')
const ejs = require('ejs')
const fs = require('fs')
const app = express()
const { MongoClient } = require('mongodb');
const uri = process.env.PASSWORD;

const client = new MongoClient(uri);
const addDataAt = 654
const cafter = 1762

async function addData(data, cname, file, filename){
	try{
		await client.connect()
		
		const db = client.db('boxsand');
		const collection = db.collection('boxsandposts');
		const inserted = await collection.insertOne({
			title: cname,
			data: data,
			hasFile: file !== "NOFILE",
			file: file,
			filename: filename
		})
	} finally {
		await client.close
	}

}
async function reqFeat(data, title){
	try{
		await client.connect()
		
		const db = client.db('boxsand');
		const collection = db.collection('requests');
		const inserted = await collection.insertOne({
			title: title,
			data: data,
			added: new Date().getTime(),
			updated: false
		})
	} finally {
		await client.close
	}

}
async function getAllData(user) {
	try {
		await client.connect();
		const db = client.db('boxsand');
		const collection = db.collection('boxsandposts');
		const requestscoll = db.collection("requests")
	
		// Find the first document in the collection
		const things = await collection.find({}).toArray();
		const requests = await requestscoll.find({}).toArray()
		let data = ``
		let rdata = ``
		things.forEach(thing => {
			data += `
				<div class="post">
					<h3>${thing.title}</h3>
					<p>${thing.data}</p>
					${
						thing.hasFile ? 
							`<br><a download="${thing.filename}.psave" href="data:text/base64,${thing.file}">Download ${thing.filename}</a>
							`:``
					}
				</div>
			`
		});
		let lastadded = 0
		let rn = 0
		requests.forEach(req =>{
			rdata += `
				<h2>${req.title}</h2>
				<p>${req.data}</p><br>
				${
					req.updated ? `<span style="color:green">Updated</span><br>`:rn===0?``:`<span style="color:red">Update pending</span><br>`
				}
			`
			if (!req.updated && req.added>lastadded){
				lastadded = req.added
			}
			rn++
		})
		console.log(requests[requests.length-1].added)
		app.get("/", (req, res)=>{
			res.render("main.html", {
				posts: data,
				reqs: rdata,
				lastreq: lastadded,
				username: user
			});
		})
	} finally {
		// Close the database connection when finished or an error occurs
		await client.close();
	}
}
async function logIn(username, password){
	try{
		await client.connect()
		const db = client.db('boxsand');
		const collection = db.collection('accounts');
		const accounts = await collection.find({}).toArray();
		accounts.forEach(account => {
			if (account.username === username && account.password === password){
				getAllData(username).catch(console.error)
			}
		})
	} finally {
		await client.close()
	}
}
getAllData("nobody").catch(console.error);
let data = "hi"
let files = []
let reqdata = ``
app.use(express.static(__dirname+ '\\'))
app.use(bodyParser.urlencoded({extend:true}));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);
app.engine('html', require('ejs').renderFile);
app.post('/posted.html', (req, res) => {
    const data = req.body.data; // Assuming your form has an input with name="data"
	const name = req.body.name
	const filedta = req.body.fileh
	const filename = req.body.filename
	addData(data, name, filedta, filename)
	res.send('Posted!'); // Send a response back to the client
});
app.post('/', (req,res)=>{
	getAllData("nobody").catch(console.error)
	res.send("<a href=\"localhost:3000/\">Go back</a>")
})
app.post('/req.html', (req, res) => {
	const title = req.body.title
	const text = req.body.text
	reqFeat(text, title)
	res.send("Requested!")
})
app.post("/gyat.html", (req, res) => {
	logIn(req.body.username, req.body.password)
	res.send("<a href=\"localhost:3000/\">Go back</a>")
})
app.post('/endsession.html', (req, res)=>{
	res.send("Session ended.")
})
app.listen(3000, (err)=>{
	if (err) throw err
	console.log("Connected!")
})
/*
router.get("/", (req, res) => {
    res.send("App is running..");
});
app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);*/
