// ********************** Libraries  **********************
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
var Web3 = require('web3');
const app=express();
const multer = require('multer');
const notifier = require('node-notifier');
const generatePDF = require('./generatePDF');
var LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const mongoose=require("mongoose");
const md5=require("md5");
const {create} = require('ipfs-http-client');
const ipfsAPI = require('ipfs-api');
var cookieParser = require('cookie-parser')
const encrypt=require("mongoose-encryption");
const Session=require("express-session");
const passport=require("passport");
var async = require("async");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const passportLocalMongoose=require("passport-local-mongoose");
app.use(express.static("public"));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
const Contract = require('truffle-contract');
var mongodb = require('mongodb');
app.set("view engine","ejs");
const Schema=mongoose.Schema;
app.use(bodyParser.urlencoded({
  extended:true
}));
var curId="";
var curname = "";
var web3;
const ObjectId = require('mongodb').ObjectId;
//********************** pdfmake  **********************
// const pdfMake = require("pdfmake/build/pdfmake");
// const pdfFonts = require("pdfmake/build/vfs_fonts");
// pdfMake.vfs = pdfFonts.pdfMake.vfs;

const pdfMake = require("pdfmake");
const fs = require("fs");
//const templatePath = path.join('..', 'views', 'template.ejs');
// Define the fonts to be used
const fonts = {
  Roboto: {
    normal: "node_modules/pdfmake/fonts/Roboto-Regular.ttf",
    bold: "node_modules/pdfmake/fonts/Roboto-Medium.ttf",
    italics: "node_modules/pdfmake/fonts/Roboto-Italic.ttf",
    bolditalics: "node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf",
  },
};

// Register the fonts
pdfMake.vfs = {
  Roboto: {
    normal: fonts.Roboto.normal,
    bold: fonts.Roboto.bold,
    italics: fonts.Roboto.italics,
    bolditalics: fonts.Roboto.bolditalics,
  },
};
const referSchema = new Schema({
    doctName:String,
    doct_to_refer:String,
    Patient:String
  });
  const refer =new mongoose.model("refer",referSchema);
const mediceneSchema = new Schema({
  idOfPatient:String,
idOfDoctor:String,
time:String,
medicine:String,
max_day:Date,
prev_day: {
  day: Number,
  month: Number,
  year: Number
}
  });
const mediceneTime=new mongoose.model("medicene",mediceneSchema);



// async function ipfsClient(){
//   const ipfs =await create(
//     {
//       host:"ipfs.infura.io",
//       port:5001,
//       protocol:"https"
//     }
//   );
//   return ipfs;
// }

// ********************** multer for file upload  **********************
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//const ipfs = new IPFS({ host: 'localhost', port: 5001, protocol: 'http' });
app.use(cookieParser('This is our secret'));
app.use(Session({
    secret:"This is our secret.",
    resave:false,
    saveUninitialized:false
  }));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb+srv://naman:NAMANjaypee@cluster0.fymme.mongodb.net/?retryWrites=true&w=majority"
 ).then(()=>console.log("Database Connection Success")).catch((h)=>console.log(h));

// ********************** End  **********************

// ********************** Schemas  **********************

 const patientSchema = new Schema({
 username:String,
 address:String,
 private_key:String,
 password:String
 });
 const doctorSchema = new Schema({
  username:String,
  address:String,
  private_key:String,
  password:String
  });
   
  patientSchema.plugin(passportLocalMongoose);
  doctorSchema.plugin(passportLocalMongoose);
// ********************** End  **********************
async function main() {
const contractABI = require('./build/contracts/DataSharingContract.json').abi;
const contractAddress = "0x694eFc43538D8f4B62408e390f33344E7d1473cC"

// const provider = new HDWalletProvider(
//     'hen found reflect wedding dirt ranch write inquiry dynamic degree acquire grow',
//     'https://goerli.infura.io/v3/3d78c8c1efcf487381ee08e93b75f9ef'
//   ); 
  
   web3 = new Web3('http://localhost:7545');

  const myContract = Contract({ abi: contractABI });
  myContract.setProvider(web3.currentProvider);
  instance = await myContract.at(contractAddress);
  
}

const projectId = '2Ob7hSy0PJpfSve3Qg6NxijgYTw'; 

const projectSecret = 'b87ee99dfa8a409e390d32fb141d9d50';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
main();
async function ipfsClient(){
  console.log("auth",auth)
  const ipfs = await create({
    host:"ipfs.infura.io",
    port:5001,
    protocol:"https",
    headers: {
        authorization: auth,
    }
  }
  );
  return ipfs; 
}




