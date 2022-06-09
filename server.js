const http = require("http");
const socketio = require("socket.io");
const Web3 = require("web3");
const axios = require("axios");
require('dotenv').config();

//Web3 Provider Connection
const infura_apiKey = process.env.INFURA_API_KEY;
const provider = new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/' + infura_apiKey);
var web3 = new Web3(provider);
provider.on('error', e => {
    console.log('WS Error', e);
    return;
});

//Server Config
const server = http.createServer((req,res)=> {
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.end("Server is running");
});

//Create Server
server.listen(3080, ()=> { 
    console.log("Server is running on port 3080"); 
});

//Socket.IO CORS
const io = socketio(server, { 
    cors:{ 
        origin: '*',
        methods: ['GET']
    }
});

//Short Function for Console.log
function log(text){console.log(text)}

//Sockets
io.sockets.on('connection', function(socket){

    socket.on('ethereumData', () => { ethereumData() })
    socket.on('allBlocks', () => { allBlocks(7) })
    socket.on('allTrans', () => { allTrans("latest","all",8) })
    socket.on('getBlockDetail', (data) => { getBlockDetail(data) })
    socket.on('getTxDetail', (data) => { getTxDetail(data) })

});

//Para Birimi Fonksiyonu
let formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });

//Ethereum Price Provider
async function ethereumData(){
    //const eth_apiKey = process.env.ETHERSCAN_API_KEY;
    //const eth_endpoint = `https://api.etherscan.io/api`;
    //const eth_supplies = await axios.get(eth_endpoint + `?module=stats&action=ethsupply&apikey=${eth_apiKey}`);
    //let totalSupply = formatter.format(eth_supplies.data.result.replace(/^0+/,'').replace(/0+$/,''));

    const eth = await axios.get('https://etherchain.org/api/basic_stats');
    let price_usd = eth.data.currentStats.price_usd;
    let price_btc = eth.data.currentStats.price_btc;
    let difficulty = (eth.data.currentStats.difficulty).toString();
    let latestBlock = eth.data.blocks[0].number;
    let hashrate = eth.data.currentStats.hashrate;
    let difficulty2 = difficulty.slice(0,4);
    io.sockets.emit('ethereumData', {eth_usd : price_usd, eth_btc: price_btc, eth_hashrate: hashrate, eth_latestblock: latestBlock, eth_difficulty: difficulty2});
}

//BLOCKS
async function allBlocks(n) {
    latestBlock=await web3.eth.getBlockNumber()
    try{
        for (let i = latestBlock - n; i <= latestBlock; i++) {
            try{
                web3.eth.getBlock(i).then((data,err)=>{
                    try{
                        io.sockets.emit('allBlocks', {"data": data, type:"all"});
                    }catch(err){
                        console.log("BLOCKS: " + err)
                    }
                })
            }catch(err){console.log("BLOCKS: " + err)}
        }
    }catch(err){console.log("BLOCKS: " + err)}
}


//TRANSACTIONS
async function allTrans(getNumber,type,n) {
    try{
        let block = await web3.eth.getBlock(getNumber);
        if (block != null && block.transactions != null) {
            for (let i = block.transactions.length - n; i < block.transactions.length; i++){
                try{
                    let tx = await web3.eth.getTransaction(block.transactions[i]);
                    let fiyat = Web3.utils.fromWei(tx.value, 'ether');
                    let v = {hash: tx.hash, number:block.number, timestamp: block.timestamp, value: fiyat, from:tx.from, to:tx.to};
                    io.sockets.emit('allTrans', {"data": v, type:type});
                }catch(err1){
                    console.log("2 - TRANSACTIONS: " + err1)
                }
            }
        }
    }catch(err2){
        console.log("1 - TRANSACTIONS: " + err2)
    }
}

//GetBLOCK
const getBlockDetail = (data) => {
    try{
        web3.eth.getBlock(data.blocknumber, (err, blokData) => {
            io.sockets.emit('getBlockDetail', blokData);
        })
    }catch(err){
        io.sockets.emit('getBlockDetail', {"type":"hata"});
    }
}


//transferDetay
const getTxDetail = (data) => {
    let tx = data.txid;
    web3.eth.getTransaction(tx, (req, tx) => {
        try{
            tx.value = Web3.utils.fromWei(tx.value, 'ether');
            io.sockets.emit('getTxDetail', tx);
        }catch (err){
            io.sockets.emit('getTxDetail', {"type":"hata"});
        }
    }) 
}


//Web3 Subscribe Function
web3.eth.subscribe('newBlockHeaders')
.on("data", (block) => {

    //Auto Block Sender
    io.sockets.emit('allBlocks', {"data": block, type:"abone"});

    //Auto Tx Sender
    allTrans(block.number,"abone", 8);


})
.on("error", (error) => {
    console.log("Web3 Connection error: " + error);
});

