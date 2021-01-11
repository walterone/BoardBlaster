
var path = require('path')
//var serveIndex = require('serve-index');
var serveIndex = require('./serve-index-modded');

const fse = require("fs-extra")
const fs = require("fs")

var express = require('express');
var app = express();
var striptags = require('striptags');
const fetch = require('node-fetch');
var download = require('download-file')
let settings = { method: "Get" };
var http = require('http').createServer(app);
var io = require('socket.io')(http);

 
var boardsComplete = {"boards":[
						{"letter":"wg","name":"Wallpapers/General"},
						{"letter":"a","name":"Anime & Manga"},
						{"letter":"w","name":"Anime Wallpapers"},
						{"letter":"p","name":"Photography"},
						{"letter":"hr","name":"High Resolution"},
						{"letter":"s","name":"Sexy Beautiful Women (NSFW)"},
						{"letter":"gif","name":"Adult GIF (NSFW)"},
						{"letter":"h","name":"Hentai (NSFW)"},
						{"letter":"hc","name":"Hardcore (NSFW)"}
						
						]}



//var boards = ["s","gif","h","hr", "a", "hc", "wg"];
var boards = [];

var filter = [];
var threadsRaw = [];

var currboard;

//indexes
var icat;
var ithreads;
var iwork;

//urls
var caturl;

//Percorsi
var rawOutPath = __dirname + "/Output/"
var mainOutPath;
var filterPath;
var thumbcache;

//Nomi thread già presenti
var booty;

//Variabili globali per i recheck dei download
var global_ThumbFilenames;
var global_ThumbThread;
var gloabl_thumbComplete = [];

//Variabile di gestione delle pagine
var skipDL = false;

//DB dei JSON
var allJSONs = [];

//Coda download
var dlQueue = [];


//---------------SETUP SECTION---------------
//Scegli setta path statica per cartella Output
app.use(express.static(path.join(__dirname, 'Output')));
app.use('/thumb', express.static(path.join(__dirname, 'web-assets/fico')))
//al percorso "/view" si trova il visualizer & alla root la dashboard
app.use('/view', express.static('Output'), serveIndex('Output', {'icons': true, 'view': 'details'}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});



//Setup Sockets
io.on('connection', (socket) => {

	//alla ricezione dell'evento
    socket.on('req-boards', () => {
    
   
    
   		// log('boards richieste (' + boards + ')');
   		//log('boards richieste (' + boardsComplete.boards + ')',1);
   	 	//Manda l'array di boards
   		 io.sockets.emit("boards", boardsComplete);
   		
   		 
			
			
   		 
  	});
  	
  	/*alla ricezione dell'evento + parametro
  	socket.on('scan', (selboard) => {
  	
  	 boardsComplete.boards.forEach((item, index)=>{
				//console.log(index, item.letter
				boards.push(item.letter);
    
    });
    
   	 //imposta la board ricevuta come atttiva
   	 currboard = selboard;
   	 //parte preload (DA eseguire prima della richiesta)
   	 preLoad();
   	 
   	 
   	 
  	});
  	*/
  	
  	socket.on('work', (threads) => {
  	
	//booleana usata per fermare il crawling delle pagine 	 
   	// stopPages = false;
   	 
   	 //funzione di "work" per il download/blacklist
   	 worker(threads);

  	});

	//funzione di eliminazione da viewer
	socket.on('delete', (percorso) => {
	
		
		
  		//cambio da url a directory
		var newpercorso = decodeURIComponent(percorso.replace('/view','/Output'));	
		
		//funzione di eliminazione cartella o file.
		deleteFile(__dirname + newpercorso);
  	});
  	
  	socket.on('skipDL', () => {
  		skipDL = true;
  		console.log(skipDL);
  	});
  	
  	socket.on('clear', (selboard) => {
	
	setup();
  	
	boardsComplete.boards.forEach((item, index)=>{
				//console.log(index, item.letter
				boards.push(item.letter);
    
    });
    
   	 //imposta la board ricevuta come atttiva
   	 currboard = selboard;
   	 //parte preload (DA eseguire prima della richiesta)
   	// preLoad();

  	});
  	
  	
  	socket.on('scan', (selboard) => {
  											
	
	boardsComplete.boards.forEach((item, index)=>{
				//console.log(index, item.letter
				boards.push(item.letter);
    
    });
    
   	 //imposta la board ricevuta come atttiva
   	 currboard = selboard;
   	 //parte preload (DA eseguire prima della richiesta)
   	// preLoad();

		 preLoad();

  	});
  	
  
  
  
  
  
  	socket.on('disconnect', () => { /*goodbye*/ });
});