// ********************** IPFS data store  **********************

async function saveText(data){
  console.log("data",data)
  let ipfs = await ipfsClient();
  await ipfs.add(JSON.stringify(data)).then(result => {
    console.log(result.cid.toString());
    return result.cid.toString();
  }).catch(error => {
    console.error(error);
    return error;
  });
}


// ********************** Models  **********************

const patient=new mongoose.model("patientUser",patientSchema);
const doctor=new mongoose.model("doctorUser",doctorSchema);

// ********************** End  **********************

//********************** Authenitcation  **********************

passport.use('pat', new LocalStrategy(patient.authenticate())); 
passport.use('doc', new LocalStrategy(doctor.authenticate()));

passport.serializeUser(function(user, done) {
    curId=user.id;
    done(null, user.id);
  });
  passport.deserializeUser(function(user, done) {
      if(user!=null){
        curId=user;
      done(null,user);
      }
  });




      
//********************** Get  **********************

app.get("/",function(req,res){
    res.render("home");
});

app.get("/load/:curname/",function(req,res){
  var curname = req.params.curname;
  doctor.find().then(function(foundItems){


    patient.find({username:curname}).then(function(fitem){
                          console.log(curname);
      
      
      var tx1=[];
      var doctArray=[];
      
                          async function ans2(){
                            console.log(foundItems[0].private_key.substring(2));
                            let accounts = await web3.eth.getAccounts();
                            console.log(accounts);
                            web3.eth.defaultAccount = accounts[0];
                             console.log(foundItems[0].private_key);
                            // console.log(fitem[0].private_key);
                           tx1 = await instance.whoCanAccess({from :fitem[0].private_key});
                           tx2 = await instance.getCid({from :fitem[0].private_key});
                           console.log("tx2",tx2);
                          console.log("data hi data",tx1);
                          //iterating the object tx1 to get all ids
                          let promise1 = tx1.map(function(element) {
                            console.log(element);
                            return doctor.find({private_key: element}).then(function(fitem2) {
                              console.log("ITEMZZZ",fitem2);
                             if(fitem2.length >0) {
                              console.log("dfhsjfh",fitem2[0].username);
                              return fitem2[0].username;
                              }
                            });
                          });
                          let fields=[];
                          async function ipfs_data(originalString){
                            let ipfs = await ipfsClient();
                           // console.log(originalString)
                            const chunks = [];
                            for await (const chunk of ipfs.get(originalString)) {
                              chunks.push(chunk);
                            }
                            const data = Buffer.concat(chunks).toString();
                            return data;
                          }
                          let promise2 = tx2.map(async function(element) {
                            let originalString = web3.utils.hexToUtf8(element);

                              let ipfs = await ipfsClient();
                              let data = await ipfs_data(originalString);
                              let i = 1;
                              console.log("diata ",data);
                              console.log("emds");
                              var jsonStartIndex = data.indexOf('{'); 
                              var jsonString = data.slice(jsonStartIndex);
                              
                              console.log("yo yo yo",jsonString);
                              // console.log("jhfjdf");
                              jsonString = jsonString.replace(/\0/g, '');
                              return JSON.parse(jsonString);
                                let parsedJson = JSON.parse(jsonString);
                                //return parsedJson;
                                fields.push(parsedJson);
                                console.log("fields ",fields)
                            
                            //  fields.push(jsonString);
                             // fields =await fields.map(field => field.replace(/\0/g, ''));
                              // fields =await fields.map(field => field.replace(/ /g, ''));
     
                             //console.log("fielfs", fields)
                             return JSON.stringify(JSON.parse(jsonString));

                         
                          });
                          


                          Promise.all(promise1).then(function(results) {
                            console.log("vals", results);
                            
                             Promise.all(promise2).then(function(results2) {

                              console.log("ressss",results2);
                              
                            res.render("patientHome",{items:foundItems,username:curname,doct:results,curId:curId,data:results2});
                          });
                          });
                          }
                          ans2();
                        });  


  });
});



