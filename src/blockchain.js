/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }
    
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     */
     _addBlock(block) {
        let self = this;
        let thisBlock = block;
        return new Promise(async (resolve, reject) => {
           if(self.height >= 0){
              thisBlock.previousBlockHash = self.chain[self.height].hash;
           }
           thisBlock.time = new Date().getTime().toString().slice(0,-3);
           thisBlock.height = await self.getChainHeight() +1;
           thisBlock.hash = await SHA256(JSON.stringify(thisBlock)).toString();  
           self.chain.push(block);
           self.height = parseInt(self.chain.length - 1);          
           resolve(thisBlock);
        });       
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
          let msg = `${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`;
          resolve(msg);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * @param {*} address
     * @param {*} message
     * @param {*} signature
     * @param {*} star
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let requestTime = parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            
            if ((currentTime - requestTime) >= (5 * 60)){
                reject('Error: Request timed out.');
            } 
            if (!bitcoinMessage.verify(message, address, signature)){
                reject('Error: Invalid message.');
            } 
            
            let block = new BlockClass.Block({ star });
            block.owner = address;
            block = await self._addBlock(block)
            resolve(block);             
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
          let block = self.chain.filter(p => p.hash === hash)[0];
          if(block){
              resolve(block);
          } else {
              resolve(null);
          }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object
     * with the height equal to the parameter `height`
     * @param {*} height
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {           
            let ownedBlocks = self.chain.filter(block => block.owner === address).forEach((b, i) => {
                 let data = b.getBData().then(block=> stars.push(block));             
                  });
              resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
          for (let block of self.chain) {
             if (await block.validate()) {
                 if (block.height > 0) {
                     let prevBlock = self.chain.filter(b => b.height === block.height - 1)[0];
                     if (block.previousBlockHash !== prevBlock.hash) {
                         errorLog.push(`Invalid block link: Block #${block.height} is not linked to the block #${block.height - 1}.`);
                     }
                 }
             } else {
                 errorLog.push(`Invalid block #${block.height}: ${block.hash}`)
             }
         }
         errorLog.length > 0 ? resolve(errorLog) : resolve('No errors.');
        });
    }

}

module.exports.Blockchain = Blockchain;