function setup(){
//Fare funzione ad-hoc
											 boards = [];
											 filter = [];
											 threadsRaw = [];
											 currboard= "";
											 caturl= "";
											 rawOutPath = __dirname + "/Output/"
											 mainOutPath = "";
											 filterPath= "";
											 thumbcache= "";
											 booty;
											 global_ThumbFilenames = "";
											 global_ThumbThread = "";
											 gloabl_thumbComplete = [];
											 skipDL = false;

										//Variabile di gestione delle pagine
										//var stopPages = false;

										//DB dei JSON
											 allJSONs = [];

										//Coda download
											 dlQueue = [];



}


//---------------DELETION FUNCTION---------------
async function deleteFile(percorso){
	try{
		var isdir = fs.lstatSync(percorso).isDirectory();
	//è una directory?
		if(isdir){
				//Se elimino la cartella allora la metto nel filtro in Blacklist
				var toFilterArr = percorso.split('/').pop();
				var localboard = percorso.split('/').slice(-2)[0];

				var toFilter = toFilterArr.toString()
				if(!filter.includes(toFilter)){
					//log("STO FILTRANDO FIGA");
					log("Added to filter: " + toFilter + " (" + localboard + ")",1);
					await filterWork("filter", toFilter, localboard);
			
				};
				//carico dopo aver aggiornato il filtro
				await filterWork("load", toFilter, localboard);//carico il filtro della board specificata non quella globale
			//	log(filter);
			//delete folder
			try{
					fse.removeSync(percorso);
					log("Folder DELETED: " + percorso,1); 
					
			} catch(err) {
				log("ERRORE ELIMINAZIONE CARTELLA: \n" + err,3);
				deleteFile(percorso);
			}
		}else{
			//è un file, eliminalo solo
			try{
			
					fse.removeSync(percorso);
					log('File Deleted: ' +  percorso,1);
			
			}catch(err){
					log('ERRORE ELIMINAZIONE FILE!  ' + err,3);
		
			};
			
			
			

		}
		
	} catch (err){
		//file inesistente
		log("Errore generico nell'eliminazione: " + err,3);
	}
	
	
	
	
	
	
}



//---------------WORKER FUNCTION---------------

async function worker(workArray = []) {
			
	var localindex;

	for (iwork; iwork < workArray.length; iwork++){
	
			localindex = workArray[iwork].index;
			
			if(workArray[localindex].flag == "blk"){
				//fai blacklisting
				await filterWork("filter", allJSONs[localindex].name, "");
			//Ricarica filtro (NON FUNZIONA PIU', ISSUE GITHUB #6 https://github.com/walterone/BoardBlaster/issues/6)
				//await filterWork("load","", "");
			}
			else if (workArray[localindex].flag == "dwn"){
				//fai download:

				var jsonQueue = {	"name": allJSONs[localindex].name,
									"img": allJSONs[localindex].img
				};	
	
				//array coda di download
				dlQueue.push(jsonQueue);
				
				
			}else if (workArray[localindex].flag == "ign"){
				//do nothing, ignora
			}else{
				//exception
				log("ERRORE NEL WORKER",3)
			}
	
			
			
	
	
	}
	
	
	//fai partire funzione "worker" solo per i Downloads
	elaborator();
}