app.get("/load_doc/:curname/",function(req,res){
curname = req.params.curname;
doctor.find({username:curname}).then(function(foundItems){
                
                  

  var tx1;
  var patientArray=[]
  async function ans1(){
    console.log(foundItems[0].private_key.substring(2));
    let accounts = await web3.eth.getAccounts();
    console.log(accounts);
    web3.eth.defaultAccount = accounts[0];
     console.log(foundItems[0].private_key);
    // console.log(fitem[0].private_key);
   tx1 = await instance.getUser({from :foundItems[0].private_key});
   tx2 = await instance.getData({from :foundItems[0].private_key});
  console.log("data hizzzz data",tx1);
  console.log("doctors agaya",tx2);

  let promises = tx1.map(function(element) {
    console.log(element);
    return patient.find({private_key: element}).then(function(fitem2) {
      console.log("dfhsjfh",fitem2[0].username);
      return fitem2[0].username;
    });
  });
let fields=[];
async function ipfs_data(originalString){
  let ipfs = await ipfsClient();
 // console.log(originalString)
  const chunks = [];
  for await (const chunk of ipfs.get(originalString)) {
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks).toString();
  return data;
}
  let promise2 = tx2.map(async function(element) {
    let originalString = web3.utils.hexToUtf8(element);
   // async function getData(originalString1){
      // let ipfs = await ipfsClient();
      let data = await ipfs_data(originalString);
       console.log("date i found ",data);
      // console.log("fjsfd");
     // const dataiz  =  JSON.parse(dataz);
    //  console.log("date i found ",dataiz);
      
      let i = 1;
      // async function check(itr){
      //   return  Buffer.from(itr).toString();
      // }
      // console.log("name",data.image.name);
      // console.log("volume");
      // const diagnosis = {
      //   doctor: data.doctor,
      //   patient: data.patient,
      //   diagnosis: data.diagnosis,
      //   description: data.description,
      //   image: {
      //     data: Buffer.from(data.image.data).toString("base64"),
      //     name: data.image.name
      //   }
      // };
     // console.log(diagnosis)



     var jsonStartIndex = data.indexOf('{'); 
     var jsonString = data.slice(jsonStartIndex);
     
     console.log("yo yo yo",jsonString);
     // console.log("jhfjdf");
     jsonString = jsonString.replace(/\0/g, '');
     return JSON.parse(jsonString);
      //      const diagnosis = {
      //   doctor: data.doctor,
      //   patient: data.patient,
      //   diagnosis: data.diagnosis,
      //   description: data.description,
      //   image: {
      //     data: Buffer.from(data.image.data).toString("base64"),
      //     name: data.image.name
      //   }
      // };
     //console.log(diagnosis)
      //for await(const itr of data){
        //let valx = Buffer.from(itr).toString();
        //let valx = Buffer.from(itr).toString();;
      //   console.log("valx",valx);
      //   const braceIndex = valx.indexOf("{");
      //   valx = valx.slice(braceIndex);
      //   //console.log("cvalx",valx);
      //   fields.push(valx);
      //   fields =await fields.map(field => field.replace(/\0/g, ''));
      //   //console.log(fields);
      //   return JSON.parse(fields);
      // }
   // }
// getData(originalString);
 
  });
  
  Promise.all(promises).then(function(patientArray) {
    console.log("vals", patientArray);

    Promise.all(promise2).then(function(results2) {
      console.log("ressss2 ",results2)
    res.render("doctorHome",{username:curname,patients:patientArray,data:results2});
   
  
  });



  });


  }
  ans1();




})

//




});

app.get("/search/:cur_name/",function(req,res){
  cur_name=req.params.cur_name;
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based in JavaScript (0 - January, 1 - February, etc.)
  const currentYear = currentDate.getFullYear();
  
  mediceneTime.find({ idOfPatient: cur_name })
    .then(medicines => {
      console.log("meds ",medicines)
      const filteredMedicines = medicines.filter(medicine => {
       const cur_Date =  new Date()
        const medicineTime = medicine.time;
        const medicinePrevDay = medicine.prev_day;
        console.log("hELLO", medicine)
        console.log(medicineTime,currentTime);
        // Compare idOfPatient
        console.log("daydsd ",cur_Date,medicine.max_day);
        console.log( cur_Date <= medicine.max_day)
        if (medicine.idOfPatient === cur_name && cur_Date <= medicine.max_day) {
          // Compare medicineTime
          console.log("Yaha Bhi hai");
          console.log(medicineTime,currentTime);
          if (medicineTime > currentTime) {
            console.log(medicinePrevDay.day ,currentDay );
            // Compare prev_day
            if (
              medicinePrevDay.year < currentYear ||
              (medicinePrevDay.year === currentYear && medicinePrevDay.month < currentMonth) ||
              (medicinePrevDay.year === currentYear && medicinePrevDay.month === currentMonth && medicinePrevDay.day < currentDay)
            ) {
              return true;
            }
          }
        }
  
        return false;
      });
    res.render('search', { medicines: filteredMedicines,curname:cur_name });
  })
  .catch(error => {
    console.error('Error searching medicines:', error);
    res.sendStatus(500);
  });

});



