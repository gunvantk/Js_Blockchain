/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform,
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {
    
	constructor(data){
		this.hash = null;                                           // Hash of the block
		this.height = 0;                                            // Block Height (consecutive number of each block)
		this.body = Buffer.from(JSON.stringify(data)).toString('hex');   // Will contain the transactions stored in the block, by default it will encode the data
		this.time = 0;                                              // Timestamp for the Block creation
		this.previousBlockHash = null;                             
    }

    /**
     *  validate() method will validate if the block has been tampered or not.
     *  Been tampered means that someone from outside the application tried to change
     *  values in the block data as a consecuence the hash of the block should be different.
     */
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            var storedHash = self.hash;

            // Recalculate the hash of the Block
            var blockHash = SHA256(JSON.stringify(self)).toString();
           
            if(storedHash == blockHash){
              resolve(true);
            } else{
              resolve(false);
            }
        });
    }

    /**
     *  Auxiliary Method to return the block body (decoding the data)
     */
    getBData() {
        let self = this;
        return new Promise((resolve, reject) => {
            var bData =  JSON.parse(hex2ascii(self.body));

            if(self.previousBlockHash != null){
              resolve(bData);
            } else{
              reject('Genesis block');            }

        });
    }

}

module.exports.Block = Block;                  