//---------------SCANNER FUNCTION---------------
async function scan() {
//console.log("INSCAN");
console.log(icat + "  ---  " + ithreads);

var stoptest = 0;

	//riceve il JSON del catalogo
	var catalogJSON = await getjson(caturl);
						
	//For che cicla attraverso i numeri delle pagine del catalogo!
	for (icat; icat < catalogJSON.length; icat++){
/*		OLD VERSION.
		if(stopPages){
			log("Showing page "+ icat + " of " + catalogJSON.length,0,0);
			//console.log("dlQueue: " + dlQueue);
			break
		}
*/

			//log("Showing page "+ (icat+1) + " of " + catalogJSON.length,0);
			
			stoptest++
			if(stoptest > 2){
			
			
				io.sockets.emit("done", "");
			
				log("Finito! Sto mostrando pag. "+ icat + " di " + catalogJSON.length,0);
				//console.log("dlQueue: " + dlQueue);
				break
			}


	/*START TEST	
	
	
		stoptest++
		//console.log("stoptest: " + stoptest);

		if(stoptest > 2){
			log("Showing page "+ icat + " of " + catalogJSON.length,0);
			//console.log("dlQueue: " + dlQueue);
			break
		}
		
	*/		
		//Toglie i primi due post inutili della prima pagina del catalogo
		//log(icat + " --- " + ithreads);
if(icat == 0 && currboard == "s"){
	ithreads = 2;
}else{
	ithreads = 0;
}




		
console.log(ithreads);	
		//For che cicla attraverso i singoli numeri di thread dentro la pagina attuale del catalogo.
		for (ithreads; ithreads < catalogJSON[icat].threads.length; ithreads++){
		
			//All'inizio dell'elaborazione dei thread nella pagina, viene settata la variabile true così che il for delle pagine quando ritorna ad estrarre esca con un break
			//Quando dalla pagina web verrà chiesto di andare avanti allora verrà settata dall'elaborator come true.
			//l'indice delle pagine (icat) è globale e terrà l'ultima pagina elaborata in memoria.
			//stopPages = true;
			
			
			
			//Numero Thread
			var noThread = catalogJSON[icat].threads[ithreads].no;

			//crea URL dinamicamente (usando n. thread) per costruire l'url del file JSON specifico del thread.
			var thrjsonurl = "https://a.4cdn.org/"+ currboard +"/thread/" + noThread + ".json";

			//recupera il JSON con url nuovo.
			var threadFile = await getjson(thrjsonurl);

			//Controlla il nome e i caratteri speciali.
			var threadTitle = await getfixName(threadFile);
			/*
		
		STO ANCORA CERCANDO DI CAPIRE COME MAI OGNI TANTO ESCONO FUORI I THREAD RIPETUTI...
		Questo problema avviene ancora per: /a/, 
			
			*/
			
			
console.log("pag: "+icat+ "| n."+ithreads +"  -  "+threadTitle+"  -  "+ catalogJSON[icat].threads[ithreads].sub);
//Titolo Thread trovato
//log(threadTitle,0);

			
			//se il nome del thread è incluso nel filtro allora salta
			//Forse per il futuro sarebbe meglio fare l'associazione con il numero per evitare onomini
			if(filter.includes(threadTitle)){
				log("FilterInfo: " + threadTitle + " is blacklisted, skipping...",1);
				continue;
				
			};
			
			booty = fse.readdirSync(mainOutPath);

	

			

			/*  L'idea è avare una struttura JSON con dentro tutte le info per permettere di scaricare
				(in futuro anche ad un sw esterno) tutto in autonomia senza girare per variabili:
			
									
									
									
					STRUTTURA FINALE:				
									
					jsonDataScan = {"num":noThread,			N. ID del thread
									"name": threadTitle,	Titolo thread
									"img":[]				Tutte le immagini presenti nel thread
									"maximgs"				massimo numero immagini nel thread
									"thumbs"				filename con i thumbs (finiscono con "s")
									"threadName"			Nome del thread
									"alreadyDL":y/n			Già scaricata?
									};	
			
			*/
			
			
			var jsonDataScan = {"num":noThread,
								"name": threadTitle,
								"img":[],
								"thumbs": []
								};	
			var prevImgs = [];
			var thumbImgs = [];
			var loadThumbs = true;
			var indexThumbs = 0;
			
			//per tutta la lunghezza del thread (guarda tutti i post)
			for(var i = 0; i < threadFile.posts.length; i++){
			
			//controllo se tra i dati del post c'è un estensione (e quindi c'è un media).
						if(threadFile.posts[i].hasOwnProperty('ext')){
						
							//popolo le variabili globali con i dati dell'immagine		
							
							//Time è il nome file	
							currTime = threadFile.posts[i].tim;
							//Ext è l'estensione
							currExt = threadFile.posts[i].ext;
							//L'array viene popolato da tutte le immagini presenti nel thread
							prevImgs.push(currTime+currExt);
							
							//sistema di caricamento dei nomi thumbs nell'array.
							if(loadThumbs){
								
								thumbImgs.push(currTime+"s.jpg");
								//thumbImgs.push(currTime+currExt);
								
								indexThumbs++
								
								if(indexThumbs > 2){loadThumbs = false}
								//log(thumbImgs);	
							}
													
					
						}else{
						//se non c'è estensione è un commento. bypassiamolo.
						}
			
			
			};
			
			
			//Variabile globale per immagazzinare le thumbnails
			gloabl_thumbComplete = [];
			
			//Effettua download delle prime 3 thumbnails
			for(var i = 0; i < thumbImgs.length; i++){
			
				await getThumbs(thumbImgs[i], threadTitle);
			
			}
			
			if(booty.includes(threadTitle)){
				//Sarebbe possibile implementare anche un sistema di confronto tra quante immagini ci sono scaricate e quante sono su 4chan.
				console.log("CARTELLA GIA' SCARICATA!");
				//Variabile che indica se il thread è già stato scaricato
				jsonDataScan.alreadyDL = true;
				
			}else{
				jsonDataScan.alreadyDL = false;

			}
			
			
			//Variabile che indica quante immagini sono nel thread 
			jsonDataScan.maximgs = prevImgs.length;
			//Inserisco nell'array IMG solo le immagini delle thumbnail (le prime 3)
			jsonDataScan.img = prevImgs;
			//Aggiunta al json le thumbs scaricate 
			jsonDataScan.thumbs = gloabl_thumbComplete;
			
	
			var json = jsonDataScan;
			
			
			//a questo punto abbiamo un oggetto JSON con tutte le info che ci servono:
			//num: Numero thread
			//name: Nome thread
			//img: sono le prime 3 immagini in formato thumbnail (s finale)
			//maximgs: numero delle immagini che ha trovato? (sempre in ambito thumbs)
			
		
			allJSONs.push(json);

 		
 			var stringedjson = JSON.stringify(json);
 		
 		
			
			//console.log(stringedjson);
   			io.sockets.emit("ScanRes", stringedjson);
		
			
		};
		
	}

}