app.get('/missed_medicines/:cur_name/', (req, res) => {
  const cur_name = req.params.cur_name;
  const checkDate = new Date("<YYYY-mm-dd>")
  const currentDay = new Date();
  currentDay.setDate(currentDay.getDate() - 1);
  mediceneTime.find({ idOfDoctor: cur_name })
    .then(medicines => {
      const missedMedicines = medicines.filter(medicine => {
        console.log("medicine ",medicine)
        const prevDay = new Date(medicine.prev_day.year, medicine.prev_day.month - 1, medicine.prev_day.day);
        console.log("prevDay ",prevDay)
        console.log("currentDay ",currentDay)
        return prevDay < currentDay ;
      });

      res.render('missed_medicines', { missedMedicines });
    })
    .catch(error => {
      console.error('Error retrieving missed medicines:', error);
      res.sendStatus(500); // Send an HTTP 500 response code or handle the error in a different way
    });
});

  
app.get("/Refer/:doctorJi",function(req,res){
doctorJi=req.params.doctorJi;
  doctor.find().then(function(foundItems){
    patient.find().then(function(foundItems1){
doctorJi=req.params.doctorJi;
  res.render("Refer",{item:foundItems,items:foundItems1,doct:doctorJi});
    });
  });
  
});

app.get("/referPat/:pat",function(req,res){
  pat=req.params.pat;
  refer.find({ Patient: pat }).then(function(result){
        console.log(result);
        res.render("Refferal",{results:result,username:pat});
})
});


//********************** Post  **********************

app.post("/LoginorRegister",function(req,res){
    // doctor.find().then(function(foundItems){
    curname = req.body.username;
    console.log(req.body.value);
    console.log(req.body.doc);
    if(req.body.value == 1){
        const tempDetails=new patient({
            username:req.body.username,
            password:req.body.password
          })
          const tempDetails1=new doctor({
            username:req.body.username,
            password:req.body.password
          })
          
          req.login(tempDetails1,function(err){
            //console.log("hello");
            if(err)
            console.log(err);
            else{
                if(req.body.doc == 1){
              passport.authenticate("doc")(req,res,function(){

//                 doctor.find({username:curname}).then(function(foundItems){
                
                  

//                   var tx1;
//                   async function ans1(){
//                     console.log(foundItems[0].private_key.substring(2));
//                     let accounts = await web3.eth.getAccounts();
//                     console.log(accounts);
//                     web3.eth.defaultAccount = accounts[0];
//                      console.log(foundItems[0].private_key);
//                     // console.log(fitem[0].private_key);
//                    tx1 = await instance.getUser({from :foundItems[0].private_key});
//                   console.log("data hizzzz data",tx1);
//                   }
//                   ans1();


                
                
//                 })

// //


//           res.render("doctorHome",{username:curname});
console.log("dfkjdkvfd")
             res.redirect("/load_doc/"+curname);



        
        });
            }else{
                passport.authenticate("pat")(req,res,function(){

//                   patient.find({username:curname}).then(function(fitem){
//                     console.log(curname);


// var tx1=[];
// var doctArray=[];

//                     async function ans2(){
//                       console.log(foundItems[0].private_key.substring(2));
//                       let accounts = await web3.eth.getAccounts();
//                       console.log(accounts);
//                       web3.eth.defaultAccount = accounts[0];
//                        console.log(foundItems[0].private_key);
//                       // console.log(fitem[0].private_key);
//                      tx1 = await instance.whoCanAccess({from :fitem[0].private_key});
                     
//                     console.log("data hi data",tx1);
//                     //iterating the object tx1 to get all ids
//                     let promises = tx1.map(function(element) {
//                       console.log(element);
//                       return doctor.find({private_key: element}).then(function(fitem2) {
//                         console.log("dfhsjfh",fitem2[0].username);
//                         return fitem2[0].username;
//                       });
//                     });
                    
//                     Promise.all(promises).then(function(doctArray) {
//                       console.log("vals", doctArray);
//                       res.render("patientHome",{items:foundItems,username:curname,doct:doctArray,curId:curId});
//                     }).catch(function(error) {
//                       console.log("Error:", error);
//                     });
//                     }
//                     ans2();
//                   });  
res.redirect("/load/"+curname);
                  });




            }
            }
          })
    }else{
        const account = web3.eth.accounts.create();
        console.log(`Address: ${account.address}`);
        console.log(`Private Key: ${account.privateKey}\n`);
        const user1 = {
            username: req.body.username,
            address: account.address,
            private_key:account.privateKey
          }
        if(req.body.doc == 1){
        doctor.register(user1,req.body.password,function(err,user){
              if(err)
              {
                console.log(err);
                res.redirect("/");
              }
              else
              {curName=req.body.username;
                passport.authenticate("doc")(req,res,function(err)
              {
                res.render("doctorHome");
              });
              }
            });  
        }else{
          //*********************Error reslove*********************
            patient.register(user1,req.body.password,function(err,user){
                  if(err)
                  {
                    console.log(err);
                    res.redirect("/");
                  }
                  else
                  {curName=req.body.username;
                    passport.authenticate("pat")(req,res,function(err)
                  {
                      console.log(foundItems);
                    

                      
                    res.render("patientHome",{items:foundItems,username:curname});
                  });
                  }
                });
        } 
    }
// });
});