//---------------ELABORATOR FUNCTION---------------

async function elaborator(){

	
	for (var i = 0; i < dlQueue.length; i++) {
		var current = dlQueue[i];
		var obj = {
					"currimg": 0,
					"maximg":current.img.length,
					"desc": current.name
				  }
		log("sto elaborando "+ current.name,0);
		log(current.img.length + " files",0);
		
		for(var i2 = 0; i2 < current.img.length; i2++){
		console.log(skipDL);
			if(!skipDL){
				await filedownload(current.img[i2],current.name);
				obj.currimg = (i2 + 1);
				log("Scaricato " + (i2 + 1) + "/" + current.img.length,1);
				io.sockets.emit("progBar", JSON.stringify(obj));
			
			}else{
				break;
			
			}
			
		
		}
		//dlQueue = dlQueue.filter((item) => item.name !== current.name);
		//dlQueue.shift()
		
		skipDL = false;
		log("SKIPPED THREAD DOWNLOAD",1);
		console.log(dlQueue);
		
 
 
	}
	
	//In questo modo il crawling (che avviene dentro la funzione scan()) viene riavviato alla fine dell'elaborazione.
	//Dato che gli indici sono globali allora è possibile fermare e startare il crawl senza perdere la pagina
	//TEST: Far continuare il crawl e vedere se si riesce ad effettuare il DL in maniera Asyncrona.
	log("Servo le prossime immagini, attendere...",0);
	dlQueue = [];
	//ithreads = 0;
	scan();


}

//---------------MEDIA DOWNLOADER FUNCTION---------------
async function filedownload(img,thrtitle){
	return new Promise(function(resolve, reject) {
		//costruita prima parte del path
		var temp = mainOutPath  + thrtitle + "/";
		//costruito url del cdn
		var url = "https://i.4cdn.org/"+ currboard +"/" + img;
		
		//crea il path di sistema per l'immagine
		var file = mainOutPath  + thrtitle + "/" + img;
		
		//log(file);
		// Controllo se il file con path imgPath esiste
		try {
			if(fse.existsSync(file)) {
				//immagine esiste, non fa niente
				log("FILE ESISTENTE: " + file,2);
				resolve();
			} else {
				//immagine non esiste, scaricarla
			
				
				
				
				//setto directory di destinazione
				var options = {directory: temp}
				//download effettivo (npm)
				download(url, options, function(err){
					if (err){
					log("ERRORE DI DOWNLOAD",3);
					//throw err
					//riprova download con i dati globali
					filedownload(img, thrtitle);
					}
					//log("downloaded!")
					resolve();
				}) 
			}
		} catch (err) {
			console.error(err);
		}
	});
}

//LEGACY DOWNLOAD FUNCTION (Da 4CC V1)
/*
async function filedownload(filename,path,thread){
	return new Promise(function(resolve, reject) {
		//costruita prima parte del path
		var temp = path  + thrtitle + "/";
		//costruzione url del cdn
		var url = "https://i.4cdn.org/"+ boards[currboard] +"/" + filename;
		//assegnazione a costante globale.
		imgUrl = url;
		//crea il path di sistema per l'immagine
		var file = mainOutPath  + thrtitle + "/" + time + ext;
		//spingo il valore dentro la costante globale
		imgPath = file;
		//log(file);
		// Controllo se il file con path imgPath esiste
		try {
			if(fs.existsSync(file)) {
				//immagine esiste, non fa niente
				imgExists = true;
				resolve();
			} else {
				//immagine non esiste, scaricarla
			
				imgExists = false;
				
				
				//setto directory di destinazione
				var options = {directory: temp}
				//download effettivo (npm)
				download(url, options, function(err){
					if (err){
					log("ERRORE DI DOWNLOAD");
					//throw err
					//riprova download con i dati globali
					filedownload(currTime,currExt,threadTitle);
					}
					//log("downloaded!")
					resolve();
				}) 
			}
		} catch (err) {
			console.error(err);
		}
	});
}

*/


//---------------THUMBNAILS DOWNLOADER FUNCTION---------------
async function getThumbs(img,thrtitle){
	return new Promise(function(resolve, reject) {
		
		
	
		//costruita prima parte del path
		var temp = thumbcache  + thrtitle + "/";
		//costruito url del cdn
		var url = "https://i.4cdn.org/"+ currboard +"/" + img;
		
		//crea il path di sistema per l'immagine
		var file = temp  + img;
		
		//log(file);
		// Controllo se il file con path imgPath esiste
		try {
			if(fse.existsSync(file)) {
				//immagine esiste, non fa niente
				log("THUMBNAIL ESISTENTE: " + file,2);
				resolve();
			} else {
				//immagine non esiste, scaricarla
			
				
				
				
				//setto directory di destinazione
				var options = {directory: temp}
				
				
				//console.log(file.substring(file.indexOf("thumbs")));
				
				//download effettivo (npm)
				download(url, options, function(err){
					if (err){
					console.log(url + " --- " + err);
					log("ERRORE DI DOWNLOAD THUMBNAIL",3);
					//throw err
					//riprova download con i dati globali
					getThumbs(img, thrtitle);
					}
					//log("downloaded!")
					gloabl_thumbComplete.push(file.substring(file.indexOf("thumbs")));

					resolve();
				}) 
			}
		} catch (err) {
			console.error(err);
		}
	});
}





//---------------PRELOAD FUNCTION---------------
//Funzione di impostazione path & variabili
//ESEGUIRE QUESTE OPERAZIONI ALL'AVVIO PRELIMINARE
async function preLoad(){
	log("STARTING ...",0);
//rawOutPath = "/Users/walterone/Documents/NodeJS/BoardsBlaster/Output/";
	rawOutPath = __dirname + "/Output/"
	//thumbcache = "/Users/walterone/Documents/NodeJS/BoardsBlaster/Output/thumbs/";
	thumbcache = __dirname + "/Output/thumbs/"
	//Set indexes
	 icat = 0;
	 ithreads = 0;
	 iwork = 0;
	
	caturl = "https://a.4cdn.org/" + currboard + "/catalog.json"//CURRBOARD NECESSARIO
	//controllo cartella output
	if(!await checkFolder(rawOutPath)){
		//non esiste, crea
		await folderMake(rawOutPath);
	}else{
	
	//esiste, fine.
	}
	//path del filter è la cartella di output
	filterPath = rawOutPath;
	//mainpath ora porta la cartella della board
	
	mainOutPath = rawOutPath.concat(currboard + "/");//CURRBOARD NECESSARIO
	

	
	//Funzione di reset delle immagini thumbnail
	await resetThumbs();
	
	
	
	
	

	//controllo e creazione cartella della board.
	if(!await checkFolder(mainOutPath)){ //MAINPATH NECESSARIA
		//non esiste, crea
		await folderMake(mainOutPath);
	}else{
	
	//esiste, fine.
	}
	
	
	
	//filtro per ogni cartella board
	
	//tuning path filtro, è dentro la cartella della boarda con suffisso "-filter"
	filterPath = filterPath.concat(currboard + "/" + currboard + "-filter" );
	//controllo esistenza file filtro
	if(!await filterStart(filterPath)){
		//errore
		log("ERRORE CARICAMENTO FILTRO",3);
		//ripeto main
		preLoad()
	}else{
	
	//ok
	
	}
	if (fse.existsSync(filterPath)){
					//file created successfully		
					console.log("TUTTO OK");
				} else {
				
					throw new Error("ERRORE, FILE FILTRO NON CREATO (folderMake())")  	;		
			}
	//caricamento termini di filtraggio
	await filterWork("load","","");
	//show filter in console
	//log(filter);
	log("--Ready to Crawl--",1);
	//Funzione di scan
	//scan();
	
	elaborator();

}