app.post("/doctorDetails",function(req,res){
var doctName=req.body.docName;
console.log(doctName);
var pat_name = req.body.pat_name;

doctor.find({username:doctName}).then(function(foundItems){
  patient.find({username:pat_name}).then(function(fitem){
  

console.log(foundItems);
var tx;
async function ans(){
  console.log(foundItems[0].private_key.substring(2));
  let accounts = await web3.eth.getAccounts();
  console.log(accounts);
  web3.eth.defaultAccount = accounts[0];
  console.log(foundItems[0].private_key);
  console.log(fitem[0].private_key);
 tx = await instance.addAccess(foundItems[0].private_key,{from :fitem[0].private_key});
console.log(tx);
res.redirect("/load/"+fitem[0].username);
}
ans();
});

});
});

app.post("/removeAccess/:curname/:docm",function(req,res){
  const curname=req.params.curname;
  const docm=req.params.docm;
  doctor.find({username:docm}).then(function(foundItems){
  
      patient.find({username:curname}).then(function(fitem){

    var tx4;
async function ans4(){
  console.log(foundItems[0].private_key);
  console.log(fitem[0].private_key);
 tx4 = await instance.revokeAccess(foundItems[0].private_key,{from :fitem[0].private_key});
console.log(tx4);
res.redirect("/load/"+curname);



}
ans4();



});
  
  
  });





});


app.post("/updateRecord/:doct/:pat", upload.single('image'),function(req,res){
  diag=req.body.diag;
  desc=req.body.desc;
  doct=req.params.doct;
  pat=req.params.pat;
  const medicines = req.body.medicine;
  const times = req.body.time;
  const dates = req.body.date;
  // console.log("Medicine: " + medicine);
  // console.log("Time: " + time);
  var str="";


  for (let i = 0; i < medicines.length; i++) {
    str+=medicines[i]+",";
    const medicine = medicines[i];
    const time = times[i];
    const date = dates[i];
    const med = new mediceneTime({
      idOfPatient:pat,
      idOfDoctor:doct,
      time:times[i],
      medicine:medicines[i],
      max_day:dates[i],
      prev_day: {
        day: new Date().getDate() - 1,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    });
    med.save();
    // Process each medicine and time value
    console.log('Medicine:', medicine);
    console.log('Time:', time);
    console.log('Date:', date);
    console.log('---');

  }
const date = new Date();
const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
const formattedDate = date.toLocaleDateString('en-GB', options);
console.log(formattedDate); // Output: "07/05/2023"

  str = str.slice(0, -1);

  console.log("meds ", str)
  const { buffer, originalname } = req.file;
  const base64Image = buffer.toString('base64');
const diagnosis = {
  doctor:doct,
  patient:pat,
  diagnosis: diag,
  description: desc,
  image: {
    data: base64Image,
    name: originalname
  },
  medicine:str,
  date:date
};
//uncomment

patient.find({username:pat}).then(function(ittems){

  console.log("diag is xx ",JSON.stringify(diagnosis));
  async function stringifyDiagnosis(diagnosis) {
    return JSON.stringify(diagnosis);
  }
  async function ans5(){
    dz = await stringifyDiagnosis(diagnosis);
    let ipfs = await ipfsClient();
    console.log("here, ",dz);
   let result =  await ipfs.add(dz);
   
//change tx5
  var tx5;

    
    console.log("rest1",result.cid.toString());
    console.log("rest",web3.utils.asciiToHex(result.cid.toString()));
    rest = web3.utils.fromUtf8(result.cid.toString());
    rest = web3.utils.padRight(rest, 64);
   
   tx5 = await instance.addData(rest,ittems[0].private_key,{from :ittems[0].private_key});
  console.log("tx5",tx5);
  notifier.notify({
    title: 'Success',
    'message': 'Update Successful!',
    sound: true, 
    wait: true, 
  });
  res.redirect("/load_doc/"+doct);

  }
  ans5();

  

});


});

app.post("/generate_pdf",function(req,res){
console.log("report ",req.body.report);
     // Path to your EJS template file
     const templatePath = './views/template.ejs';
const outputPath = './output2.pdf';
const rep= JSON.parse(req.body.report);
console.log(req.body.report[0])
for (const [key, value] of Object.entries(rep)) {
  if(key !== 'image')
  console.log(key.toUpperCase());
}
// (async () => {
// await generatePDF(rep, templatePath, outputPath);
// res.setHeader('Content-Disposition', 'attachment; filename="output2.pdf"');
// res.setHeader('Content-Type', 'application/pdf');
// const fileStream = fs.createReadStream(outputPath);
//   fileStream.pipe(res);
// })();
generatePDF(rep, templatePath, outputPath)
.then(() => {
  // Set the appropriate headers for file download
  res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
  res.setHeader('Content-Type', 'application/pdf');

  // Stream the file as the response
  const fileStream = fs.createReadStream(outputPath);
  fileStream.pipe(res);
}).catch((error) => {
  console.error('Error generating PDF:', error);
  // Handle the error and send an appropriate response to the client
  res.status(500).send('Error generating PDF');
});

});

app.post('/updateMedicine', (req, res) => {
  const medicineIds = req.body.medicineIds; // Array of checked medicine IDs
  const cname = req.body.curname;
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based in JavaScript (0 - January, 1 - February, etc.)
  const currentYear = currentDate.getFullYear();

  mediceneTime.updateMany(
    { _id: { $in: medicineIds } }, // Update documents with matching IDs
    { prev_day: { day: currentDay, month: currentMonth, year: currentYear } }
  )
    .then(() => {
      console.log('Medicines updated successfully');
      // Handle the response or perform additional operations if needed
      res.redirect('/search/' + cname); // Redirect to the search results page or any other page
    })
    .catch(error => {
      console.error('Error updating medicines:', error);
      // Handle the error appropriately
      res.sendStatus(500); // Send an HTTP 500 response code or handle the error in a different way
    });
});

app.post("/Refer/", (req,res) => {
console.log(req.body);
const refers = new refer({
  doctName:req.body.doctorJi,
  doct_to_refer:req.body.docName,
  Patient:req.body.patName
});
refers.save();
res.redirect("/Refer/"+req.body.doctorJi);
});


app.post("/referAllow/",function(req,res){
  var id_refer=req.body.referralId;


  refer.find({_id:id_refer}).then(function(results){
    doctName = results.doct_to_refer;
    pat_name = results.Patient;




  console.log(doctName);
  var pat_name = req.body.pat_name;
  
  doctor.find({username:doctName}).then(function(foundItems){
    patient.find({username:pat_name}).then(function(fitem){
    
  
  console.log(foundItems);
  var tx;
  async function ans(){
    console.log(foundItems[0].private_key.substring(2));
    let accounts = await web3.eth.getAccounts();
    console.log(accounts);
    web3.eth.defaultAccount = accounts[0];
    console.log(foundItems[0].private_key);
    console.log(fitem[0].private_key);
   tx = await instance.addAccess(foundItems[0].private_key,{from :fitem[0].private_key});
  console.log(tx);
  res.redirect("/referPat/" + pat_name);
  }
  // ans();
  });
});
  });
  });


app.post("/rejectReferral/",function(req,res){
  console.log('fskfskfkjs')
  var id_refer=req.body.referralId;
  var pat = req.body.pat;
  console.log(id_refer);

  refer.deleteOne({_id:new mongodb.ObjectId(id_refer)}).then(function(foundItems){
console.log(foundItems);
res.redirect("/referPat/" + pat);
  });

})
//********************** Listen  **********************
app.listen(9008,function(req,res)
{
  console.log("Server started on port 9006");
})