//---------------RESETTHUMBS FUNCTION---------------
async function resetThumbs(name){
	return new Promise(function(resolve, reject) {
	
	try{
			//elimina la cartella thumbcache
			fse.removeSync(thumbcache);
		
  
			
			//e la ricrea
			folderMake(thumbcache);
			
		} catch(err) {
			log(err,3);
		}
		log("Thumbs resetted",1); 

		resolve()
	
	});
}

//---------------CHECK FOLDER FUNCTION---------------
async function checkFolder(name){
	return new Promise(function(resolve, reject) {
	var status;
	if (!fse.existsSync(name)){
			//se non esiste crea la cartella
			status = false;
    		resolve(status);
    		
		}else{
			status = true;
			resolve(status);
			//altrimenti continua.
		}

	
	resolve();
	});
}


//crea la cartella usando le costanti globali dette sopra
async function folderMake(path){
	return new Promise(function(resolve, reject) {
	//crea cartella
	fse.mkdirSync(path);
	
	resolve();
	});
}

async function filterStart(pathfile){
	return new Promise(function(resolve, reject) {
	//log(pathfile);
	//esiste il file?
	if (!fse.existsSync(pathfile)){
			//non esiste il filtro, lo creo
			log("file filtro inesistente, creazione" + pathfile,2);
			
		fs.writeFileSync(pathfile, "", err => {
  			if (err) {
    		console.error(err)
    		resolve(false);
  			}
			
  			
		})
    		
	}else{
			log("Filter Found!",1);
			//esiste, stop
	}

	
	resolve(true);
	});
}

//funzione speciale che, in base al tipo di lavoro scelto, effettua delle operazioni:
// FILTER WORK = Il tipo di lavoro
//		Load: carica file filtro in un array per poi essere usato
//		Filter: Crea una rule nuova di blacklist
async function filterWork(typeOfWork, somedata, board){

//			USARE I NOMI PER FILTRARE A MENO CHE NON SI VUOLE CREARE UN SISTEMA PER GESTIRE LE ASSOCIAZIONI ID E NOME THREAD/CARTELLE	


	return new Promise(function(resolve, reject) {
		
		if(board == ""){
			var localFilterPath = filterPath;
		}else if(boards.includes(board)){
			var localFilterPath = rawOutPath.concat(board + "/" + board + "-filter" );
			
		
		}
		//log("loaclfilterpath: " + localFilterPath,0);
	
		//se deve caricare 
		if(typeOfWork == "load"){
			//setta tutti gli array vuoti
			var prefilter = [];
			filter = [];
			//carica e legge i chars dividendoli per newline
			//console.log(localFilterPath);
			var buf = fse.readFileSync(localFilterPath);
			buf.toString().split(/\n/).forEach(function(line){
				//pusha nell'array prefilter
				prefilter.push(line);
				
				prefilter = prefilter.filter(item => item);
				//con New Set permette di non avere duplicati
				//TODO: In futuro da creare un match via regex per non dover blacklistare milioni di cose
				filter = [...new Set(prefilter)];
				
			});
			
			log("Filtering " + filter.length + " threads:",2);
			console.log(filter);

		
		//altrimenti se deve filtrare
		}else if (typeOfWork == "filter")
		{
			
			log('Filtro: ' + somedata,1);
			//log(localFilterPath,0);
			//aggiungi il nome thread nel filtro + newline
			fse.appendFile(localFilterPath, somedata + "\n", (err) => {
  				if (err) log(err,3);
  				
  				//tutto ok!
  					//log('The "data to append" was appended to file!');
			});
			
		
		
	
		}
	
				resolve();
	});
}



//controlla se ci sono caratteri illegali nel nome del thread.
async function getfixName(mainThr){
	return new Promise(function(resolve, reject) {
		//titolo provvisorio pre-slice
		var temptitle = "";
		
		//in base all'esistenza di titolo o sottotitolo, genera un titolo di massimo 150 caratteri.
		
		//Se il post iniziale del thread ha il titolo
		if(mainThr.posts[0].hasOwnProperty('sub')){
			//imposta il titolo
			temptitle = temptitle.concat(mainThr.posts[0].sub);
		//se ha il commento e non c'era il titolo
		}else if(mainThr.posts[0].hasOwnProperty('com') && temptitle == ""){
			//metti il titolo formattato con semantic_url(che in realtà è il commento)
			temptitle = temptitle.concat(mainThr.posts[0].semantic_url);
		//se ha il commento e c'era anche il titolo
		}else{
			//concatena al titolo il commento non formattato (fromattare con funzion js)
			temptitle = temptitle.concat(" - ",mainThr.posts[0].semantic_url);
		};
		
		//toglie le tag html dall'input
		striptags(temptitle);
		
		//se titolo questo, riprova 
		if(temptitle == "image-failed-to-load-click-to-retry"){
			log("ERRORE NEL CARICAMENTO, RETRY",3);
			getfixName(mainThr)
		}
		
		//titolo provvisorio pre-sanificazione
		var temptitle2=temptitle.substring(0, 150);
		
		// Controlla per i caratteri speciali indicati qui (non è stato implementato il punto di domanda):
		//https://stackoverflow.com/questions/1976007/what-characters-are-forbidden-in-windows-and-linux-directory-names
		var threadTitle = temptitle2.replace(/[#_:/<*>\'\"\\?']/g,'');
		//log("Da getfixName: " + threadTitle);
	
 		 //restituisce il titolo del thread completo
 		 resolve(threadTitle);
	});
}




//Funzione di logging migliorata
/*
	Data: La stringa con i dati da mostrare
	
	Levels:
		0: LOGGING/TESTING
		1: INFO
		2: WARN
		3: ERROR
		
	sendToDash: Valore booleano per capire se il log è da mandare alla dashboard web.
		
	
*/
async function log(data, lvl) {

let date_ob = new Date();
var level;
let showLogs;

// current date
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);

// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// current year
//let year = date_ob.getFullYear();

// current hours
let hours = date_ob.getHours();

// current minutes
let minutes = date_ob.getMinutes();

// current seconds
let seconds = date_ob.getSeconds();

let milliseconds = date_ob.getMilliseconds();

// prints date & time in MM-DD HH:MM:SS:MS format
//var timestamp = "[" + date + "-" + month + " " + hours + ":" + minutes + ":" + seconds + ":" + milliseconds +  "]";

// prints date & time in HH:MM:SS:MS format
var timestamp = "[" + hours + ":" + minutes + ":" + seconds + ":" + milliseconds +  "]";


//var timestamp = Math.floor(Date.now()/1000);

if(lvl == 0){
level = "###[TESTING]: ";
showLogs = true;
}else if(lvl == 1){
level = "[LOGGING]: ";
showLogs = true;
}else if(lvl == 2){
level = "[WARN]: ";
showLogs = true;
}else if(lvl == 3){
level = "[ERROR!!!]: ";
showLogs = true;
}else{

console.log("ERRORE NEL LIVELLO DEL LOG | funzione: log()");
}



if(showLogs == true){

	if(lvl == 0 || lvl == 1 || lvl == 2 || lvl == 3){
				io.sockets.emit("comms",{ comm: timestamp+level+data, swtch: null });

		//sendtosocket

	}



	console.log(timestamp+level+data);


}




}



//preleva file JSON da url,
async function getjson(url) {
    return new Promise(function(resolve, reject) {
		fetch(url, settings)
		.then(res => res.json())
		.then((json) => {
			var jsonfile = JSON.parse(JSON.stringify(json));
			//log("ricevuto JSON");
			//riceve il file e lo manda con callback (risolvendo la promessa)
			//console.log(url)
			resolve(jsonfile);
		});
    });
}





http.listen(3000, () => {
  log('server created on *:3000',1);
  
});
